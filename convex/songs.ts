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

// Delete a song and all its lyrics/words
export const deleteSong = mutation({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    // Delete all lyrics for this song
    const lyrics = await ctx.db
      .query("lyrics")
      .withIndex("by_song", (q) => q.eq("songId", args.songId))
      .collect();
    for (const lyric of lyrics) {
      await ctx.db.delete(lyric._id);
    }

    // Delete all words for this song
    const words = await ctx.db
      .query("words")
      .withIndex("by_song_line", (q) => q.eq("songId", args.songId))
      .collect();
    for (const word of words) {
      await ctx.db.delete(word._id);
    }

    // Delete the song itself
    await ctx.db.delete(args.songId);
    return { deleted: true, lyrics: lyrics.length, words: words.length };
  },
});

// Set the video URL for a song
export const setVideoUrl = mutation({
  args: { songId: v.id("songs"), videoUrl: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.songId, { videoUrl: args.videoUrl });
    return { success: true };
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
