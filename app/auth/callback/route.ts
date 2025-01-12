import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('\n=== AUTH CALLBACK START ===');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('[Auth Callback] Request params:', {
    hasCode: !!code,
    error,
    error_description
  });

  // If there's an error in the auth callback, redirect to sign-in
  if (error || error_description) {
    console.error('[Auth Callback] Error:', { error, error_description });
    return NextResponse.redirect(new URL('/sign-in', requestUrl.origin));
  }

  if (code) {
    console.log('[Auth Callback] Exchanging code for session');
    const supabase = createRouteHandlerClient({ cookies });
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[Auth Callback] Session exchange error:', {
          error,
          message: error.message,
          name: error.name
        });
        throw error;
      }

      console.log('[Auth Callback] Session created:', {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        hasAccessToken: !!data.session?.access_token,
        hasRefreshToken: !!data.session?.refresh_token
      });

    } catch (error) {
      console.error('[Auth Callback] Unhandled error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.redirect(new URL('/sign-in', requestUrl.origin));
    }
  }

  console.log('[Auth Callback] Redirecting to home');
  console.log('=== AUTH CALLBACK END ===\n');
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 