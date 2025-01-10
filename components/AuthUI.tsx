import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthUI({ view = 'sign_in' }: { view?: 'sign_in' | 'sign_up' }) {
  const supabase = createClientComponentClient();

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
      redirectTo={`${window.location.origin}/auth/callback`}
    />
  );
} 