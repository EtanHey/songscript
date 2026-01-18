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
  args: { visitorId: v.string(), wordId: v.id("words") },
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
      return await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        viewCount: 1,
        playCount: 0,
        learned: false,
        lastSeen: Date.now(),
      });
    }
  },
});

// Increment play count for a word
export const incrementPlayCount = mutation({
  args: { visitorId: v.string(), wordId: v.id("words") },
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
      return await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        viewCount: 0,
        playCount: 1,
        learned: false,
        lastSeen: Date.now(),
      });
    }
  },
});

// Toggle learned status for a word
export const toggleLearned = mutation({
  args: { visitorId: v.string(), wordId: v.id("words") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_word", (q) =>
        q.eq("visitorId", args.visitorId).eq("wordId", args.wordId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        learned: !existing.learned,
        lastSeen: Date.now(),
      });
      return !existing.learned;
    } else {
      await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        viewCount: 0,
        playCount: 0,
        learned: true,
        lastSeen: Date.now(),
      });
      return true;
    }
  },
});

// Set learned status explicitly
export const setLearned = mutation({
  args: { visitorId: v.string(), wordId: v.id("words"), learned: v.boolean() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor_word", (q) =>
        q.eq("visitorId", args.visitorId).eq("wordId", args.wordId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        learned: args.learned,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("wordProgress", {
        visitorId: args.visitorId,
        wordId: args.wordId,
        viewCount: 0,
        playCount: 0,
        learned: args.learned,
        lastSeen: Date.now(),
      });
    }
    return args.learned;
  },
});
