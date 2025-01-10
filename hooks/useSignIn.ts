'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export function useSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, try to find a user with this username
      if (!emailOrUsername.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('name', emailOrUsername)
          .single();

        if (!userError && userData) {
          emailOrUsername = userData.email;
        }
      }

      // Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      });

      if (signInError) throw signInError;

      return { success: true, data };
    } catch (err) {
      console.error('Error in signIn:', err);
      setError(err instanceof Error ? err.message : 'Invalid credentials');
      return { success: false, error: err instanceof Error ? err.message : 'Invalid credentials' };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('Error in signInWithGoogle:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      return { success: false, error: err instanceof Error ? err.message : 'Failed to sign in with Google' };
    } finally {
      setLoading(false);
    }
  };

  return { signIn, signInWithGoogle, loading, error };
} 