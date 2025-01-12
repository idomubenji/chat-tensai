'use client';

import { useState } from 'react';
import { useSignUp } from '@/hooks/useSignUp';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect } from 'react';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isConfirmationSent, setIsConfirmationSent] = useState(false);
  const { signUp, loading, error } = useSignUp();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signUp(email, password, username);
    if (result.success) {
      setIsConfirmationSent(true);
    }
  };

  if (isConfirmationSent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-2xl font-semibold text-gray-900">
          Check your email
        </div>
        <div className="text-gray-600">
          We sent a confirmation link to <span className="font-medium">{email}</span>
        </div>
        <div className="text-sm text-gray-500">
          Click the link in the email to verify your account and start using Chat Tensai.
          <br />
          If you don&apos;t see the email, check your spam folder.
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => window.location.href = 'https://mail.google.com'}
        >
          Open Gmail
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
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
            placeholder="Choose a password"
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
          {loading ? 'Signing up...' : 'Sign up'}
        </Button>
      </form>
      <div className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-[#6F8FAF] hover:text-[#5A7593]">
          Sign in
        </Link>
      </div>
    </div>
  );
} 