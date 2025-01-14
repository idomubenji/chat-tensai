'use client';

import { useParams } from 'next/navigation';
import { useChannel } from '@/hooks/useChannel';

export function TopBar() {
  const params = useParams();
  const channelId = params.channelId as string;
  const { channel, isLoading } = useChannel(channelId);

  return (
    <div className="flex items-center p-4 border-b border-black bg-gradient-to-r from-[#1F2937] to-[#475569]">
      <h1 className="text-3xl font-semibold text-white pl-4">
        {isLoading ? 'Loading...' : channel?.name || 'Unknown Channel'}
      </h1>
    </div>
  );
}

