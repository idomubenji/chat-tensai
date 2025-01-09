"use client";

import { useRouter } from 'next/navigation';
import { useChannels } from '@/hooks/useChannels';
import { ChannelList } from '@/components/ChannelList';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ProfilePicture } from '@/components/ProfilePicture';
import { SignOutButton } from '@/components/SignOutButton';

export function Sidebar() {
  const router = useRouter();
  const { channels, loading, error, addChannel, deleteChannel } = useChannels();
  const { userId } = useAuth();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'ADMIN';

  const handleChannelSelect = async (channelId: string) => {
    console.log('=== Channel Selection Start ===');
    console.log('Selected channel ID:', channelId);
    console.log('Available channels:', channels);
    
    try {
      const selectedChannel = channels.find(c => c.id === channelId);
      if (selectedChannel) {
        console.log('Found selected channel:', selectedChannel);
        await router.replace(`/channels/${channelId}`, { scroll: false });
      } else {
        console.error('Selected channel not found in available channels');
        const generalChannel = channels.find(c => c.name === 'general');
        if (generalChannel) {
          console.log('Redirecting to general channel:', generalChannel.id);
          await router.replace(`/channels/${generalChannel.id}`, { scroll: false });
        }
      }
    } catch (error) {
      console.error('Error navigating to channel:', error);
    }
    
    console.log('=== Channel Selection End ===');
  };

  const handleAddChannel = async (name: string) => {
    try {
      await addChannel(name);
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      await deleteChannel(channelId);
      // Redirect to general if the current channel is deleted
      const currentPath = window.location.pathname;
      if (currentPath.includes(channelId)) {
        const generalChannel = channels.find(c => c.name === 'general');
        if (generalChannel) {
          router.replace(`/channels/${generalChannel.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-[#6F8FAF] p-4 h-full flex flex-col text-white">
        <div>Loading channels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-[#6F8FAF] p-4 h-full flex flex-col text-white">
        <div>Error loading channels</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#6F8FAF] p-4 h-full flex flex-col text-white">
      <div className="flex-grow overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">Workspace</h1>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="channels">
            <AccordionTrigger className="hover:text-gray-200">Channels</AccordionTrigger>
            <AccordionContent>
              <ChannelList
                channels={channels}
                onSelectChannel={handleChannelSelect}
                onAddChannel={handleAddChannel}
                onDeleteChannel={handleDeleteChannel}
                isAdmin={isAdmin}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="direct-messages">
            <AccordionTrigger className="hover:text-gray-200">Direct Messages</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-white hover:text-gray-200 hover:bg-[#5A7593]">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Alice
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:text-gray-200 hover:bg-[#5A7593]">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Bob
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:text-gray-200 hover:bg-[#5A7593]">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Charlie
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#5A7593] pt-4">
        <button 
          onClick={() => router.push('/settings')} 
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <ProfilePicture />
        </button>
        <SignOutButton />
      </div>
    </div>
  );
}
