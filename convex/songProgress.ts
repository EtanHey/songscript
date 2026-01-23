import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId, requireAuth } from "./authHelpers";

// Get all song progress for the authenticated user
export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get all song progress with song details for the authenticated user (for dashboard)
export const getWithSongDetails = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const progress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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

    // Filter out nulls (deleted songs), songs with no progress, and sort by lastPracticed descending
    return withDetails
      .filter((p): p is NonNullable<typeof p> => p !== null && p.linesCompleted.length > 0)
      .sort((a, b) => b.lastPracticed - a.lastPracticed);
  },
});

// Get 3 most recently practiced songs with details for "Continue Learning" section
export const getRecentForContinue = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const progress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by lastPracticed descending and take top 3
    const recent = progress
      .sort((a, b) => b.lastPracticed - a.lastPracticed)
      .slice(0, 3);

    // Get song details, lyrics count, and last line preview for each
    const withDetails = await Promise.all(
      recent.map(async (p) => {
        const song = await ctx.db.get(p.songId);
        if (!song) return null;

        // Get all lyrics for this song
        const lyrics = await ctx.db
          .query("lyrics")
          .withIndex("by_song", (q) => q.eq("songId", p.songId))
          .collect();

        // Find the last practiced line (or first line if none recorded)
        const lastLineIndex = p.lastLineIndex ?? 0;
        const lastLine = lyrics.find((l) => l.lineNumber === lastLineIndex) ?? lyrics[0];
        const lastLinePreview = lastLine
          ? lastLine.original.substring(0, 50) + (lastLine.original.length > 50 ? "..." : "")
          : "";

        return {
          _id: p._id,
          songId: p.songId,
          lastPracticed: p.lastPracticed,
          lastLineIndex,
          lastLinePreview,
          song,
          totalLines: lyrics.length,
          progressPercent: lyrics.length > 0
            ? Math.round((p.linesCompleted.length / lyrics.length) * 100)
            : 0,
        };
      })
    );

    return withDetails.filter((p): p is NonNullable<typeof p> => p !== null);
  },
});

// Get progress for a specific song
export const getByUserSong = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) =>
        q.eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .first();
  },
});

// Record that a line was practiced/completed
export const recordLineCompletion = mutation({
  args: {
    songId: v.id("songs"),
    lineNumber: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) =>
        q.eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .first();

    if (existing) {
      // Add line to completed list if not already there
      const linesCompleted = existing.linesCompleted.includes(args.lineNumber)
        ? existing.linesCompleted
        : [...existing.linesCompleted, args.lineNumber].sort((a, b) => a - b);

      await ctx.db.patch(existing._id, {
        linesCompleted,
        lastPracticed: Date.now(),
        lastLineIndex: args.lineNumber,
      });
      return existing._id;
    } else {
      // Create new progress record
      return await ctx.db.insert("userSongProgress", {
        userId,
        visitorId: "authenticated",
        songId: args.songId,
        linesCompleted: [args.lineNumber],
        lastPracticed: Date.now(),
        lastLineIndex: args.lineNumber,
      });
    }
  },
});

// Record multiple lines as practiced at once
export const recordLinesCompletion = mutation({
  args: {
    songId: v.id("songs"),
    lineNumbers: v.array(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    if (args.lineNumbers.length === 0) return null;

    const existing = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) =>
        q.eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .first();

    // Track the highest line number as the "last" position
    const lastLineIndex = Math.max(...args.lineNumbers);

    if (existing) {
      // Merge new lines with existing, avoiding duplicates
      const lineSet = new Set([...existing.linesCompleted, ...args.lineNumbers]);
      const linesCompleted = [...lineSet].sort((a, b) => a - b);

      await ctx.db.patch(existing._id, {
        linesCompleted,
        lastPracticed: Date.now(),
        lastLineIndex,
      });
      return existing._id;
    } else {
      // Create new progress record
      const linesCompleted = [...new Set(args.lineNumbers)].sort((a, b) => a - b);
      return await ctx.db.insert("userSongProgress", {
        userId,
        visitorId: "authenticated",
        songId: args.songId,
        linesCompleted,
        lastPracticed: Date.now(),
        lastLineIndex,
      });
    }
  },
});

// Toggle whether a line is marked as "learned" (mastery state)
// Also updates userSongProgress so the song appears in "My Songs" dashboard
export const toggleLineLearned = mutation({
  args: {
    songId: v.id("songs"),
    lineNumber: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) =>
        q.eq("userId", userId)
      )
      .filter((q) =>
        q.eq(q.field("songId"), args.songId) &&
        q.eq(q.field("lineNumber"), args.lineNumber)
      )
      .first();

    let lineProgressId;
    let isNowLearned: boolean;

    if (existing) {
      // Toggle the learned state
      isNowLearned = !existing.learned;
      await ctx.db.patch(existing._id, {
        learned: isNowLearned,
      });
      lineProgressId = existing._id;
    } else {
      // Create new line progress record as learned
      isNowLearned = true;
      lineProgressId = await ctx.db.insert("lineProgress", {
        userId,
        visitorId: "authenticated",
        songId: args.songId,
        lineNumber: args.lineNumber,
        learned: true,
      });
    }

    // Also update userSongProgress so song appears in "My Songs" dashboard
    const songProgress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .first();

    if (songProgress) {
      // Update existing song progress
      let linesCompleted = [...songProgress.linesCompleted];
      if (isNowLearned && !linesCompleted.includes(args.lineNumber)) {
        linesCompleted.push(args.lineNumber);
        linesCompleted.sort((a, b) => a - b);
      } else if (!isNowLearned) {
        linesCompleted = linesCompleted.filter((n) => n !== args.lineNumber);
      }

      await ctx.db.patch(songProgress._id, {
        linesCompleted,
        lastPracticed: Date.now(),
        lastLineIndex: args.lineNumber,
      });
    } else if (isNowLearned) {
      // Create new song progress record
      await ctx.db.insert("userSongProgress", {
        userId,
        visitorId: "authenticated",
        songId: args.songId,
        linesCompleted: [args.lineNumber],
        lastPracticed: Date.now(),
        lastLineIndex: args.lineNumber,
      });
    }

    return lineProgressId;
  },
});

// Get line progress for a specific song
export const getLineProgressByUserSong = query({
  args: { songId: v.id("songs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) =>
        q.eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .collect();
  },
});