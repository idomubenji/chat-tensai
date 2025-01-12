import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper to get the base URL, ensuring production users are routed to the website URL
function getBaseUrl(): string {
  // In production, always use the website URL
  if (process.env.NODE_ENV === 'production') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL must be set in production');
    }
    return siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
  }
  
  // In development, use localhost
  return 'http://localhost:3000';
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const baseUrl = getBaseUrl();

  // If there's an error in the auth callback, redirect to sign-in
  if (error || error_description) {
    console.error('Auth callback error:', { error, error_description });
    return NextResponse.redirect(new URL('/sign-in', baseUrl));
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/sign-in', baseUrl));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', baseUrl));
} 