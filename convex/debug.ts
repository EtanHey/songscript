import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check if there's any practice data
export const checkPracticeData = query({
  args: { visitorId: v.optional(v.string()) },
  handler: async (ctx, { visitorId }) => {
    // Get all practice logs
    const allPracticeLogs = await ctx.db.query("userPracticeLog").collect();
    
    // Get all song progress
    const allSongProgress = await ctx.db.query("userSongProgress").collect();
    
    // Get all word progress
    const allWordProgress = await ctx.db.query("wordProgress").collect();
    
    // Get specific visitor data if provided
    let visitorPracticeLogs = [];
    let visitorSongProgress = [];
    let visitorWordProgress = [];
    
    if (visitorId) {
      visitorPracticeLogs = await ctx.db
        .query("userPracticeLog")
        .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
        .collect();
        
      visitorSongProgress = await ctx.db
        .query("userSongProgress")
        .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
        .collect();
        
      visitorWordProgress = await ctx.db
        .query("wordProgress")
        .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
        .collect();
    }
    
    return {
      totalPracticeLogs: allPracticeLogs.length,
      totalSongProgress: allSongProgress.length,
      totalWordProgress: allWordProgress.length,
      visitorPracticeLogs: visitorPracticeLogs.length,
      visitorSongProgress: visitorSongProgress.length,
      visitorWordProgress: visitorWordProgress.length,
      samplePracticeLogs: allPracticeLogs.slice(0, 3),
      sampleSongProgress: allSongProgress.slice(0, 3),
      sampleWordProgress: allWordProgress.slice(0, 3),
    };
  },
});

// Create test practice data for debugging
export const createTestPracticeData = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    // Create practice logs for today and yesterday
    const todayLog = await ctx.db.insert("userPracticeLog", {
      visitorId,
      date: today,
      practiceCount: 5,
      totalSeconds: 1800, // 30 minutes
      totalPoints: 60, // 30 minutes * 2 points per minute
    });
    
    const yesterdayLog = await ctx.db.insert("userPracticeLog", {
      visitorId,
      date: yesterday,
      practiceCount: 3,
      totalSeconds: 900, // 15 minutes
      totalPoints: 30, // 15 minutes * 2 points per minute
    });
    
    // Get the first song
    const song = await ctx.db.query("songs").first();
    if (!song) {
      throw new Error("No songs found");
    }
    
    // Create song progress
    const songProgress = await ctx.db.insert("userSongProgress", {
      visitorId,
      songId: song._id,
      linesCompleted: [1, 2, 3, 4, 5], // 5 lines completed
      lastPracticed: Date.now(),
    });
    
    // Get some words from the song
    const words = await ctx.db
      .query("words")
      .withIndex("by_song_line", (q) => q.eq("songId", song._id))
      .take(10);
    
    // Create word progress for some words
    const wordProgressIds = [];
    for (let i = 0; i < Math.min(5, words.length); i++) {
      const word = words[i];
      const wordProgressId = await ctx.db.insert("wordProgress", {
        visitorId,
        wordId: word._id,
        persian: word.persian,
        viewCount: 3,
        playCount: 2,
        learned: true,
        lastSeen: Date.now(),
      });
      wordProgressIds.push(wordProgressId);
    }
    
    return {
      todayLog,
      yesterdayLog,
      songProgress,
      wordProgressIds,
      message: "Test practice data created successfully"
    };
  },
});
