import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to delete user and all associated data from SongScript
 *
 * Deletion order matters to avoid foreign key issues:
 * 1. Delete all user-specific app data (wordProgress, userSongProgress, etc.)
 * 2. Delete app user record (users table)
 *
 * Note: This mutation deletes app-specific data. Better Auth user/session/account
 * records are managed by Better Auth's component via database triggers.
 * Deleting the app user triggers the onDelete callback which cleans up Better Auth data.
 */
export const deleteUserAndAllData = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    console.log(`[admin:deleteUserAndAllData] Starting deletion for user: ${args.email}`);

    const deletionReport: Record<string, number> = {
      wordProgress: 0,
      userSongProgress: 0,
      lineProgress: 0,
      userWishlist: 0,
      userPracticeLog: 0,
      userGoals: 0,
      userPreferences: 0,
      appUsers: 0,
    };

    // Step 1: Find the user by email in the app users table
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!appUser) {
      console.log(`[admin:deleteUserAndAllData] User not found: ${args.email}`);
      return {
        success: false,
        message: `User not found: ${args.email}`,
        deletionReport,
      };
    }

    const userId = appUser._id;
    const authId = appUser.authId;

    console.log(
      `[admin:deleteUserAndAllData] Found user - app userId: ${userId}, authId: ${authId}`
    );

    // Step 2: Delete all user-specific data in order
    // Start with tables that reference userId

    // Delete wordProgress entries for this user
    const wordProgressEntries = await ctx.db
      .query("wordProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId.toString()))
      .collect();

    for (const entry of wordProgressEntries) {
      await ctx.db.delete(entry._id);
      deletionReport.wordProgress++;
    }

    // Delete userSongProgress entries
    const userSongProgressEntries = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId.toString()))
      .collect();

    for (const entry of userSongProgressEntries) {
      await ctx.db.delete(entry._id);
      deletionReport.userSongProgress++;
    }

    // Delete lineProgress entries
    const lineProgressEntries = await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId.toString()))
      .collect();

    for (const entry of lineProgressEntries) {
      await ctx.db.delete(entry._id);
      deletionReport.lineProgress++;
    }

    // Delete userWishlist entries
    const userWishlistEntries = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId.toString()))
      .collect();

    for (const entry of userWishlistEntries) {
      await ctx.db.delete(entry._id);
      deletionReport.userWishlist++;
    }

    // Delete userPracticeLog entries
    const userPracticeLogEntries = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_user", (q) => q.eq("userId", userId.toString()))
      .collect();

    for (const entry of userPracticeLogEntries) {
      await ctx.db.delete(entry._id);
      deletionReport.userPracticeLog++;
    }

    // Delete userGoals entries
    const userGoalsEntries = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId.toString()))
      .collect();

    for (const entry of userGoalsEntries) {
      await ctx.db.delete(entry._id);
      deletionReport.userGoals++;
    }

    // Delete userPreferences entries
    const userPreferencesEntries = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId.toString()))
      .collect();

    for (const entry of userPreferencesEntries) {
      await ctx.db.delete(entry._id);
      deletionReport.userPreferences++;
    }

    // Step 3: Delete the app user record
    // This triggers the betterAuth onDelete callback which automatically:
    // 1. Deletes sessions for this user from Better Auth
    // 2. Deletes accounts for this user from Better Auth
    // 3. Deletes the user from Better Auth
    await ctx.db.delete(userId);
    deletionReport.appUsers++;

    console.log(
      `[admin:deleteUserAndAllData] Deletion complete. Report:`,
      JSON.stringify(deletionReport)
    );

    return {
      success: true,
      message: `User and all data deleted: ${args.email}`,
      deletionReport,
    };
  },
});
