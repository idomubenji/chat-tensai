'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];

export function useChannel(channelId: string) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('id', channelId)
          .single();

        if (error) throw error;
        setChannel(data);
      } catch (err) {
        console.error('Error fetching channel:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (channelId) {
      fetchChannel();
    }
  }, [channelId, supabase]);

  return { channel, isLoading, error };
} 