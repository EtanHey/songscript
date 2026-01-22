import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

/**
 * BUG-026 Fix: Migrate progress data from old Better Auth ID to new app users ID
 *
 * Root cause: Old system stored userId = Better Auth user._id directly
 * New system: getAuthUserId() returns app users table _id (which links to Better Auth via authId)
 *
 * This is a one-time migration to update existing records.
 */
export const migrateUserIdFromBetterAuthToAppUsers = internalMutation({
  args: {
    oldUserId: v.string(), // The Better Auth user._id stored in progress tables
    newUserId: v.string(), // The app users table _id
  },
  handler: async (ctx, { oldUserId, newUserId }) => {
    const results = {
      wordProgress: 0,
      userSongProgress: 0,
      lineProgress: 0,
      userWishlist: 0,
      userPracticeLog: 0,
      userGoals: 0,
      userPreferences: 0,
    };

    // 1. Migrate wordProgress records
    const wordProgressRecords = await ctx.db
      .query("wordProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of wordProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.wordProgress++;
    }

    // 2. Migrate userSongProgress records
    const songProgressRecords = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of songProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userSongProgress++;
    }

    // 3. Migrate lineProgress records
    const lineProgressRecords = await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of lineProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.lineProgress++;
    }

    // 4. Migrate userWishlist records
    const wishlistRecords = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of wishlistRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userWishlist++;
    }

    // 5. Migrate userPracticeLog records
    const practiceLogRecords = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of practiceLogRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userPracticeLog++;
    }

    // 6. Migrate userGoals records
    const goalsRecords = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of goalsRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userGoals++;
    }

    // 7. Migrate userPreferences records
    const preferencesRecords = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of preferencesRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userPreferences++;
    }

    return results;
  },
});

/**
 * Public wrapper to run the migration (for CLI execution)
 * Usage: npx convex run migration:runUserIdMigration '{"oldUserId": "...", "newUserId": "..."}'
 */
export const runUserIdMigration = mutation({
  args: {
    oldUserId: v.string(),
    newUserId: v.string(),
  },
  handler: async (ctx, { oldUserId, newUserId }) => {
    const results = {
      wordProgress: 0,
      userSongProgress: 0,
      lineProgress: 0,
      userWishlist: 0,
      userPracticeLog: 0,
      userGoals: 0,
      userPreferences: 0,
    };

    // 1. Migrate wordProgress records
    const wordProgressRecords = await ctx.db
      .query("wordProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of wordProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.wordProgress++;
    }

    // 2. Migrate userSongProgress records
    const songProgressRecords = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of songProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userSongProgress++;
    }

    // 3. Migrate lineProgress records
    const lineProgressRecords = await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of lineProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.lineProgress++;
    }

    // 4. Migrate userWishlist records
    const wishlistRecords = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of wishlistRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userWishlist++;
    }

    // 5. Migrate userPracticeLog records
    const practiceLogRecords = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of practiceLogRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userPracticeLog++;
    }

    // 6. Migrate userGoals records
    const goalsRecords = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of goalsRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userGoals++;
    }

    // 7. Migrate userPreferences records
    const preferencesRecords = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of preferencesRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userPreferences++;
    }

    return results;
  },
});

/**
 * Query to verify progress data counts for a user
 */
export const verifyUserProgressData = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const wordProgress = await ctx.db
      .query("wordProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userSongProgress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const lineProgress = await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userWishlist = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userPracticeLog = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userGoals = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      wordProgress: wordProgress.length,
      userSongProgress: userSongProgress.length,
      lineProgress: lineProgress.length,
      userWishlist: userWishlist.length,
      userPracticeLog: userPracticeLog.length,
      userGoals: userGoals.length,
      userPreferences: userPreferences.length,
      total: wordProgress.length + userSongProgress.length + lineProgress.length +
             userWishlist.length + userPracticeLog.length + userGoals.length + userPreferences.length,
    };
  },
});

export const migrateAnonymousData = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    const userId = await requireAuth(ctx);

    const results = {
      wordProgress: 0,
      userSongProgress: 0,
      lineProgress: 0,
      userWishlist: 0,
      userPracticeLog: 0,
      userGoals: 0,
      userPreferences: 0,
    };

    // 1. wordProgress
    const wordProgressRecords = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    for (const record of wordProgressRecords) {
      // Check if user already has progress for this word to avoid duplicates
      const existing = await ctx.db
        .query("wordProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("persian"), record.persian))
        .first();

      if (!existing) {
        const { _id, _creationTime, ...data } = record;
        await ctx.db.insert("wordProgress", {
          ...data,
          userId,
          visitorId: "migrated", // Use a placeholder to avoid visitorId query conflicts
        });
        results.wordProgress++;
      }
    }

    // 2. userSongProgress
    const songProgressRecords = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    for (const record of songProgressRecords) {
      const existing = await ctx.db
        .query("userSongProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("songId"), record.songId))
        .first();

      if (!existing) {
        const { _id, _creationTime, ...data } = record;
        await ctx.db.insert("userSongProgress", {
          ...data,
          userId,
          visitorId: "migrated",
        });
        results.userSongProgress++;
      }
    }

    // 3. lineProgress
    const lineProgressRecords = await ctx.db
      .query("lineProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    for (const record of lineProgressRecords) {
      const existing = await ctx.db
        .query("lineProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => 
          q.and(
            q.eq(q.field("songId"), record.songId),
            q.eq(q.field("lineNumber"), record.lineNumber)
          )
        )
        .first();

      if (!existing) {
        const { _id, _creationTime, ...data } = record;
        await ctx.db.insert("lineProgress", {
          ...data,
          userId,
          visitorId: "migrated",
        });
        results.lineProgress++;
      }
    }

    // 4. userWishlist
    const wishlistRecords = await ctx.db
      .query("userWishlist")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    for (const record of wishlistRecords) {
      const existing = await ctx.db
        .query("userWishlist")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("songId"), record.songId))
        .first();

      if (!existing) {
        const { _id, _creationTime, ...data } = record;
        await ctx.db.insert("userWishlist", {
          ...data,
          userId,
          visitorId: "migrated",
        });
        results.userWishlist++;
      }
    }

    // 5. userPracticeLog
    const practiceLogRecords = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    for (const record of practiceLogRecords) {
      const existing = await ctx.db
        .query("userPracticeLog")
        .withIndex("by_user_date", (q) => 
          q.eq("userId", userId).eq("date", record.date)
        )
        .first();

      if (!existing) {
        const { _id, _creationTime, ...data } = record;
        await ctx.db.insert("userPracticeLog", {
          ...data,
          userId,
          visitorId: "migrated",
        });
        results.userPracticeLog++;
      }
    }

    // 6. userGoals
    const goalsRecords = await ctx.db
      .query("userGoals")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    for (const record of goalsRecords) {
      const existing = await ctx.db
        .query("userGoals")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => 
          q.and(
            q.eq(q.field("goalType"), record.goalType),
            q.eq(q.field("period"), record.period)
          )
        )
        .first();

      if (!existing) {
        const { _id, _creationTime, ...data } = record;
        await ctx.db.insert("userGoals", {
          ...data,
          userId,
          visitorId: "migrated",
        });
        results.userGoals++;
      }
    }

    // 7. userPreferences
    const preferencesRecords = await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    // Preferences is usually a single record per user
    if (preferencesRecords.length > 0) {
      const existing = await ctx.db
        .query("userPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!existing) {
        const record = preferencesRecords[0]; // Take the first one if multiple exist (shouldn't happen)
        const { _id, _creationTime, ...data } = record;
        await ctx.db.insert("userPreferences", {
          ...data,
          userId,
          visitorId: "migrated",
        });
        results.userPreferences = 1;
      }
    }

    return results;
  },
});
