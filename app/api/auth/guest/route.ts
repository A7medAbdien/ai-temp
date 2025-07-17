import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  try {
    // Check if there's already an active session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session?.user) {
      // User already has a session, redirect to the requested URL
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Create an anonymous session using better-auth's anonymous plugin
    const response = await auth.api.signInAnonymous({
      asResponse: true,
    });

    if (!response.ok) {
      console.error('Anonymous sign-in failed:', response.statusText);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Create a redirect response with the session cookies
    const redirectResponse = NextResponse.redirect(
      new URL(redirectUrl, request.url),
    );

    // Copy cookies from the auth response to the redirect response
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      redirectResponse.headers.set('set-cookie', cookies);
    }

    return redirectResponse;
  } catch (error) {
    console.error('Guest authentication error:', error);
    // Fallback: redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
