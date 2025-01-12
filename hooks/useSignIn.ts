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

      let emailToUse = emailOrUsername;

      // If input doesn't look like an email, treat it as a username
      if (!emailOrUsername.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('name', emailOrUsername)
          .single();

        if (userError) {
          if (userError.code === 'PGRST116') {
            throw new Error('No user found with this username');
          }
          throw userError;
        }

        if (!userData?.email) {
          throw new Error('No email associated with this username');
        }

        emailToUse = userData.email;
      }

      // Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError) {
        // Customize error message based on the error code
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Incorrect email/username or password');
        }
        throw signInError;
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error in signIn:', err);
      setError(err instanceof Error ? err.message : 'Invalid credentials');
      return { success: false, error: err instanceof Error ? err.message : 'Invalid credentials' };
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
} 