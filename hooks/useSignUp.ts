'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { handleUserOnboarding } from '@/lib/user-onboarding';

export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      setError(null);

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (authError) throw authError;

      // Handle user onboarding if sign up was successful
      if (authData.user) {
        const { success, error: onboardingError } = await handleUserOnboarding(
          authData.user.id,
          email,
          username
        );

        if (!success) throw onboardingError;
      }

      return { success: true };
    } catch (err) {
      console.error('Error in signUp:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during sign up');
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred during sign up' };
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error };
} 