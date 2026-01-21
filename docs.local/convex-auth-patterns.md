# Convex Authentication Patterns

This document outlines best practices and secure patterns for handling authentication within Convex functions, emphasizing the use of `ctx.auth.getUserIdentity()` and project-specific helpers.

## Core Security Principle

**NEVER accept user ID as a function argument.** Always retrieve the user's identity directly from the `ctx.auth` object within Convex functions. The `ctx.auth` object is cryptographically verified and cannot be spoofed by an attacker.

## Key Patterns and Helpers

### 1. `getAuthUserId(ctx)`: Optional Authentication

This helper function retrieves the authenticated user's ID if available. It returns `null` if the user is not authenticated, making it suitable for operations that can be performed by both authenticated and unauthenticated users, but behave differently for each.

```typescript
// convex/authHelpers.ts
import { authComponent } from './betterAuth'; // Assuming betterAuth is the custom auth component

// Returns userId or null - use for optional auth
export async function getAuthUserId(ctx: any): Promise<string | null> {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  return authUser?._id ?? null;
}
```

### 2. `requireAuth(ctx)`: Required Authentication

This helper function ensures that a user is authenticated before proceeding. If the user is not authenticated, it throws an error, preventing unauthorized access to sensitive operations.

```typescript
// convex/authHelpers.ts
import { authComponent } from './betterAuth'; // Assuming betterAuth is the custom auth component

// Throws if not authenticated - use for required auth
export async function requireAuth(ctx: any): Promise<string> {
  const userId = await getAuthUserId(ctx); // Re-uses getAuthUserId for consistency
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}
```

## Usage in Convex Functions

### Secure Query Example (`getForCurrentUser` adapted)

```typescript
import { query } from "./_generated/server";
import { requireAuth } from "./authHelpers"; // Assuming authHelpers.ts is in the same directory

export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // This will throw if not authenticated
    const userId = await requireAuth(ctx);
    
    // Use userId for secure data fetching
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("author"), userId))
      .collect();
  },
});
```

### Secure Mutation Example (`updateTeam` adapted)

```typescript
import { mutation } from "./_generated/server";
import { requireAuth } from "./authHelpers"; // Assuming authHelpers.ts is in the same directory
import { v } from "convex/values";

export const updateTeam = mutation({
  args: {
    id: v.id("teams"),
    update: v.object({
      name: v.optional(v.string()),
      owner: v.optional(v.id("users")),
    }),
  },
  handler: async (ctx, { id, update }) => {
    // This will throw if not authenticated
    const userId = await requireAuth(ctx);

    // Perform authorization checks using the verified userId
    const isTeamMember = /* check if user (userId) is a member of the team (id) */
    if (!isTeamMember) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch("teams", id, update);
  },
});
```

## Client-Side Integration Notes (Convex React Hooks)

For client-side applications, `ConvexProviderWithAuth` and `useConvexAuth` are essential for integrating custom authentication providers and managing authentication state.

- `ConvexProviderWithAuth`: Replaces `ConvexProvider` to combine Convex functionality with custom authentication, providing authentication state to descendant components.
- `useConvexAuth`: A React hook to retrieve the current authentication state (`isLoading`, `isAuthenticated`).

This ensures that authentication status is consistently managed and accessible throughout your application, both on the server (via `ctx.auth`) and client.