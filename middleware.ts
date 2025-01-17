import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setCorsHeaders } from '@/utils/cors-config';

export async function middleware(req: NextRequest) {
  try {
    // Log environment variables
    console.log('[Middleware] Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_TENSAI_KEY: process.env.NEXT_PUBLIC_TENSAI_KEY ? '[PRESENT]' : '[MISSING]',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
    });

    // Create response first
    const res = NextResponse.next();
    
    // Set CORS headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      setCorsHeaders(req, res);

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res;
      }
    }
    
    // Add debug logging for all requests
    console.log('[Middleware] Request:', {
      url: req.url,
      path: req.nextUrl.pathname,
      method: req.method,
      cookies: {
        all: req.cookies.getAll().map(c => ({ 
          name: c.name, 
          value: c.name.includes('token') ? '[REDACTED]' : c.value
        })),
        authToken: req.cookies.get('supabase-auth-token')?.value ? '[PRESENT]' : '[MISSING]',
        accessToken: req.cookies.get('sb-access-token')?.value ? '[PRESENT]' : '[MISSING]',
        refreshToken: req.cookies.get('sb-refresh-token')?.value ? '[PRESENT]' : '[MISSING]',
        authEvent: req.cookies.get('supabase-auth-event')?.value ? '[PRESENT]' : '[MISSING]'
      },
      headers: {
        origin: req.headers.get('origin'),
        'x-api-key': req.headers.get('x-api-key') ? 'PRESENT' : 'MISSING',
        cookie: req.headers.get('cookie'),
        'content-type': req.headers.get('content-type')
      }
    });

    // Create Supabase client
    const supabase = createMiddlewareClient({ req, res });
    console.log('[Middleware] Created Supabase client');

    // Try to parse session from auth event cookie first
    const authEventStr = req.cookies.get('supabase-auth-event')?.value;
    console.log('[Middleware] Auth event details:', {
      present: !!authEventStr,
      length: authEventStr?.length,
      preview: authEventStr?.substring(0, 50) + '...'
    });

    let session = null;
    let sessionError = null;

    if (authEventStr) {
      try {
        // Parse the auth event
        const authEvent = JSON.parse(authEventStr);
        console.log('[Middleware] Parsed auth event:', {
          event: authEvent.event,
          hasSession: !!authEvent.session,
          hasAccessToken: !!authEvent.session?.access_token,
          hasUser: !!authEvent.session?.user,
          userId: authEvent.session?.user?.id,
          userEmail: authEvent.session?.user?.email
        });

        if (authEvent.event === 'SIGNED_IN' && authEvent.session) {
          // Set the session manually
          console.log('[Middleware] Setting session...');
          const { data, error } = await supabase.auth.setSession({
            access_token: authEvent.session.access_token,
            refresh_token: authEvent.session.refresh_token
          });
          
          if (error) {
            console.error('[Middleware] Error setting session:', error);
            sessionError = error;
          } else {
            session = data.session;
            console.log('[Middleware] Session set successfully');
          }
        }
      } catch (error) {
        console.error('[Middleware] Error parsing auth event:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          preview: authEventStr?.substring(0, 50) + '...'
        });
      }
    }

    // If we couldn't set the session from the auth event, try to get it normally
    if (!session) {
      console.log('[Middleware] Getting session...');
      const { data: { session: fetchedSession }, error } = await supabase.auth.getSession();
      session = fetchedSession;
      sessionError = error;
    }
    
    console.log('[Middleware] Final session state:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      hasAccessToken: !!session?.access_token,
      hasRefreshToken: !!session?.refresh_token,
      error: sessionError ? { 
        message: sessionError.message,
        name: sessionError.name,
        stack: sessionError.stack
      } : null,
      cookies: {
        hasAuthToken: req.cookies.has('supabase-auth-token'),
        hasAccessToken: req.cookies.has('sb-access-token'),
        hasRefreshToken: req.cookies.has('sb-refresh-token'),
        authTokenValue: req.cookies.get('supabase-auth-token')?.value ? '[PRESENT]' : '[MISSING]'
      }
    });

    if (sessionError) {
      console.error('[Middleware] Session error:', {
        error: sessionError,
        message: sessionError.message,
        name: sessionError.name,
        stack: sessionError.stack
      });
      if (req.nextUrl.pathname.startsWith('/api/')) {
        const errorResponse = NextResponse.json(
          { error: 'Authentication error', details: sessionError.message },
          { status: 401 }
        );
        setCorsHeaders(req, errorResponse);
        return errorResponse;
      }
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // Protect API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // Skip API key check for avatar upload endpoint
      if (!req.nextUrl.pathname.startsWith('/api/users/me/avatar')) {
        // Check API key first
        const apiKey = req.headers.get('x-api-key');
        console.log('[Middleware] API key validation:', {
          hasApiKey: !!apiKey,
          isValid: apiKey === process.env.NEXT_PUBLIC_TENSAI_KEY,
          expectedKey: process.env.NEXT_PUBLIC_TENSAI_KEY ? '[PRESENT]' : '[MISSING]',
          receivedKey: apiKey ? '[PRESENT]' : '[MISSING]',
          // Add debug info for comparison
          debug: {
            receivedKeyLength: apiKey?.length,
            expectedKeyLength: process.env.NEXT_PUBLIC_TENSAI_KEY?.length,
            receivedKeyPrefix: apiKey?.slice(0, 10),
            expectedKeyPrefix: process.env.NEXT_PUBLIC_TENSAI_KEY?.slice(0, 10)
          }
        });

        if (!apiKey || apiKey !== process.env.NEXT_PUBLIC_TENSAI_KEY) {
          console.log('[Middleware] Invalid or missing API key');
          const errorResponse = NextResponse.json(
            { error: 'Unauthorized - Invalid or missing API key' },
            { status: 401 }
          );
          setCorsHeaders(req, errorResponse);
          return errorResponse;
        }
      }

      if (!session) {
        console.log('[Middleware] No session for API route');
        const errorResponse = NextResponse.json(
          { error: 'Unauthorized - No valid session' },
          { status: 401 }
        );
        setCorsHeaders(req, errorResponse);
        return errorResponse;
      }
      console.log('[Middleware] Session found for API route:', {
        userId: session.user.id,
        hasToken: !!session.access_token
      });
    }

    // Protect authenticated pages
    const publicPaths = ['/sign-in', '/sign-up', '/auth/callback'];
    if (!publicPaths.includes(req.nextUrl.pathname)) {
      if (!session) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    }

    return res;
  } catch (error) {
    console.error('[Middleware] Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
      request: {
        url: req.url,
        path: req.nextUrl.pathname,
        method: req.method,
        headers: {
          origin: req.headers.get('origin'),
          'x-api-key': req.headers.get('x-api-key') ? 'PRESENT' : 'MISSING',
          'content-type': req.headers.get('content-type')
        }
      }
    });

    if (req.nextUrl.pathname.startsWith('/api/')) {
      const errorResponse = NextResponse.json(
        { 
          error: 'Internal server error', 
          details: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.name : 'UnknownError'
        },
        { status: 500 }
      );
      setCorsHeaders(req, errorResponse);
      return errorResponse;
    }
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
}

export const config = {
  matcher: [
    // Match API routes
    '/api/:path*',
    // Match auth callback
    '/auth/callback',
    // Match all authenticated pages
    '/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
