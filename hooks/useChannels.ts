'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import type { Database } from '@/types/supabase';

export function useChannels() {
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient<Database>();
  const { isLoaded, userId } = useSupabaseAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchChannels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Only fetch if we have a user
        if (!userId) {
          if (isMounted) {
            setChannels([]);
            setIsLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (isMounted) {
          setChannels(data || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching channels:', err);
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
          setChannels([]); // Reset channels on error
        }
      }
    };

    // Only fetch if auth is loaded
    if (isLoaded) {
      fetchChannels();

      // Subscribe to changes only if we have a user
      if (userId) {
        const subscription = supabase
          .channel('channels')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'channels' 
          }, () => {
            fetchChannels();
          })
          .on('error', (error) => {
            console.error('Realtime subscription error:', error);
            // Attempt to reconnect after a delay
            setTimeout(() => {
              if (subscription.state === 'closed') {
                console.log('Attempting to reconnect...');
                subscription.subscribe();
              }
            }, 5000);
          })
          .on('disconnect', () => {
            console.log('Realtime subscription disconnected');
            // Attempt to reconnect after a delay
            setTimeout(() => {
              if (subscription.state === 'closed') {
                console.log('Attempting to reconnect...');
                subscription.subscribe();
              }
            }, 5000);
          })
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    }

    return () => {
      isMounted = false;
    };
  }, [supabase, isLoaded, userId]);

  const addChannel = async (name: string) => {
    if (!userId) return null;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('channels')
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error adding channel:', err);
      setError(err as Error);
      throw err;
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!userId) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting channel:', err);
      setError(err as Error);
      throw err;
    }
  };

  return { channels, isLoading, error, addChannel, deleteChannel };
} 