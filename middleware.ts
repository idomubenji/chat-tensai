import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Create response first
    const res = NextResponse.next();
    
    // Create Supabase client
    const supabase = createMiddlewareClient({ req, res });

    // Add debug logging for all requests
    console.log('[Middleware] Request:', {
      url: req.url,
      path: req.nextUrl.pathname,
      cookies: req.cookies.getAll().map(c => c.name)
    });

    // Refresh session and await it specifically
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('[Middleware] Session state:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      error: sessionError ? { message: sessionError.message } : null
    });

    if (sessionError) {
      console.error('[Middleware] Session error:', sessionError);
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Auth error' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // Protect API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      if (!session) {
        console.log('[Middleware] No session for API route');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        console.log('[Middleware] No session for protected route');
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    }

    return res;
  } catch (error) {
    console.error('[Middleware] Error:', error);
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
