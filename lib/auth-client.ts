import { createAuthClient } from 'better-auth/react';
import { anonymousClient } from 'better-auth/client/plugins';
import type { UserType } from '@/lib/types';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [anonymousClient()],
});

// Re-export core functionality
export const { signIn, signUp, signOut, useSession } = authClient;

// Enhanced session hook that includes user type
export function useSessionWithType() {
  const { data: session, ...rest } = useSession();

  if (!session) {
    return { data: null, ...rest };
  }

  // Determine user type from email if not already set
  const userType: UserType =
    session.user?.email && /^guest-\d+$/.test(session.user.email)
      ? 'guest'
      : 'regular';

  return {
    data: {
      ...session,
      user: {
        ...session.user,
        type: userType,
      },
    },
    ...rest,
  };
}

// Guest sign-in helper function - now using better-auth anonymous plugin
export async function signInAsGuest(redirectTo?: string) {
  try {
    // Use the anonymous sign-in from the client
    await authClient.signIn.anonymous({
      fetchOptions: {
        onSuccess: () => {
          if (redirectTo) {
            window.location.href = redirectTo;
          } else {
            window.location.href = '/';
          }
        },
      },
    });
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    // Fallback to the API route if needed
    const url = `/api/auth/guest${redirectTo ? `?redirectUrl=${encodeURIComponent(redirectTo)}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });

    if (response.redirected) {
      window.location.href = response.url;
    }

    return response;
  }
}

// Session update helper (for compatibility with NextAuth)
export async function updateSession() {
  // Better auth handles session updates automatically
  // This function is for compatibility with NextAuth patterns
  return Promise.resolve();
}
