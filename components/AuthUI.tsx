'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

export default function AuthUI() {
  const supabase = createClientComponentClient();
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <Auth
      supabaseClient={supabase}
      view="sign_in"
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#404040',
              brandAccent: '#52525b'
            }
          }
        }
      }}
      providers={['github']}
      redirectTo={`${origin}/auth/callback`}
      onlyThirdPartyProviders={false}
      localization={{
        variables: {
          sign_in: {
            email_label: 'Email',
            password_label: 'Password',
          },
          sign_up: {
            email_label: 'Email',
            password_label: 'Password',
          },
        },
      }}
    />
  );
} 