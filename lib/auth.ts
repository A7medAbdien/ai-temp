import 'better-auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { anonymous } from 'better-auth/plugins';
import { db } from '@/lib/db/queries';
import { betterAuthSchema } from '@/lib/db/schema';
import type { UserType } from '@/lib/types';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: betterAuthSchema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn:
      Number(process.env.BETTER_AUTH_SESSION_EXPIRES_IN) || 60 * 60 * 24 * 7, // 7 days
    updateAge:
      Number(process.env.BETTER_AUTH_SESSION_UPDATE_AGE) || 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      type: {
        type: 'string',
        defaultValue: 'regular',
        input: false,
      },
    },
  },
  socialProviders: {
    // Social providers configuration can be added here
  },
  // Configure Better Auth to generate UUIDs for user IDs
  // INFO: just to keep compatibility with NextAuth, otherwise we will need to update the schemas ids'
  advanced: {
    database: {
      generateId: () => {
        return crypto.randomUUID();
      },
    },
  },
  plugins: [
    anonymous({
      // When an anonymous user signs up/signs in with email, their account gets linked
      emailDomainName: 'anonymous.local',
    }),
  ],
});

// TODO: move to @/schemas/auth.ts, and use zod
// Enhanced session type for compatibility
export interface AuthSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    type: UserType;
  };
  expires: string;
}
