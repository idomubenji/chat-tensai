'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

export default function AuthUI({ view = 'sign_in' }: { view?: 'sign_in' | 'sign_up' }) {
  const supabase = createClientComponentClient();
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <Auth
      supabaseClient={supabase}
      view={view}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#6F8FAF',
              brandAccent: '#5A7593',
            },
          },
        },
      }}
      theme="light"
      showLinks={true}
      providers={['google']}
      redirectTo={`${origin}/auth/callback`}
      localization={{
        variables: {
          sign_up: {
            email_label: 'Email',
            password_label: 'Password',
            email_input_placeholder: 'Your email address',
            password_input_placeholder: 'Your password',
            button_label: 'Sign up',
            loading_button_label: 'Signing up ...',
            social_provider_text: 'Sign in with {{provider}}',
            link_text: "Don't have an account? Sign up",
            confirmation_text: 'Check your email for the confirmation link',
          },
        },
      }}
      extendedSignUp={{
        username: {
          required: true,
          label: 'Username',
          placeholder: 'Choose a username',
        },
      }}
    />
  );
} 