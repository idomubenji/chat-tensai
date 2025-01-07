import { withClerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Set the paths that don't require authentication
const publicPaths = ["/", "/sign-in*", "/sign-up*"];

const isPublic = (path: string) => {
  return publicPaths.find(x => 
    path.match(new RegExp(`^${x}$`.replace('*$', '($|/)')))
  );
}

export default withClerkMiddleware((req: NextRequest) => {
  const { userId } = getAuth(req);
  const path = req.nextUrl.pathname;

  if (!isPublic(path) && !userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
