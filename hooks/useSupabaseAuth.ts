'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoaded(true);
    };

    // Get initial user
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    userId: user?.id,
    isLoaded,
    signOut: () => supabase.auth.signOut(),
  };
} 