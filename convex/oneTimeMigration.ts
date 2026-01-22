import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// One-time migration: Migrate visitorId data to a userId (Better Auth user ID)
export const migrateVisitorToUser = mutation({
  args: {
    visitorId: v.string(),
    userId: v.string(), // Better Auth user ID directly
  },
  handler: async (ctx, { visitorId, userId }) => {

    const results = {
      wordProgress: 0,
      userSongProgress: 0,
      lineProgress: 0,
      userWishlist: 0,
      userPracticeLog: 0,
      userGoals: 0,
      userPreferences: 0,
    };

    // Migrate wordProgress
    const wordProgressRecords = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
    for (const record of wordProgressRecords) {
      await ctx.db.patch(record._id, { visitorId: userId }); // Update to use email as ID for now
      results.wordProgress++;
    }

    // Migrate userSongProgress
    const songProgressRecords = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
    for (const record of songProgressRecords) {
      await ctx.db.patch(record._id, { visitorId: userId });
      results.userSongProgress++;
    }

    // Migrate lineProgress
    const lineProgressRecords = await ctx.db
      .query("lineProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
    for (const record of lineProgressRecords) {
      await ctx.db.patch(record._id, { visitorId: userId });
      results.lineProgress++;
    }

    // Migrate userWishlist
    const wishlistRecords = await ctx.db
      .query("userWishlist")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
    for (const record of wishlistRecords) {
      await ctx.db.patch(record._id, { visitorId: userId });
      results.userWishlist++;
    }

    // Migrate userPracticeLog
    const practiceLogRecords = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
    for (const record of practiceLogRecords) {
      await ctx.db.patch(record._id, { visitorId: userId });
      results.userPracticeLog++;
    }

    // Migrate userGoals
    const goalsRecords = await ctx.db
      .query("userGoals")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
    for (const record of goalsRecords) {
      await ctx.db.patch(record._id, { visitorId: userId });
      results.userGoals++;
    }

    // Migrate userPreferences
    const preferencesRecords = await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
    for (const record of preferencesRecords) {
      await ctx.db.patch(record._id, { visitorId: userId });
      results.userPreferences++;
    }

    return {
      success: true,
      userId,
      oldVisitorId: visitorId,
      migrated: results,
      total: Object.values(results).reduce((a, b) => a + b, 0),
    };
  },
});

// Query to check what data exists for a visitorId
export const checkVisitorData = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    const wordProgress = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    const songProgress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    const lineProgress = await ctx.db
      .query("lineProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    const wishlist = await ctx.db
      .query("userWishlist")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    const practiceLog = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    const goals = await ctx.db
      .query("userGoals")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    return {
      visitorId,
      counts: {
        wordProgress: wordProgress.length,
        songProgress: songProgress.length,
        lineProgress: lineProgress.length,
        wishlist: wishlist.length,
        practiceLog: practiceLog.length,
        goals: goals.length,
        preferences: preferences.length,
      },
      total: wordProgress.length + songProgress.length + lineProgress.length +
        wishlist.length + practiceLog.length + goals.length + preferences.length,
    };
  },
});

// Delete a user record by ID
export const deleteUserRecord = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.delete(userId);
    return { success: true, deleted: userId };
  },
});

// Delete test user by email from app 'users' table
// Note: Better Auth 'user' table must be deleted manually via Convex dashboard
export const deleteTestUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Delete from app 'users' table
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (appUser) {
      await ctx.db.delete(appUser._id);
      return { success: true, email, deleted: true };
    }
    return { success: false, email, deleted: false, message: "User not found in app users table" };
  },
});

// List all unique visitorIds in the database
export const listAllVisitorIds = query({
  args: {},
  handler: async (ctx) => {
    const visitorIds = new Set<string>();

    // Check wordProgress
    const wordProgress = await ctx.db.query("wordProgress").collect();
    wordProgress.forEach((r) => visitorIds.add(r.visitorId));

    // Check userSongProgress
    const songProgress = await ctx.db.query("userSongProgress").collect();
    songProgress.forEach((r) => visitorIds.add(r.visitorId));

    // Check lineProgress
    const lineProgress = await ctx.db.query("lineProgress").collect();
    lineProgress.forEach((r) => visitorIds.add(r.visitorId));

    // Check userWishlist
    const wishlist = await ctx.db.query("userWishlist").collect();
    wishlist.forEach((r) => visitorIds.add(r.visitorId));

    // Check userPracticeLog
    const practiceLog = await ctx.db.query("userPracticeLog").collect();
    practiceLog.forEach((r) => visitorIds.add(r.visitorId));

    // Check userGoals
    const goals = await ctx.db.query("userGoals").collect();
    goals.forEach((r) => visitorIds.add(r.visitorId));

    // Check userPreferences
    const preferences = await ctx.db.query("userPreferences").collect();
    preferences.forEach((r) => visitorIds.add(r.visitorId));

    return {
      visitorIds: Array.from(visitorIds),
      count: visitorIds.size,
      tableCounts: {
        wordProgress: wordProgress.length,
        songProgress: songProgress.length,
        lineProgress: lineProgress.length,
        wishlist: wishlist.length,
        practiceLog: practiceLog.length,
        goals: goals.length,
        preferences: preferences.length,
      },
    };
  },
});
