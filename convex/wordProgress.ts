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
// Uses persian text as the unique key - all word instances share one progress record
export const incrementViewCount = mutation({
  args: { visitorId: v.string(), wordId: v.id("words"), persian: v.string() },
  handler: async (ctx, args) => {
    // Look up by persian text first - this is the canonical key
    const existingPersian = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_persian", (q) =>
        q.eq("visitorId", args.visitorId).eq("persian", args.persian)
      )
      .first();

    if (existingPersian) {
      // Update the existing record (shared across all instances of this word)
      await ctx.db.patch(existingPersian._id, {
        viewCount: existingPersian.viewCount + 1,
        lastSeen: Date.now(),
      });
      return existingPersian._id;
    } else {
      // No record exists for this persian word - create one
      return await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        persian: args.persian,
        viewCount: 1,
        playCount: 0,
        learned: false,
        lastSeen: Date.now(),
      });
    }
  },
});

// Increment play count for a word
// Uses persian text as the unique key - all word instances share one progress record
export const incrementPlayCount = mutation({
  args: { visitorId: v.string(), wordId: v.id("words"), persian: v.string() },
  handler: async (ctx, args) => {
    // Look up by persian text first - this is the canonical key
    const existingPersian = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_persian", (q) =>
        q.eq("visitorId", args.visitorId).eq("persian", args.persian)
      )
      .first();

    if (existingPersian) {
      // Update the existing record (shared across all instances of this word)
      await ctx.db.patch(existingPersian._id, {
        playCount: existingPersian.playCount + 1,
        lastSeen: Date.now(),
      });
      return existingPersian._id;
    } else {
      // No record exists for this persian word - create one
      return await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        persian: args.persian,
        viewCount: 0,
        playCount: 1,
        learned: false,
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

// Migration: Deduplicate wordProgress entries by (visitorId, persian)
// Keeps the entry with highest viewCount+playCount, or most recent lastSeen if counts are equal
// Merges counts from duplicates into the kept entry
export const deduplicateWordProgress = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all wordProgress records
    const allProgress = await ctx.db.query("wordProgress").collect();

    // Group by (visitorId, persian)
    const groups: Map<string, typeof allProgress> = new Map();
    for (const progress of allProgress) {
      if (!progress.persian) continue; // Skip entries without persian field
      const key = `${progress.visitorId}:${progress.persian}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(progress);
    }

    let deleted = 0;
    let merged = 0;

    // Process each group
    for (const [_key, entries] of groups) {
      if (entries.length <= 1) continue; // No duplicates

      // Sort by: learned first, then by (viewCount + playCount) desc, then by lastSeen desc
      entries.sort((a, b) => {
        // Learned entries first
        if (a.learned !== b.learned) return b.learned ? 1 : -1;
        // Higher counts first
        const aTotal = a.viewCount + a.playCount;
        const bTotal = b.viewCount + b.playCount;
        if (aTotal !== bTotal) return bTotal - aTotal;
        // Most recent first
        return b.lastSeen - a.lastSeen;
      });

      // Keep the first entry (best one), delete the rest
      const keeper = entries[0];

      // Merge counts from all duplicates into the keeper
      let totalViewCount = keeper.viewCount;
      let totalPlayCount = keeper.playCount;
      let isLearned = keeper.learned;

      for (let i = 1; i < entries.length; i++) {
        const dup = entries[i];
        totalViewCount += dup.viewCount;
        totalPlayCount += dup.playCount;
        isLearned = isLearned || dup.learned; // If any was learned, keep learned
        await ctx.db.delete(dup._id);
        deleted++;
      }

      // Update keeper with merged counts
      await ctx.db.patch(keeper._id, {
        viewCount: totalViewCount,
        playCount: totalPlayCount,
        learned: isLearned,
      });
      merged++;
    }

    return {
      totalRecords: allProgress.length,
      groupsProcessed: groups.size,
      duplicatesDeleted: deleted,
      recordsMerged: merged,
    };
  },
});

// Query: Check for duplicate wordProgress entries (for auditing)
export const checkDuplicates = query({
  args: {},
  handler: async (ctx) => {
    const allProgress = await ctx.db.query("wordProgress").collect();

    // Group by (visitorId, persian)
    const groups: Map<string, number> = new Map();
    for (const progress of allProgress) {
      if (!progress.persian) continue;
      const key = `${progress.visitorId}:${progress.persian}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    }

    // Find groups with duplicates
    const duplicates: Array<{ key: string; count: number }> = [];
    for (const [key, count] of groups) {
      if (count > 1) {
        duplicates.push({ key, count });
      }
    }

    return {
      totalRecords: allProgress.length,
      uniquePairs: groups.size,
      duplicatePairs: duplicates.length,
      duplicates: duplicates.sort((a, b) => b.count - a.count),
    };
  },
});
