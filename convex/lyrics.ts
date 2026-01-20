import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

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

// Update timestamps for specific lines (used for fixing timestamp issues)
// LOCKED: Requires explicit unlock if song.timestampsLocked is true
export const updateTimestamps = mutation({
  args: {
    songId: v.id("songs"),
    updates: v.array(
      v.object({
        lineNumber: v.number(),
        startTime: v.number(),
        endTime: v.number(),
      })
    ),
    unlockCode: v.optional(v.string()), // Must be "UNLOCK_TIMESTAMPS" to bypass lock
  },
  handler: async (ctx, args) => {
    // Check if timestamps are locked
    const song = await ctx.db.get(args.songId);
    if (song?.timestampsLocked && args.unlockCode !== "UNLOCK_TIMESTAMPS") {
      throw new ConvexError({
        code: "TIMESTAMPS_LOCKED",
        message: "🔒 This song's timestamps are locked. User must explicitly say 'unlock timestamps' to modify.",
      });
    }

    const results = [];
    for (const update of args.updates) {
      // Find the lyric line by songId and lineNumber
      const lyric = await ctx.db
        .query("lyrics")
        .withIndex("by_song", (q) => q.eq("songId", args.songId))
        .filter((q) => q.eq(q.field("lineNumber"), update.lineNumber))
        .first();

      if (lyric) {
        await ctx.db.patch(lyric._id, {
          startTime: update.startTime,
          endTime: update.endTime,
        });
        results.push({ lineNumber: update.lineNumber, success: true });
      } else {
        results.push({ lineNumber: update.lineNumber, success: false, error: "Line not found" });
      }
    }
    return results;
  },
});
