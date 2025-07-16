# NextAuth to Better Auth Migration Plan

## Why Better Auth?

[Better Auth](https://www.better-auth.com/) is "the most comprehensive authentication framework for TypeScript" and offers significant advantages over NextAuth:

- **TypeScript-first**: Full type safety and auto-generated schemas
- **Framework agnostic**: Works perfectly with Next.js and other frameworks
- **Drizzle integration**: Auto-generates schemas compatible with our existing Drizzle setup
- **Plugin ecosystem**: Built-in support for 2FA, organizations, and social auth
- **Better DX**: Developer testimonials consistently praise the ease of implementation
- **Production ready**: Already being used in production by multiple companies

## Current NextAuth Implementation Files

### Core Authentication Files

#### `app/(auth)/auth.ts` → `lib/auth.ts`

**Purpose**: Main authentication configuration
**Current Dependencies**: NextAuth, bcrypt-ts, database queries
**Better Auth Migration**:

- [ ] Install Better Auth: `yarn add better-auth`
- [ ] Create new `lib/auth.ts` with Better Auth configuration
- [ ] Configure email/password authentication
- [ ] Set up database connection (reuse existing Postgres)
- [ ] Migrate user types to Better Auth types
- [ ] Configure session management
- [ ] Add guest user functionality via custom plugin

**Better Auth Implementation**:

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  plugins: [
    // Custom guest user plugin
    // organization() if needed later
    // twoFactor() for future security
  ],
});
```

#### `app/(auth)/auth.config.ts` → Remove

**Migration Plan**:

- [ ] Delete file (configuration moves to `lib/auth.ts`)
- [ ] Move page routing configuration to Better Auth config
- [ ] Update redirect URLs in Better Auth configuration

#### `app/(auth)/api/auth/[...nextauth]/route.ts` → `app/api/auth/[...all]/route.ts`

**Better Auth Migration**:

- [ ] Replace with Better Auth API handler
- [ ] Update route structure to handle all auth endpoints
- [ ] Configure CORS and security headers

**Better Auth Implementation**:

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";

export const { GET, POST } = auth.handler;
```

#### `app/(auth)/api/auth/guest/route.ts` → Custom guest auth endpoint

**Better Auth Migration**:

- [ ] Create custom guest authentication plugin for Better Auth
- [ ] Implement guest user creation with timestamp-based emails
- [ ] Maintain existing redirect functionality
- [ ] Ensure session compatibility

### Authentication Actions

#### `app/(auth)/actions.ts` → Update with Better Auth client

**Better Auth Migration**:

- [ ] Replace NextAuth signIn calls with Better Auth client methods
- [ ] Update form validation to work with Better Auth
- [ ] Use Better Auth's built-in error handling
- [ ] Maintain existing password validation

**Better Auth Implementation**:

```typescript
// app/(auth)/actions.ts
import { authClient } from "@/lib/auth-client";

export const login = async (_, formData: FormData) => {
  const { data, error } = await authClient.signIn.email({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { status: "failed" };
  }
  return { status: "success" };
};
```

### UI Components

#### `app/(auth)/login/page.tsx` & `app/(auth)/register/page.tsx`

**Better Auth Migration**:

- [ ] Replace `useSession` with Better Auth's session hook
- [ ] Update form submission to use Better Auth client
- [ ] Implement Better Auth error handling
- [ ] Maintain existing UI/UX patterns

**Better Auth Implementation**:

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

// In components
import { useSession } from "@/lib/auth-client";
const { data: session, status } = useSession();
```

#### `components/auth-form.tsx`

**Better Auth Migration**:

- [ ] Update form structure to work with Better Auth client
- [ ] Maintain existing validation patterns
- [ ] Add Better Auth specific error handling

#### `components/sign-out-form.tsx`

**Better Auth Migration**:

- [ ] Replace NextAuth signOut with Better Auth client
- [ ] Update server action implementation
- [ ] Maintain redirect functionality

**Better Auth Implementation**:

```typescript
// components/sign-out-form.tsx
import { authClient } from "@/lib/auth-client";

const handleSignOut = async () => {
  await authClient.signOut();
  router.push("/");
};
```

#### `components/sidebar-user-nav.tsx`

**Better Auth Migration**:

- [ ] Replace NextAuth hooks with Better Auth session management
- [ ] Update user data access patterns
- [ ] Maintain guest user detection logic

### Layout and Providers

#### `app/layout.tsx`

**Better Auth Migration**:

- [ ] Remove NextAuth SessionProvider
- [ ] Add Better Auth session provider if needed
- [ ] Maintain existing theme and toast providers

**Better Auth doesn't require a provider wrapper** - sessions work automatically with the client.

### Middleware

#### `middleware.ts` → Major update required

**Better Auth Migration**:

- [ ] Replace NextAuth getToken with Better Auth session validation
- [ ] Update route protection logic for Better Auth
- [ ] Implement guest user redirect with Better Auth
- [ ] Test thoroughly - this is critical for security

**Better Auth Implementation**:

```typescript
// middleware.ts
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    // Redirect to guest auth or login
  }

  // Continue with existing logic
}
```

### Database Integration

#### `lib/db/queries.ts` & `lib/db/utils.ts`

**Better Auth Migration**:

- [ ] Better Auth auto-generates user tables - review compatibility
- [ ] Update user creation/retrieval functions
- [ ] Maintain password hashing security (Better Auth handles this)
- [ ] Update guest user creation for Better Auth compatibility

**Database Schema**: Better Auth will auto-generate tables, but we need to ensure compatibility with existing user data.

### API Routes Using Authentication

#### Multiple files: `app/(chat)/page.tsx`, `app/(chat)/layout.tsx`, etc.

**Better Auth Migration**:

- [ ] Replace `auth()` calls with Better Auth session retrieval
- [ ] Update session validation in all API routes
- [ ] Maintain authorization patterns
- [ ] Test all protected endpoints

**Better Auth Implementation**:

```typescript
// In API routes and pages
import { auth } from "@/lib/auth";

const session = await auth.api.getSession({
  headers: request.headers,
});
```

### Test Files

#### `tests/pages/auth.ts`, `tests/e2e/session.test.ts`, `tests/helpers.ts`

**Better Auth Migration**:

- [ ] Update authentication test helpers for Better Auth
- [ ] Modify e2e tests for new auth endpoints
- [ ] Update test context creation
- [ ] Ensure all test scenarios still pass

## Better Auth Migration Strategy

### Phase 1: Setup and Configuration (Week 1)

- [ ] Install Better Auth: `yarn add better-auth`
- [ ] Create basic Better Auth configuration in `lib/auth.ts`
- [ ] Set up database connection (reuse existing Postgres)
- [ ] Create Better Auth client configuration
- [ ] Test basic email/password authentication

### Phase 2: Core Authentication (Week 2)

- [ ] Implement guest user functionality as Better Auth plugin
- [ ] Replace NextAuth API routes with Better Auth handlers
- [ ] Update middleware for Better Auth session validation
- [ ] Migrate authentication actions to Better Auth client
- [ ] Test authentication flows in development

### Phase 3: UI Component Migration (Week 3)

- [ ] Update login/register pages to use Better Auth
- [ ] Replace session hooks in all components
- [ ] Update sign-out functionality
- [ ] Migrate user navigation components
- [ ] Test UI flows thoroughly

### Phase 4: API and Route Protection (Week 4)

- [ ] Update all API routes to use Better Auth sessions
- [ ] Migrate page-level authentication checks
- [ ] Update chat and document authorization
- [ ] Test all protected endpoints
- [ ] Verify rate limiting still works

### Phase 5: Testing and Validation (Week 5)

- [ ] Update all authentication tests
- [ ] Run full e2e test suite
- [ ] Performance testing with Better Auth
- [ ] Security audit of new implementation
- [ ] Load testing authentication flows

### Phase 6: Deployment and Cleanup (Week 6)

- [ ] Deploy to staging environment
- [ ] Monitor authentication metrics
- [ ] Gradual production rollout
- [ ] Remove NextAuth dependencies
- [ ] Update documentation

## Better Auth Specific Benefits

### 1. TypeScript Integration

- **Auto-generated types**: Better Auth generates TypeScript types automatically
- **Type-safe API**: All authentication calls are fully typed
- **Schema generation**: Works seamlessly with Drizzle ORM

### 2. Plugin Ecosystem

```typescript
// Future enhancements available as plugins
import { organization, twoFactor, anonymous } from "better-auth/plugins";

export const auth = betterAuth({
  // ... config
  plugins: [
    organization(), // For multi-tenant features
    twoFactor(), // For enhanced security
    anonymous(), // For guest users
  ],
});
```

### 3. Framework Agnostic

- Works perfectly with Next.js App Router
- No framework-specific dependencies
- Easy to test and maintain

### 4. Developer Experience

According to testimonials:

- "Auto generated my drizzle schemas" - Dev Ed
- "Works so nice with typescript + drizzle" - Josh Tried Coding
- "Auth done in under 5 minutes" - Tech Nerd
- "Exceeded all expectations" - Dagmawi Babi

## Security Considerations

- [ ] Better Auth handles password hashing automatically
- [ ] Session security is built-in with configurable expiration
- [ ] CSRF protection included by default
- [ ] Rate limiting can be implemented at middleware level
- [ ] Guest user security maintained through custom plugin

## Database Migration

Better Auth will create its own user tables. Migration strategy:

1. [ ] Export existing user data
2. [ ] Let Better Auth create new schema
3. [ ] Import user data to new schema
4. [ ] Verify data integrity
5. [ ] Update foreign key references if needed

## Environment Variables

### Remove NextAuth variables:

- `AUTH_SECRET` (Better Auth uses different configuration)

### Add Better Auth variables:

- `BETTER_AUTH_SECRET` - For session encryption
- `BETTER_AUTH_URL` - Base URL for authentication

## Rollback Plan

- [ ] Maintain NextAuth implementation in parallel during migration
- [ ] Feature flag authentication system selection
- [ ] Database backup before schema changes
- [ ] Quick rollback to NextAuth if issues arise
- [ ] Monitoring and alerting for authentication failures

## Timeline: 6 Weeks Total

**Week 1-2**: Core infrastructure and configuration
**Week 3-4**: UI and API migration
**Week 5**: Testing and validation
**Week 6**: Deployment and cleanup

This migration to Better Auth will provide a more maintainable, type-safe, and developer-friendly authentication system while maintaining all existing functionality including guest users and security features.
