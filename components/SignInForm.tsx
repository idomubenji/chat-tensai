'use client';

import { useState, useEffect } from 'react';
import { useSignIn } from '@/hooks/useSignIn';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { handleUserOnboarding } from '@/lib/user-onboarding';

export function SignInForm() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error } = useSignIn();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Handle user onboarding
        await handleUserOnboarding(
          session.user.id,
          session.user.email!,
          session.user.user_metadata.username
        );
        // Redirect to home page
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(emailOrUsername, password);
    if (result.success) {
      router.push('/');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emailOrUsername">Email or Username</Label>
          <Input
            id="emailOrUsername"
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            placeholder="Enter your email or username"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
} 