import { supabase } from './supabase';
import type { Message, ChannelMember, User } from '@prisma/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
          table: 'Message',
          filter: `channelId=eq.${channelId}`,
        },
        callback
      )
      .subscribe();
  }

  subscribeToChannelMembers(channelId: string, callback: RealtimeCallback<ChannelMember>) {
    return this.channel
      .on<ChannelMember>(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'ChannelMember',
          filter: `channelId=eq.${channelId}`,
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
          table: 'User',
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