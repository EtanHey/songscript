// convex/authHelpers.ts
import { authComponent } from './betterAuth';
import { QueryCtx, MutationCtx, ActionCtx } from './_generated/server';

type AuthContext = QueryCtx | MutationCtx | ActionCtx;

/**
 * Retrieves the authenticated user's ID from the Convex context.
 * This helper is for optional authentication; it returns the userId if available,
 * or null if the user is not authenticated.
 *
 * Security Rationale:
 * - NEVER accept userId as a function argument (can be faked by attacker).
 * - Always retrieve user identity directly from `ctx.auth` (or a trusted wrapper like `authComponent.safeGetAuthUser`)
 *   as `ctx.auth` is cryptographically verified and cannot be spoofed.
 *
 * @param ctx The Convex context (QueryCtx, MutationCtx, or ActionCtx).
 * @returns The user's ID if authenticated, otherwise null.
 */
export async function getAuthUserId(ctx: AuthContext): Promise<string | null> {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  return authUser?._id ?? null;
}

/**
 * Ensures the caller is authenticated and returns the user's ID.
 * This helper is for required authentication; it throws an Error if the user is not authenticated,
 * preventing unauthorized access to sensitive operations.
 *
 * Security Rationale:
 * - Prevents unauthorized access by enforcing authentication at the function entry point.
 * - Relies on `getAuthUserId` which adheres to the principle of not trusting client-provided user IDs.
 *
 * @param ctx The Convex context (QueryCtx, MutationCtx, or ActionCtx).
 * @returns The user's ID if authenticated.
 * @throws {Error} If the user is not authenticated.
 */
export async function requireAuth(ctx: AuthContext): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}
