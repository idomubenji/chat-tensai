"use client";

import { useRouter } from 'next/navigation';
import { useChannels } from '@/hooks/useChannels';
import { ChannelList } from '@/components/ChannelList';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
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
import Image from 'next/image';
import useSWR from 'swr';

// Fetch function that SWR will use
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch user data');
  const data = await res.json();
  return data;
};

export function Sidebar() {
  const { user } = useSupabaseAuth();
  const { channels, isLoading } = useChannels();
  const router = useRouter();

  // Fetch user data from the database
  const { data: userData } = useSWR('/api/users/me', fetcher);

  if (!user) return null;

  const handleProfileClick = () => {
    router.push('/settings');
  };

  return (
    <div className="w-64 bg-[#6F8FAF] flex flex-col h-full">
      {/* Header with logo and title */}
      <div className="p-4 flex flex-col items-center gap-2">
        <Image
          src="/chat-tensai-icon.png"
          alt="Chat Tensai Logo"
          width={192}
          height={192}
        />
        <Image
          src="/chat-tensai-title.png"
          alt="Chat Tensai"
          width={200}
          height={40}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="single" collapsible defaultValue="channels">
          <AccordionItem value="channels" className="border-none">
            <AccordionTrigger className="px-4 text-white hover:no-underline hover:bg-[#5A7593]">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Channels</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ChannelList channels={channels} isLoading={isLoading} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Footer with profile and sign out */}
      <div className="p-4 border-t border-[#5A7593] flex items-center justify-between">
        <button
          onClick={handleProfileClick}
          className="hover:opacity-80 transition-opacity"
        >
          <ProfilePicture 
            avatarUrl={userData?.avatar_url}
            size="default"
            borderColor="black"
            borderWidth="thin"
          />
        </button>
        <SignOutButton />
      </div>
    </div>
  );
}
