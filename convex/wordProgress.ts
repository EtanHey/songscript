import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all word progress for a visitor
export const getByVisitor = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();
  },
});

// Get progress for a specific word
export const getByVisitorWord = query({
  args: { visitorId: v.string(), wordId: v.id("words") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_word", (q) =>
        q.eq("visitorId", args.visitorId).eq("wordId", args.wordId)
      )
      .first();
  },
});

// Get progress for a word by its Persian text (for syncing across repeated words)
export const getByVisitorPersian = query({
  args: { visitorId: v.string(), persian: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_persian", (q) =>
        q.eq("visitorId", args.visitorId).eq("persian", args.persian)
      )
      .first();
  },
});

// Get progress for multiple words by their Persian text at once (for a line)
// Returns the learned state for each unique word text
export const getByVisitorPersians = query({
  args: { visitorId: v.string(), persians: v.array(v.string()) },
  handler: async (ctx, args) => {
    // Get unique persian words to avoid duplicate lookups
    const uniquePersians = [...new Set(args.persians)];
    const results = await Promise.all(
      uniquePersians.map(async (persian) => {
        const progress = await ctx.db
          .query("wordProgress")
          .withIndex("by_visitor_persian", (q) =>
            q.eq("visitorId", args.visitorId).eq("persian", persian)
          )
          .first();
        return { persian, progress };
      })
    );
    return results;
  },
});

// Get progress for multiple words at once (for a line)
export const getByVisitorWords = query({
  args: { visitorId: v.string(), wordIds: v.array(v.id("words")) },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.wordIds.map(async (wordId) => {
        const progress = await ctx.db
          .query("wordProgress")
          .withIndex("by_visitor_word", (q) =>
            q.eq("visitorId", args.visitorId).eq("wordId", wordId)
          )
          .first();
        return { wordId, progress };
      })
    );
    return results;
  },
});

// Increment view count for a word
export const incrementViewCount = mutation({
  args: { visitorId: v.string(), wordId: v.id("words"), persian: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_word", (q) =>
        q.eq("visitorId", args.visitorId).eq("wordId", args.wordId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        viewCount: existing.viewCount + 1,
        lastSeen: Date.now(),
      });
      return existing._id;
    } else {
      // Check if this persian word has been learned before (from another instance)
      const existingPersian = await ctx.db
        .query("wordProgress")
        .withIndex("by_visitor_persian", (q) =>
          q.eq("visitorId", args.visitorId).eq("persian", args.persian)
        )
        .first();

      return await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        persian: args.persian,
        viewCount: 1,
        playCount: 0,
        learned: existingPersian?.learned ?? false, // Sync learned state from other instances
        lastSeen: Date.now(),
      });
    }
  },
});

// Increment play count for a word
export const incrementPlayCount = mutation({
  args: { visitorId: v.string(), wordId: v.id("words"), persian: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_word", (q) =>
        q.eq("visitorId", args.visitorId).eq("wordId", args.wordId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        playCount: existing.playCount + 1,
        lastSeen: Date.now(),
      });
      return existing._id;
    } else {
      // Check if this persian word has been learned before (from another instance)
      const existingPersian = await ctx.db
        .query("wordProgress")
        .withIndex("by_visitor_persian", (q) =>
          q.eq("visitorId", args.visitorId).eq("persian", args.persian)
        )
        .first();

      return await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        persian: args.persian,
        viewCount: 0,
        playCount: 1,
        learned: existingPersian?.learned ?? false, // Sync learned state from other instances
        lastSeen: Date.now(),
      });
    }
  },
});

// Toggle learned status for a word - syncs across ALL instances with the same persian text
export const toggleLearned = mutation({
  args: { visitorId: v.string(), wordId: v.id("words"), persian: v.string() },
  handler: async (ctx, args) => {
    // Find all progress records for this persian word
    const allMatching = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_persian", (q) =>
        q.eq("visitorId", args.visitorId).eq("persian", args.persian)
      )
      .collect();

    // Determine the new learned state (toggle from current)
    const currentLearned = allMatching.length > 0 ? allMatching[0].learned : false;
    const newLearned = !currentLearned;

    // Update ALL matching records
    await Promise.all(
      allMatching.map((record) =>
        ctx.db.patch(record._id, {
          learned: newLearned,
          lastSeen: Date.now(),
        })
      )
    );

    // If no records exist yet, create one for this specific word instance
    if (allMatching.length === 0) {
      await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        persian: args.persian,
        viewCount: 0,
        playCount: 0,
        learned: true,
        lastSeen: Date.now(),
      });
      return true;
    }

    return newLearned;
  },
});

// Set learned status explicitly - syncs across ALL instances with the same persian text
export const setLearned = mutation({
  args: { visitorId: v.string(), wordId: v.id("words"), persian: v.string(), learned: v.boolean() },
  handler: async (ctx, args) => {
    // Find all progress records for this persian word
    const allMatching = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_persian", (q) =>
        q.eq("visitorId", args.visitorId).eq("persian", args.persian)
      )
      .collect();

    // Update ALL matching records
    await Promise.all(
      allMatching.map((record) =>
        ctx.db.patch(record._id, {
          learned: args.learned,
          lastSeen: Date.now(),
        })
      )
    );

    // If no records exist yet, create one for this specific word instance
    if (allMatching.length === 0) {
      await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        persian: args.persian,
        viewCount: 0,
        playCount: 0,
        learned: args.learned,
        lastSeen: Date.now(),
      });
    }

    return args.learned;
  },
});

// Migration: Backfill persian field for existing wordProgress records
export const migrateAddPersian = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all wordProgress records without persian field
    const allProgress = await ctx.db.query("wordProgress").collect();
    let migrated = 0;

    for (const progress of allProgress) {
      if (!progress.persian) {
        // Look up the word to get its persian text
        const word = await ctx.db.get(progress.wordId);
        if (word) {
          await ctx.db.patch(progress._id, { persian: word.persian });
          migrated++;
        }
      }
    }

    return { migrated, total: allProgress.length };
  },
});
