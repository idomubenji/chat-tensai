"use client";

import { useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { LoadingBall } from "@/components/ui/loading";
import { Sidebar } from "@/components/Sidebar";

export default function Home() {
  const { isLoaded, userId } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace('/sign-in');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
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
