import { useEffect, useRef } from 'react';
import { RealtimeSubscription, createRealtimeSubscription } from '@/lib/realtime';
import type { Message, ChannelMember, User } from '@prisma/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SubscriptionType = 'messages' | 'members' | 'presence';

interface UseRealtimeSubscriptionProps {
  channelId?: string;
  type: SubscriptionType;
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtimeSubscription({
  channelId,
  type,
  onUpdate,
}: UseRealtimeSubscriptionProps) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!channelId && type !== 'presence') {
      return;
    }

    const subscription = createRealtimeSubscription(`${type}-${channelId || 'global'}`);
    subscriptionRef.current = subscription;

    switch (type) {
      case 'messages':
        if (channelId) {
          subscription.subscribeToMessages(channelId, onUpdate);
        }
        break;
      case 'members':
        if (channelId) {
          subscription.subscribeToChannelMembers(channelId, onUpdate);
        }
        break;
      case 'presence':
        subscription.subscribeToUserPresence(onUpdate);
        break;
    }

    return () => {
      subscription.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [channelId, type, onUpdate]);

  return subscriptionRef.current;
} 