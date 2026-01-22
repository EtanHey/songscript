import { mutation } from "./_generated/server";
import { authComponent } from "./betterAuth";

/**
 * Ensures an app user record exists for the authenticated Better Auth user.
 * Creates the record if it doesn't exist, returns the existing record if it does.
 * This is idempotent and safe to call multiple times.
 */
export const ensureAppUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated Better Auth user
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Authentication required");
    }

    // Check if app user record already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", authUser._id))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new app user record
    const userId = await ctx.db.insert("users", {
      email: authUser.email,
      authId: authUser._id,
      createdAt: Date.now(),
    });

    return userId;
  },
});
