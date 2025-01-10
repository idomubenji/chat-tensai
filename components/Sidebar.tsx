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

export function Sidebar() {
  const { user } = useSupabaseAuth();
  const { channels, isLoading } = useChannels();

  if (!user) return null;

  return (
    <div className="w-64 bg-[#6F8FAF] flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <ProfilePicture />
        <SignOutButton />
      </div>
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
    </div>
  );
}
