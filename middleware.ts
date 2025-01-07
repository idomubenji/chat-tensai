import { authMiddleware } from '@clerk/nextjs';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  
  // Create Supabase client with middleware config
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  return res;
};

// Use Clerk's auth middleware and then our Supabase middleware
export default authMiddleware({
  afterAuth: (auth, req, evt) => {
    // Handle the middleware function after Clerk auth
    return middleware(req);
  },
  publicRoutes: ['/'], // Add your public routes here
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
