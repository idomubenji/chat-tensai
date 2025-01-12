'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[SupabaseProvider] Initializing auth...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[SupabaseProvider] Session error:', {
            error: sessionError,
            message: sessionError.message,
            status: sessionError.status
          });
          throw sessionError;
        }
        
        console.log('[SupabaseProvider] Session state:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          accessToken: session?.access_token ? 'present' : 'missing'
        });
        
        setUser(session?.user ?? null);
        
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[SupabaseProvider] Auth state changed:', { 
            event,
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id
          });
          setUser(session?.user ?? null);
          
          if (event === 'SIGNED_OUT') {
            router.push('/sign-in');
          } else if (event === 'SIGNED_IN') {
            router.refresh();
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('[SupabaseProvider] Auth initialization failed:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(err instanceof Error ? err : new Error('Auth initialization failed'));
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [router, supabase]);

  return (
    <AuthContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
} 