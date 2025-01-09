import { useEffect, useState } from 'react';
import type { Database } from '@/types/supabase';
import { useAuth } from '@clerk/nextjs';

type Channel = Database['public']['Tables']['channels']['Row'];

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userId } = useAuth();

  useEffect(() => {
    async function fetchChannels() {
      try {
        console.log('=== DEBUG: FETCH CHANNELS START ===');
        console.log('Authenticated user ID:', userId);
        
        if (!userId) {
          throw new Error('Not authenticated');
        }

        // Fetch channels from our API endpoint
        const response = await fetch('/api/channels');
        if (!response.ok) {
          throw new Error(`Error fetching channels: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Channels fetched:', data);
        setChannels(data || []);
        console.log('=== DEBUG: FETCH CHANNELS END ===');
      } catch (err) {
        console.error('Error in fetchChannels:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch channels'));
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchChannels();
    } else {
      console.log('No userId, skipping channel fetch');
      setLoading(false);
      setChannels([]);
    }
  }, [userId]);

  const addChannel = async (name: string) => {
    try {
      console.log('Adding new channel:', name);
      if (!userId) throw new Error('Not authenticated');

      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: '',
          is_private: false
        })
      });

      if (!response.ok) {
        throw new Error(`Error creating channel: ${response.statusText}`);
      }

      const channel = await response.json();
      console.log('Channel created:', channel);
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

      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error deleting channel: ${response.statusText}`);
      }

      console.log('Channel deleted successfully');
    } catch (err) {
      console.error('Error in deleteChannel:', err);
      throw err;
    }
  };

  return { channels, loading, error, addChannel, deleteChannel };
} 