import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Let all API routes pass through without authentication
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Let auth pages through without authentication (to avoid redirect loops)
  if (['/login', '/register'].includes(pathname)) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  const sessionToken = request.cookies.get('better-auth.session_token');

  if (!sessionToken) {
    // No session cookie found, redirect to guest auth only for protected routes
    if (pathname === '/' || pathname.startsWith('/chat')) {
      // Add a check to prevent redirect loops
      const referer = request.headers.get('referer');
      if (referer?.includes('/api/auth/guest')) {
        return NextResponse.next(); // Let it through to avoid infinite loop
      }

      const redirectUrl = encodeURIComponent(request.url);

      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
      );
    }
  }

  // If we have a session token or it's not a protected route, let it through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
