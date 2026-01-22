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
      return existingByAuthId._id;
    }

    // 2. Fallback: Check if user exists by email (for backfill)
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", authUser.email))
      .first();

    if (existingByEmail) {
      console.log("Found user by email, backfilling authId:", existingByEmail._id);
      // Backfill the authId
      await ctx.db.patch(existingByEmail._id, {
        authId: authUser._id,
      });
      return existingByEmail._id;
    }

    // 3. Create new app user record
    console.log("Creating new app user with email:", authUser.email, "authId:", authUser._id);
    const userId = await ctx.db.insert("users", {
      email: authUser.email,
      authId: authUser._id,
      createdAt: Date.now(),
    });

    return userId;
  },
});
