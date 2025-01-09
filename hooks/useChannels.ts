import { useEffect, useState } from 'react';
import type { Database } from '@/types/supabase';
import { useSupabaseClient } from '@/lib/supabase-auth';
import { useAuth } from '@clerk/nextjs';

type Channel = Database['public']['Tables']['channels']['Row'];

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useSupabaseClient();
  const { userId, getToken } = useAuth();

  useEffect(() => {
    async function fetchChannels() {
      try {
        console.log('Fetching channels for user:', userId);
        if (!userId) {
          throw new Error('Not authenticated');
        }

        // Get the token for debugging
        const token = await getToken({ template: 'supabase' });
        console.log('Using token:', token ? token.substring(0, 20) + '...' : 'No token');

        // First get the user's channel memberships
        console.log('Fetching channel memberships...');
        console.log('Query params:', { user_id: userId });
        const { data: memberships, error: membershipError, count } = await supabase
          .from('channel_members')
          .select('channel_id', { count: 'exact' })
          .eq('user_id', userId)
          .order('joined_at', { ascending: true });

        if (membershipError) {
          console.error('Error fetching memberships:', membershipError);
          throw membershipError;
        }

        console.log('Channel memberships query result:', {
          memberships,
          count,
          error: membershipError
        });

        if (!memberships || memberships.length === 0) {
          console.log('No channel memberships found');
          setChannels([]);
          return;
        }

        // Then fetch the channels the user is a member of
        console.log('Fetching channels...');
        const channelIds = memberships.map(m => m.channel_id);
        console.log('Channel IDs:', channelIds);
        const { data, error: fetchError } = await supabase
          .from('channels')
          .select('*')
          .in('id', channelIds)
          .order('created_at', { ascending: true });

        if (fetchError) {
          console.error('Error fetching channels:', fetchError);
          throw fetchError;
        }

        console.log('Channels fetched:', data);
        setChannels(data || []);
      } catch (err) {
        console.error('Error in fetchChannels:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch channels'));
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchChannels();

      // Subscribe to channel changes
      console.log('Setting up channel changes subscription...');
      const channelsSubscription = supabase
        .channel('channels-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'channels' 
          }, 
          (payload) => {
            console.log('Channel change detected:', payload);
            fetchChannels();
          }
        )
        .subscribe();

      // Also subscribe to channel membership changes
      console.log('Setting up membership changes subscription...');
      const membershipSubscription = supabase
        .channel('membership-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'channel_members'
          },
          (payload) => {
            console.log('Membership change detected:', payload);
            fetchChannels();
          }
        )
        .subscribe();

      return () => {
        console.log('Cleaning up subscriptions...');
        channelsSubscription.unsubscribe();
        membershipSubscription.unsubscribe();
      };
    } else {
      console.log('No userId, skipping channel fetch');
      setLoading(false);
      setChannels([]);
    }
  }, [supabase, userId, getToken]);

  const addChannel = async (name: string) => {
    try {
      console.log('Adding new channel:', name);
      if (!userId) throw new Error('Not authenticated');

      const { data: channel, error: createError } = await supabase
        .from('channels')
        .insert([
          {
            name,
            description: '',
            is_private: false,
            created_by_id: userId
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating channel:', createError);
        throw createError;
      }

      console.log('Channel created:', channel);

      // Add the creator as a member
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert({
          channel_id: channel.id,
          user_id: userId,
          role_in_channel: 'ADMIN'
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        throw memberError;
      }

      console.log('Creator added as channel member');
      return channel;
    } catch (err) {
      console.error('Error in addChannel:', err);
      throw err;
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      console.log('Deleting channel:', channelId);
      if (!userId) throw new Error('Not authenticated');

      const { error: deleteError } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (deleteError) {
        console.error('Error deleting channel:', deleteError);
        throw deleteError;
      }

      console.log('Channel deleted successfully');
    } catch (err) {
      console.error('Error in deleteChannel:', err);
      throw err;
    }
  };

  return { channels, loading, error, addChannel, deleteChannel };
} 