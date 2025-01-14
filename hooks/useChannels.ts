'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import type { Database } from '@/types/supabase';

export function useChannels() {
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient<Database>();
  const { isLoaded, userId } = useSupabaseAuth();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
        // Clean up any existing subscription
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }

        // Create new subscription
        subscriptionRef.current = supabase
          .channel('channels')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'channels' 
          }, () => {
            fetchChannels();
          })
          .on('system', { event: 'error' }, (error) => {
            // Only log actual errors
            if (error.status !== 'ok') {
              console.error('Realtime subscription error:', error);
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to channels');
            } else if (status === 'CLOSED') {
              console.log('Channel subscription closed');
              // Only attempt reconnect if component is still mounted and we don't have an active subscription
              if (isMounted && subscriptionRef.current === null) {
                console.log('Attempting to reconnect...');
                // Recursive reconnection will be handled by the parent useEffect
              }
            }
          });
      }
    }

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [supabase, isLoaded, userId]);

  const addChannel = async (name: string) => {
    if (!userId) return null;

    try {
      setError(null);

      // Check channel limit
      if (channels.length >= 10) {
        throw new Error('Maximum number of channels (10) reached');
      }

      // Format channel name
      const formattedName = name.startsWith('#') ? name : `#${name}`;

      const { data, error } = await supabase
        .from('channels')
        .insert([{ 
          name: formattedName,
          created_by_id: userId
        }])
        .select()
        .single();

      if (error) {
        // Handle duplicate channel name error
        if (error.code === '23505') {
          throw new Error('A channel with this name already exists');
        }
        throw error;
      }

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