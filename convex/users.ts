import { mutation, query } from "./_generated/server";
import { authComponent } from "./betterAuth";

/**
 * Debug: Get raw Better Auth user info
 */
export const debugAuthUser = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    return authUser;
  },
});

/**
 * Ensures an app user record exists for the authenticated Better Auth user.
 * Creates the record if it doesn't exist, returns the existing record if it does.
 * This is idempotent and safe to call multiple times.
 *
 * Handles backfill for existing records that don't have authId set.
 */
export const ensureAppUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated Better Auth user
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Authentication required");
    }

    console.log("ensureAppUser: authUser =", JSON.stringify(authUser));

    // 1. Check if app user record already exists by authId
    const existingByAuthId = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", authUser._id))
      .first();

    if (existingByAuthId) {
      console.log("Found user by authId:", existingByAuthId._id);
      // Sync displayName from Better Auth if app user doesn't have one
      if (!existingByAuthId.displayName && authUser.displayUsername) {
        await ctx.db.patch(existingByAuthId._id, {
          displayName: authUser.displayUsername,
        });
      }
      return existingByAuthId._id;
    }

    // 2. Fallback: Check if user exists by email (for backfill)
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", authUser.email))
      .first();

    if (existingByEmail) {
      console.log("Found user by email, backfilling authId:", existingByEmail._id);
      // Backfill the authId and sync displayName if missing
      const patchData: { authId: string; displayName?: string } = {
        authId: authUser._id,
      };
      if (!existingByEmail.displayName && authUser.displayUsername) {
        patchData.displayName = authUser.displayUsername;
      }
      await ctx.db.patch(existingByEmail._id, patchData);
      return existingByEmail._id;
    }

    // 3. Create new app user record with displayName from Better Auth
    console.log("Creating new app user with email:", authUser.email, "authId:", authUser._id);
    const userId = await ctx.db.insert("users", {
      email: authUser.email,
      authId: authUser._id,
      displayName: authUser.displayUsername || undefined,
      createdAt: Date.now(),
    });

    return userId;
  },
});
