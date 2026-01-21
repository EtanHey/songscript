import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";

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
