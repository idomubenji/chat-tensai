'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { LoadingBall } from '@/components/ui/loading';
import { Sidebar } from '@/components/Sidebar';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export default function Home() {
  const { isLoaded, userId } = useSupabaseAuth();
  const router = useRouter();
  const [isCheckingChannels, setIsCheckingChannels] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('Auth state:', { isLoaded, userId });
  }, [isLoaded, userId]);

  // Handle auth redirect
  useEffect(() => {
    if (isLoaded && !userId) {
      console.log('No user found, redirecting to sign-in');
      router.replace('/sign-in');
    }
  }, [isLoaded, userId, router]);

  // Check channel access
  useEffect(() => {
    let isMounted = true;

    async function checkChannelAccess() {
      if (!userId) {
        if (isMounted) {
          setIsCheckingChannels(false);
        }
        return;
      }

      console.log('Checking channel access for user:', userId);

      try {
        const supabase = createClientComponentClient<Database>();
        const { data: channels, error } = await supabase
          .from('channels')
          .select('id')
          .limit(1);

        if (error) {
          console.error('Error checking channels:', error);
          if (isMounted) {
            setIsCheckingChannels(false);
          }
          return;
        }

        if (isMounted) {
          console.log('Channel check result:', { channels });
          
          // If user has no access to any channels, redirect to sign-in
          if (!channels || channels.length === 0) {
            console.log('No channels found, redirecting to sign-in');
            router.replace('/sign-in');
          }
          setIsCheckingChannels(false);
        }
      } catch (error) {
        console.error('Error checking channel access:', error);
        if (isMounted) {
          setIsCheckingChannels(false);
        }
      }
    }

    checkChannelAccess();

    return () => {
      isMounted = false;
    };
  }, [userId, router]);

  // Show loading state while checking auth and channels
  if (!isLoaded || isCheckingChannels) {
    console.log('Still loading:', { isLoaded, isCheckingChannels });
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LoadingBall />
      </div>
    );
  }

  // Don't render anything while redirecting to sign-in
  if (!userId) {
    console.log('No userId, returning null');
    return null;
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
