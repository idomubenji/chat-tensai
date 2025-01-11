"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { LoadingBall } from "@/components/ui/loading";
import { Sidebar } from "@/components/Sidebar";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export default function Home() {
  const { isLoaded, userId } = useSupabaseAuth();
  const router = useRouter();
  const [isCheckingChannels, setIsCheckingChannels] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace('/sign-in');
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    async function checkChannelAccess() {
      if (!userId) return;

      try {
        const supabase = createClientComponentClient<Database>();
        const { data: channels, error } = await supabase
          .from('channels')
          .select('id')
          .limit(1);

        if (error) {
          console.error('Error checking channels:', error);
          return;
        }

        setIsCheckingChannels(false);

        // If user has no access to any channels, redirect to sign-in
        if (!channels || channels.length === 0) {
          router.replace('/sign-in');
        }
      } catch (error) {
        console.error('Error checking channel access:', error);
        setIsCheckingChannels(false);
      }
    }

    if (userId) {
      checkChannelAccess();
    }
  }, [userId, router]);

  if (!isLoaded || isCheckingChannels) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LoadingBall />
      </div>
    );
  }

  // Don't render anything while redirecting to sign-in
  if (!userId) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LoadingBall />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 overflow-hidden bg-[#F5E6D3]">
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a channel to start chatting
          </div>
        </div>
      </div>
    </div>
  );
}
