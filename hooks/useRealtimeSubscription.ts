import { useEffect } from 'react';
import type { Database } from '@/types/supabase';

export type Message = Database['public']['Tables']['messages']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

export type RealtimeMessage = Message & {
  user: User;
};

export type RealtimeCallback<T> = (payload: {
  new: T;
  old: T | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}) => void;

export function useRealtimeSubscription<T>(
  channelName: string,
  event: string,
  callback: RealtimeCallback<T>
) {
  useEffect(() => {
    // Implementation here...
  }, [channelName, event, callback]);
} 