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

      // Validate email domain
      if (!email.toLowerCase().endsWith('@gauntletai.com')) {
        setError('Only @gauntletai.com email addresses are allowed');
        return { success: false, error: 'Only @gauntletai.com email addresses are allowed' };
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      // Don't handle onboarding here - wait for email confirmation
      // The user will be redirected to /auth/callback after confirming email
      // which will then handle the onboarding process

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