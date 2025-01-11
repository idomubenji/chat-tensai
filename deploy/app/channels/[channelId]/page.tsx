"use client";

import { useEffect, useState, useCallback } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThreadWindow } from "@/components/ThreadWindow";
import { LoadingBall } from "@/components/ui/loading";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  const { isLoaded, userId } = useSupabaseAuth();
  const router = useRouter();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  const handleMessageSelect = useCallback((messageId: string) => {
    setSelectedMessageId(messageId);
  }, []);

  const handleCloseThread = useCallback(() => {
    setSelectedMessageId(null);
  }, []);

  // Show loading state while checking auth
  if (!isLoaded) {
    return <LoadingBall />;
  }

  // Only show the main content if user is authenticated
  if (!userId) {
    return null; // Return null while redirecting
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 flex overflow-hidden bg-[#F5E6D3]">
          <div className={cn(
            "flex-1 flex flex-col",
            selectedMessageId && "lg:border-r border-gray-200"
          )}>
            <ChatWindow
              channelId={params.channelId}
              onMessageSelect={handleMessageSelect}
              selectedMessageId={selectedMessageId}
            />
          </div>
          {selectedMessageId && (
            <div className="hidden lg:flex lg:w-96 xl:w-[480px]">
              <ThreadWindow
                messageId={selectedMessageId}
                onClose={handleCloseThread}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
