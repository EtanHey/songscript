import { mutation } from "./_generated/server";

// Create test practice data for dashboard testing
export const createTestPracticeData = mutation({
  args: {},
  handler: async (ctx) => {
    const visitorId = "test-visitor-123";
    // Get the Baraye song
    const song = await ctx.db
      .query("songs")
      .filter((q) => q.eq(q.field("youtubeId"), "0th9_v-BbUI"))
      .first();

    if (!song) {
      throw new Error("Baraye song not found. Run seedBaraye first.");
    }

    // Create song progress - mark some lines as completed
    const completedLines = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    await ctx.db.insert("userSongProgress", {
      visitorId,
      songId: song._id,
      linesCompleted: completedLines,
      lastPracticed: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      lastLineIndex: 10,
    });

    // Create practice log entries for the last 10 days
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Vary practice count and duration
      const practiceCount = Math.floor(Math.random() * 5) + 1; // 1-5 sessions
      const totalSeconds = Math.floor(Math.random() * 1800) + 300; // 5-35 minutes

      await ctx.db.insert("userPracticeLog", {
        visitorId,
        date: dateStr,
        practiceCount,
        totalSeconds,
      });
    }

    // Create some word progress
    const words = await ctx.db
      .query("words")
      .withIndex("by_song_line", (q) => q.eq("songId", song._id))
      .take(20); // First 20 words

    for (const word of words) {
      await ctx.db.insert("wordProgress", {
        visitorId,
        wordId: word._id,
        persian: word.persian,
        viewCount: Math.floor(Math.random() * 10) + 1,
        playCount: Math.floor(Math.random() * 5),
        learned: Math.random() > 0.5, // 50% chance of being learned
        lastSeen: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24), // Within last day
      });
    }

    // Add to wishlist
    await ctx.db.insert("userWishlist", {
      visitorId,
      songId: song._id,
      addedAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
      sortOrder: 1,
    });

    // Create some goals
    await ctx.db.insert("userGoals", {
      visitorId,
      goalType: "words",
      period: "daily",
      targetValue: 10,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("userGoals", {
      visitorId,
      goalType: "time",
      period: "daily", 
      targetValue: 30, // 30 minutes
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      message: "Test practice data created successfully",
      visitorId,
      songId: song._id,
    };
  },
});
