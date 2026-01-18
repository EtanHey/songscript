import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBySong = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lyrics")
      .withIndex("by_song", (q) => q.eq("songId", args.songId))
      .collect();
  },
});

export const create = mutation({
  args: {
    songId: v.id("songs"),
    lineNumber: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    original: v.string(),
    transliteration: v.string(),
    hebrew: v.optional(v.string()),
    english: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lyrics", args);
  },
});

export const createMany = mutation({
  args: {
    songId: v.id("songs"),
    lyrics: v.array(
      v.object({
        lineNumber: v.number(),
        startTime: v.number(),
        endTime: v.number(),
        original: v.string(),
        transliteration: v.string(),
        hebrew: v.optional(v.string()),
        english: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const lyric of args.lyrics) {
      const id = await ctx.db.insert("lyrics", {
        songId: args.songId,
        ...lyric,
      });
      ids.push(id);
    }
    return ids;
  },
});
