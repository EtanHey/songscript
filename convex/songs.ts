import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("songs").collect();
  },
});

export const getById = query({
  args: { id: v.id("songs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    artist: v.string(),
    youtubeId: v.string(),
    sourceLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("songs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Lock timestamps to prevent AI from modifying them without explicit unlock
export const lockTimestamps = mutation({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.songId, { timestampsLocked: true });
    return { success: true, message: "🔒 Timestamps locked" };
  },
});

// Unlock timestamps (requires user to explicitly request this)
export const unlockTimestamps = mutation({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.songId, { timestampsLocked: false });
    return { success: true, message: "🔓 Timestamps unlocked" };
  },
});
