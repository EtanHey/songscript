import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all song progress for a visitor
export const getByVisitor = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    if (!args.visitorId) return [];
    return await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();
  },
});

// Get all song progress with song details for a visitor (for dashboard)
export const getWithSongDetails = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    if (!args.visitorId) return [];

    const progress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();

    // Get song details and line counts for each progress entry
    const withDetails = await Promise.all(
      progress.map(async (p) => {
        const song = await ctx.db.get(p.songId);
        if (!song) return null;

        // Get total line count for this song
        const lyrics = await ctx.db
          .query("lyrics")
          .withIndex("by_song", (q) => q.eq("songId", p.songId))
          .collect();

        return {
          ...p,
          song,
          totalLines: lyrics.length,
          progressPercent: lyrics.length > 0
            ? Math.round((p.linesCompleted.length / lyrics.length) * 100)
            : 0,
        };
      })
    );

    // Filter out nulls (deleted songs) and sort by lastPracticed descending
    return withDetails
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.lastPracticed - a.lastPracticed);
  },
});

// Get progress for a specific song
export const getByVisitorSong = query({
  args: { visitorId: v.string(), songId: v.id("songs") },
  handler: async (ctx, args) => {
    if (!args.visitorId) return null;
    return await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor_song", (q) =>
        q.eq("visitorId", args.visitorId).eq("songId", args.songId)
      )
      .first();
  },
});

// Record that a line was practiced/completed
export const recordLineCompletion = mutation({
  args: {
    visitorId: v.string(),
    songId: v.id("songs"),
    lineNumber: v.number()
  },
  handler: async (ctx, args) => {
    if (!args.visitorId) return null;

    const existing = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor_song", (q) =>
        q.eq("visitorId", args.visitorId).eq("songId", args.songId)
      )
      .first();

    if (existing) {
      // Add line to completed list if not already there
      const linesCompleted = existing.linesCompleted.includes(args.lineNumber)
        ? existing.linesCompleted
        : [...existing.linesCompleted, args.lineNumber].sort((a, b) => a - b);

      await ctx.db.patch(existing._id, {
        linesCompleted,
        lastPracticed: Date.now(),
      });
      return existing._id;
    } else {
      // Create new progress record
      return await ctx.db.insert("userSongProgress", {
        visitorId: args.visitorId,
        songId: args.songId,
        linesCompleted: [args.lineNumber],
        lastPracticed: Date.now(),
      });
    }
  },
});

// Record multiple lines as practiced at once
export const recordLinesCompletion = mutation({
  args: {
    visitorId: v.string(),
    songId: v.id("songs"),
    lineNumbers: v.array(v.number())
  },
  handler: async (ctx, args) => {
    if (!args.visitorId || args.lineNumbers.length === 0) return null;

    const existing = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor_song", (q) =>
        q.eq("visitorId", args.visitorId).eq("songId", args.songId)
      )
      .first();

    if (existing) {
      // Merge new lines with existing, avoiding duplicates
      const lineSet = new Set([...existing.linesCompleted, ...args.lineNumbers]);
      const linesCompleted = [...lineSet].sort((a, b) => a - b);

      await ctx.db.patch(existing._id, {
        linesCompleted,
        lastPracticed: Date.now(),
      });
      return existing._id;
    } else {
      // Create new progress record
      const linesCompleted = [...new Set(args.lineNumbers)].sort((a, b) => a - b);
      return await ctx.db.insert("userSongProgress", {
        visitorId: args.visitorId,
        songId: args.songId,
        linesCompleted,
        lastPracticed: Date.now(),
      });
    }
  },
});
