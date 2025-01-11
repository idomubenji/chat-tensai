import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { useEffect, useState } from 'react';

export function useSupabaseClient() {
  const [supabase] = useState(() => createClientComponentClient<Database>());
  return supabase;
}

export function useSupabaseAuth() {
  const supabase = useSupabaseClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
      setIsLoaded(true);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setIsLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { userId, isLoaded };
} 