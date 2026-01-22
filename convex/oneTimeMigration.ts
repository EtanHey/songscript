import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";

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

// Delete test user by email from BOTH Better Auth 'user' table AND app 'users' table
export const deleteTestUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const results = {
      betterAuth: { deleted: false, message: "" },
      appUsers: { deleted: false, message: "" },
    };

    // 1. Delete from Better Auth 'user' table using component adapter
    try {
      // Find the user first (findOne takes args at top level)
      const authUser = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user",
        where: [{ field: "email", value: email }],
      });

      if (authUser) {
        // Delete using the user's _id (deleteOne takes { input: { ... } })
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: "user",
            where: [{ field: "_id", value: authUser._id }],
          },
        });
        results.betterAuth = { deleted: true, message: "Deleted from Better Auth" };
      } else {
        results.betterAuth = { deleted: false, message: "Not found in Better Auth" };
      }
    } catch (error) {
      results.betterAuth = { deleted: false, message: `Error: ${error}` };
    }

    // 2. Delete from app 'users' table
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (appUser) {
      await ctx.db.delete(appUser._id);
      results.appUsers = { deleted: true, message: "Deleted from app users" };
    } else {
      results.appUsers = { deleted: false, message: "Not found in app users" };
    }

    return {
      success: results.betterAuth.deleted || results.appUsers.deleted,
      email,
      results
    };
  },
});

// List all app users in the database
export const listAllAppUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

// Fix app user record - backfill authId and correct email
export const fixAppUserRecord = mutation({
  args: {
    appUserId: v.id("users"),
    correctEmail: v.string(),
    authId: v.string(),
  },
  handler: async (ctx, { appUserId, correctEmail, authId }) => {
    await ctx.db.patch(appUserId, {
      email: correctEmail,
      authId: authId,
    });
    return { success: true, fixed: appUserId };
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
