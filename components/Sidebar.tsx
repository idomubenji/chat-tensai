"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Hash } from "lucide-react";
import { ProfilePicture } from "./ProfilePicture";
import { SignOutButton } from "./SignOutButton";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Mock data for channels - you can move this to a proper data source later
const mockChannels = [
  { id: "1", name: "general" },
  { id: "2", name: "random" },
  { id: "3", name: "project-a" },
];

export function Sidebar() {
  const router = useRouter();

  const handleChannelSelect = (channelId: string) => {
    router.push(`/channels/${channelId}`);
  };

  return (
    <div className="w-64 bg-[#6F8FAF] p-4 h-full flex flex-col text-white">
      <div className="flex-grow overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">Workspace</h1>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="channels">
            <AccordionTrigger className="hover:text-gray-200">Channels</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {mockChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className="w-full justify-start text-white hover:text-gray-200 hover:bg-[#5A7593]"
                    onClick={() => handleChannelSelect(channel.id)}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    {channel.name}
                  </Button>
                ))}
              </div>
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
      <div className="mt-auto pt-4 flex items-center justify-between">
        <Link href="/settings">
          <ProfilePicture />
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
