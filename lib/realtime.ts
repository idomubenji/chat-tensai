import { supabase } from './supabase';
import type { Database } from '@/types/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type Message = Database['public']['Tables']['messages']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

export type RealtimeMessage = Message & {
  user: User;
};

export interface RealtimePresenceState {
  user_id: string;
  online_at: string;
}

type RealtimeCallback<T extends { [key: string]: any }> = (payload: RealtimePostgresChangesPayload<T>) => void;

export class RealtimeSubscription {
  private channel: RealtimeChannel;
  private channelName: string;

  constructor(channelName: string) {
    this.channelName = channelName;
    this.channel = supabase.channel(channelName);
  }

  subscribeToMessages(channelId: string, callback: RealtimeCallback<Message>) {
    return this.channel
      .on<Message>(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        callback
      )
      .subscribe();
  }

  subscribeToUserPresence(callback: RealtimeCallback<User>) {
    return this.channel
      .on<User>(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: 'status=eq.ONLINE',
        },
        callback
      )
      .subscribe();
  }

  unsubscribe() {
    supabase.removeChannel(this.channel);
  }
}

// Helper function to create a new subscription
export const createRealtimeSubscription = (channelName: string) => {
  return new RealtimeSubscription(channelName);
}; 