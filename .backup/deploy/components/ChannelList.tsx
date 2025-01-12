'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import type { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];

interface ChannelListProps {
  channels: Channel[];
  isLoading: boolean;
}

export function ChannelList({ channels, isLoading }: ChannelListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-4 text-white">
        Loading channels...
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="p-4 text-white">
        No channels available
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <Button
          key={channel.id}
          variant="ghost"
          className="w-full justify-start text-white hover:text-gray-200 hover:bg-[#5A7593] px-6"
          onClick={() => router.push(`/channels/${channel.id}`)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          <span className="truncate">{channel.name}</span>
        </Button>
      ))}
    </div>
  );
}

