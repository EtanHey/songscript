import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getLanguageMultiplier } from "./languageDifficulty";

// Get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Get date N days ago in YYYY-MM-DD format
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

// Calculate current streak for a user
async function calculateCurrentStreak(ctx: any, visitorId: string): Promise<number> {
  const practiceLogs = await ctx.db
    .query("userPracticeLog")
    .withIndex("by_visitor", (q: any) => q.eq("visitorId", visitorId))
    .collect();

  if (practiceLogs.length === 0) {
    return 0;
  }

  // Create a map of dates that have practice
  const practiceMap = new Map<string, boolean>();
  for (const log of practiceLogs) {
    if (log.practiceCount > 0) {
      practiceMap.set(log.date, true);
    }
  }

  const today = getTodayDateString();
  const yesterday = getDateDaysAgo(1);
  const hasPracticedToday = practiceMap.has(today);
  const hasPracticedYesterday = practiceMap.has(yesterday);

  // If not practiced today or yesterday, streak is 0
  if (!hasPracticedToday && !hasPracticedYesterday) {
    return 0;
  }

  // Count backwards from the most recent day practiced
  const startDate = hasPracticedToday ? today : yesterday;
  let currentStreak = 0;
  let date = startDate;
  
  while (practiceMap.has(date)) {
    currentStreak++;
    const dateObj = new Date(date);
    dateObj.setDate(dateObj.getDate() - 1);
    date = dateObj.toISOString().split("T")[0];
  }

  return currentStreak;
}

// Get user information by visitorId (email)
export const getUserInfo = query({
  args: {
    visitorId: v.string(),
  },
  handler: async (ctx, { visitorId }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), visitorId))
      .first();

    return {
      email: visitorId,
      displayName: user?.displayName || null,
    };
  },
});

// Get streak leaderboard
export const getStreakLeaderboard = query({
  args: {
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("all-time"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 10, offset = 0 }) => {
    // Get all users with displayName set
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("displayName"), undefined))
      .collect();

    // Calculate streak for each user and collect results
    const userStreaks = [];
    
    for (const user of users) {
      // For users, we need to find their visitorId from practice logs
      // Since users table doesn't have visitorId, we'll use email as the key
      // This assumes visitorId matches email for authenticated users
      const streak = await calculateCurrentStreak(ctx, user.email);
      
      // Get user's primary language from their practice data
      // For now, we'll use a placeholder language since we don't have language-specific practice tracking
      const language = "mixed"; // TODO: Implement language detection from practice data
      
      userStreaks.push({
        displayName: user.displayName!,
        streak,
        language,
        email: user.email, // For internal use, not returned
      });
    }

    // Sort by streak descending
    userStreaks.sort((a, b) => b.streak - a.streak);

    // Apply pagination
    const paginatedResults = userStreaks.slice(offset, offset + limit);

    // Add rank and format response
    return paginatedResults.map((user, index) => ({
      rank: offset + index + 1,
      displayName: user.displayName,
      streak: user.streak,
      language: user.language,
    }));
  },
});

// Get progress leaderboard with difficulty multipliers
export const getProgressLeaderboard = query({
  args: {
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("all-time"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 10, offset = 0 }) => {
    // Get all users with displayName set
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("displayName"), undefined))
      .collect();

    // Calculate progress score for each user
    const userScores = [];
    
    for (const user of users) {
      // Use email as visitorId for authenticated users
      const visitorId = user.email;
      
      // Get word progress data
      const wordProgress = await ctx.db
        .query("wordProgress")
        .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
        .filter((q) => q.eq(q.field("learned"), true))
        .collect();

      // Get line progress data
      const lineProgress = await ctx.db
        .query("lineProgress")
        .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
        .filter((q) => q.eq(q.field("learned"), true))
        .collect();

      // Get songs to determine languages
      // Get language data from songs
      const songs = await Promise.all(
        lineProgress.map(async (line) => {
          return await ctx.db.get(line.songId);
        })
      );

      // Calculate weighted scores by language
      const languageScores = new Map<string, { wordsLearned: number, linesCompleted: number }>();
      
      // Count words learned (we'll use a default language since wordProgress doesn't track language directly)
      const defaultLanguage = "mixed";
      if (!languageScores.has(defaultLanguage)) {
        languageScores.set(defaultLanguage, { wordsLearned: 0, linesCompleted: 0 });
      }
      languageScores.get(defaultLanguage)!.wordsLearned = wordProgress.length;

      // Count lines completed by language
      for (let i = 0; i < lineProgress.length; i++) {
        const song = songs[i];
        if (song) {
          const language = song.sourceLanguage;
          if (!languageScores.has(language)) {
            languageScores.set(language, { wordsLearned: 0, linesCompleted: 0 });
          }
          languageScores.get(language)!.linesCompleted++;
        }
      }

      // Calculate total weighted score
      let totalScore = 0;
      let topLanguage = "mixed";
      let maxLanguageScore = 0;

      for (const [language, scores] of languageScores.entries()) {
        const multiplier = getLanguageMultiplier(language);
        const languageScore = (scores.wordsLearned * multiplier) + (scores.linesCompleted * multiplier * 0.5);
        totalScore += languageScore;
        
        if (languageScore > maxLanguageScore) {
          maxLanguageScore = languageScore;
          topLanguage = language;
        }
      }

      userScores.push({
        displayName: user.displayName!,
        progressScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal place
        topLanguage,
        email: user.email, // For internal use, not returned
      });
    }

    // Sort by progress score descending
    userScores.sort((a, b) => b.progressScore - a.progressScore);

    // Apply pagination
    const paginatedResults = userScores.slice(offset, offset + limit);

    // Add rank and format response
    return paginatedResults.map((user, index) => ({
      rank: offset + index + 1,
      displayName: user.displayName,
      score: user.progressScore,
      topLanguage: user.topLanguage,
    }));
  },
});

// Get user's own rank on leaderboard
export const getUserRank = query({
  args: {
    visitorId: v.string(),
    type: v.union(v.literal("streak"), v.literal("progress")),
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("all-time"))),
  },
  handler: async (ctx, { visitorId, type, period: _period = "all-time" }) => {
    // Get user info to check if they have displayName
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), visitorId))
      .first();

    const hasDisplayName = user?.displayName !== undefined;

    if (type === "streak") {
      // Calculate user's streak
      const userStreak = await calculateCurrentStreak(ctx, visitorId);

      // Get all users with better streaks to determine rank
      const allUsers = await ctx.db
        .query("users")
        .filter((q) => q.neq(q.field("displayName"), undefined))
        .collect();

      let betterCount = 0;
      for (const otherUser of allUsers) {
        const otherStreak = await calculateCurrentStreak(ctx, otherUser.email);
        if (otherStreak > userStreak) {
          betterCount++;
        }
      }

      return {
        rank: betterCount + 1,
        score: userStreak,
        hasDisplayName,
      };
    } else {
      // Calculate user's progress score
      const wordProgress = await ctx.db
        .query("wordProgress")
        .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
        .filter((q) => q.eq(q.field("learned"), true))
        .collect();

      const lineProgress = await ctx.db
        .query("lineProgress")
        .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
        .filter((q) => q.eq(q.field("learned"), true))
        .collect();

      // Get songs to determine languages
      const songs = await Promise.all(
        lineProgress.map(async (line) => {
          return await ctx.db.get(line.songId);
        })
      );

      // Calculate weighted scores by language
      const languageScores = new Map<string, { wordsLearned: number, linesCompleted: number }>();
      
      // Count words learned
      const defaultLanguage = "mixed";
      if (!languageScores.has(defaultLanguage)) {
        languageScores.set(defaultLanguage, { wordsLearned: 0, linesCompleted: 0 });
      }
      languageScores.get(defaultLanguage)!.wordsLearned = wordProgress.length;

      // Count lines completed by language
      for (let i = 0; i < lineProgress.length; i++) {
        const song = songs[i];
        if (song) {
          const language = song.sourceLanguage;
          if (!languageScores.has(language)) {
            languageScores.set(language, { wordsLearned: 0, linesCompleted: 0 });
          }
          languageScores.get(language)!.linesCompleted++;
        }
      }

      // Calculate total weighted score
      let userScore = 0;
      for (const [language, scores] of languageScores.entries()) {
        const multiplier = getLanguageMultiplier(language);
        const languageScore = (scores.wordsLearned * multiplier) + (scores.linesCompleted * multiplier * 0.5);
        userScore += languageScore;
      }
      userScore = Math.round(userScore * 10) / 10;

      // Get all users with better scores to determine rank
      const allUsers = await ctx.db
        .query("users")
        .filter((q) => q.neq(q.field("displayName"), undefined))
        .collect();

      let betterCount = 0;
      for (const otherUser of allUsers) {
        // Calculate other user's score (similar logic as above)
        const otherWordProgress = await ctx.db
          .query("wordProgress")
          .withIndex("by_visitor", (q) => q.eq("visitorId", otherUser.email))
          .filter((q) => q.eq(q.field("learned"), true))
          .collect();

        const otherLineProgress = await ctx.db
          .query("lineProgress")
          .withIndex("by_visitor", (q) => q.eq("visitorId", otherUser.email))
          .filter((q) => q.eq(q.field("learned"), true))
          .collect();

        const otherSongs = await Promise.all(
          otherLineProgress.map(async (line) => {
            return await ctx.db.get(line.songId);
          })
        );

        const otherLanguageScores = new Map<string, { wordsLearned: number, linesCompleted: number }>();
        
        if (!otherLanguageScores.has(defaultLanguage)) {
          otherLanguageScores.set(defaultLanguage, { wordsLearned: 0, linesCompleted: 0 });
        }
        otherLanguageScores.get(defaultLanguage)!.wordsLearned = otherWordProgress.length;

        for (let i = 0; i < otherLineProgress.length; i++) {
          const song = otherSongs[i];
          if (song) {
            const language = song.sourceLanguage;
            if (!otherLanguageScores.has(language)) {
              otherLanguageScores.set(language, { wordsLearned: 0, linesCompleted: 0 });
            }
            otherLanguageScores.get(language)!.linesCompleted++;
          }
        }

        let otherScore = 0;
        for (const [language, scores] of otherLanguageScores.entries()) {
          const multiplier = getLanguageMultiplier(language);
          const languageScore = (scores.wordsLearned * multiplier) + (scores.linesCompleted * multiplier * 0.5);
          otherScore += languageScore;
        }
        otherScore = Math.round(otherScore * 10) / 10;

        if (otherScore > userScore) {
          betterCount++;
        }
      }

      return {
        rank: betterCount + 1,
        score: userScore,
        hasDisplayName,
      };
    }
  },
});

// Set or update user's display name
export const setDisplayName = mutation({
  args: {
    visitorId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, { visitorId, displayName }) => {
    // Validate display name length
    if (displayName.length < 3 || displayName.length > 20) {
      return { success: false, error: "Display name must be 3-20 characters" };
    }

    // Validate display name contains valid characters (alphanumeric + spaces)
    const validPattern = /^[a-zA-Z0-9\s]+$/;
    if (!validPattern.test(displayName)) {
      return { success: false, error: "Display name can only contain letters, numbers, and spaces" };
    }

    // Reject names with only spaces
    if (displayName.trim().length === 0) {
      return { success: false, error: "Display name cannot be only spaces" };
    }

    // Basic offensive word filter (simple list)
    const offensiveWords = ["fuck", "shit", "damn", "bitch", "ass", "hell"];
    const lowerDisplayName = displayName.toLowerCase();
    for (const word of offensiveWords) {
      if (lowerDisplayName.includes(word)) {
        return { success: false, error: "Display name contains inappropriate content" };
      }
    }

    // Find existing user by visitorId (email)
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), visitorId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        displayName: displayName.trim(),
      });
    } else {
      // Create new user record
      await ctx.db.insert("users", {
        email: visitorId,
        displayName: displayName.trim(),
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});
