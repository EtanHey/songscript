import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all words for a specific line
export const getByLine = query({
  args: { songId: v.id("songs"), lineNumber: v.number() },
  handler: async (ctx, args) => {
    const words = await ctx.db
      .query("words")
      .withIndex("by_song_line", (q) =>
        q.eq("songId", args.songId).eq("lineNumber", args.lineNumber)
      )
      .collect();
    // Sort by wordIndex to ensure correct order
    return words.sort((a, b) => a.wordIndex - b.wordIndex);
  },
});

// Get all words for a song
export const getBySong = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const words = await ctx.db
      .query("words")
      .withIndex("by_song_line", (q) => q.eq("songId", args.songId))
      .collect();
    // Sort by lineNumber then wordIndex
    return words.sort((a, b) => {
      if (a.lineNumber !== b.lineNumber) {
        return a.lineNumber - b.lineNumber;
      }
      return a.wordIndex - b.wordIndex;
    });
  },
});

// Clear all Forvo audio URLs (they don't work due to CORS/expiration)
export const clearForvoAudioUrls = mutation({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const words = await ctx.db
      .query("words")
      .withIndex("by_song_line", (q) => q.eq("songId", args.songId))
      .collect();

    let cleared = 0;
    for (const word of words) {
      if (word.forvoAudioUrl) {
        await ctx.db.patch(word._id, { forvoAudioUrl: undefined });
        cleared++;
      }
    }
    return { cleared };
  },
});
