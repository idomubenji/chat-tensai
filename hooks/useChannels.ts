import { useEffect, useState } from 'react';
import type { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchChannels() {
      try {
        const response = await fetch('/api/channels');
        if (!response.ok) throw new Error('Failed to fetch channels');
        const data = await response.json();
        setChannels(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch channels'));
      } finally {
        setLoading(false);
      }
    }

    fetchChannels();
  }, []);

  return { channels, loading, error };
} 