'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';
import type { Database } from '@/types/supabase';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useChannels } from '@/hooks/useChannels';

type Channel = Database['public']['Tables']['channels']['Row'];

interface ChannelListProps {
  channels: Channel[];
  isLoading: boolean;
}

export function ChannelList({ channels, isLoading }: ChannelListProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { addChannel } = useChannels();

  const validateChannelName = (name: string) => {
    if (!name.trim()) {
      return 'Channel name cannot be empty';
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      return 'Channel name can only contain letters, numbers, and spaces';
    }
    return null;
  };

  const handleChannelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 25); // Enforce 25 character limit
    setChannelName(value);
    setError(validateChannelName(value));
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setChannelName('');
    setError(null);
    setIsCreating(false);
  };

  const handleCreateChannel = async () => {
    try {
      setIsCreating(true);
      setError(null);
      const formattedName = `#${channelName.trim()}`;
      const channel = await addChannel(formattedName);
      if (channel) {
        handleClose();
        router.push(`/channels/${channel.id}`);
      }
    } catch (err) {
      setError('Failed to create channel. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-white">
        Loading channels...
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {channels.length === 0 ? (
        <div className="p-4 text-white">
          No channels available
        </div>
      ) : (
        channels.map((channel) => (
          <Button
            key={channel.id}
            variant="ghost"
            className="w-full justify-start text-white hover:text-gray-200 hover:bg-[#5A7593] px-6"
            onClick={() => router.push(`/channels/${channel.id}`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="truncate">{channel.name}</span>
          </Button>
        ))
      )}
      {channels.length < 10 && (
        <>
          <div className="px-4 mt-4">
            <Button
              variant="outline"
              className="w-full justify-center text-black bg-white/90 hover:text-black hover:bg-white py-2 border-2 border-black rounded-full font-medium"
              onClick={() => setIsDialogOpen(true)}
            >
              + ADD CHANNEL
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleClose}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Channel</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={channelName}
                  onChange={handleChannelNameChange}
                  placeholder="Enter channel name..."
                  className={cn(
                    'w-full',
                    error && 'border-red-500 focus-visible:ring-red-500'
                  )}
                  maxLength={25}
                  disabled={isCreating}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-500">
                    {error}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  {channelName.length}/25 characters
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChannel}
                  className="bg-[#6F8FAF] hover:bg-[#5A7593] text-white"
                  disabled={!!error || !channelName.trim() || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add Channel'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

