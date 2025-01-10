'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { Database } from '@/types/supabase';

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/sign-in');
      } else if (event === 'SIGNED_IN') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return children;
} 