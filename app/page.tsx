"use client";

import { useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LoadingBall } from "@/components/ui/loading";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return <LoadingBall />;
  }

  // Only show the main content if user is authenticated
  if (!userId) {
    return null; // Return null while redirecting
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a channel to start chatting
          </div>
        </div>
      </div>
    </div>
  );
}
