'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export function useChannels() {
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setChannels(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();

    // Subscribe to changes
    const subscription = supabase
      .channel('channels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
        fetchChannels();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const addChannel = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error adding channel:', err);
      throw err;
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting channel:', err);
      throw err;
    }
  };

  return { channels, isLoading, error, addChannel, deleteChannel };
} 