import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getLanguageMultiplier } from "./languageDifficulty";
import { getAuthUserId, requireAuth } from "./authHelpers";
import { Id } from "./_generated/dataModel";
import { components } from "./_generated/api";

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
async function calculateCurrentStreak(ctx: any, userId: string): Promise<number> {
  const practiceLogs = await ctx.db
    .query("userPracticeLog")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
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

// Get user information for the authenticated user
export const getUserInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId as Id<"users">);

    return {
      email: user?.email,
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
      // Use user's ID for practice data lookup
      const streak = await calculateCurrentStreak(ctx, user._id);

      // Detect user's primary language from their practice data
      const lineProgress = await ctx.db
        .query("lineProgress")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      // Count lines per language
      const languageCounts = new Map<string, number>();
      for (const line of lineProgress) {
        const song = await ctx.db.get(line.songId);
        if (song) {
          const lang = song.sourceLanguage;
          languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
        }
      }

      // Find most practiced language
      let language = "mixed";
      let maxCount = 0;
      for (const [lang, count] of languageCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          language = lang;
        }
      }

      userStreaks.push({
        displayName: user.displayName!,
        streak,
        language,
        userId: user._id, // For internal use, not returned
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
      const userId = user._id;
      
      // Get word progress data
      const wordProgress = await ctx.db
        .query("wordProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("learned"), true))
        .collect();

      // Get line progress data
      const lineProgress = await ctx.db
        .query("lineProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
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
        userId: user._id, // For internal use, not returned
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
    type: v.union(v.literal("streak"), v.literal("progress")),
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("all-time"))),
  },
  handler: async (ctx, { type, period: _period = "all-time" }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId as Id<"users">);
    const hasDisplayName = user?.displayName !== undefined;

    if (type === "streak") {
      // Calculate user's streak
      const userStreak = await calculateCurrentStreak(ctx, userId);

      // Get all users with better streaks to determine rank
      const allUsers = await ctx.db
        .query("users")
        .filter((q) => q.neq(q.field("displayName"), undefined))
        .collect();

      let betterCount = 0;
      for (const otherUser of allUsers) {
        const otherStreak = await calculateCurrentStreak(ctx, otherUser._id);
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
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("learned"), true))
        .collect();

      const lineProgress = await ctx.db
        .query("lineProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
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
        // Calculate other user's score
        const otherWordProgress = await ctx.db
          .query("wordProgress")
          .withIndex("by_user", (q) => q.eq("userId", otherUser._id))
          .filter((q) => q.eq(q.field("learned"), true))
          .collect();

        const otherLineProgress = await ctx.db
          .query("lineProgress")
          .withIndex("by_user", (q) => q.eq("userId", otherUser._id))
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
    displayName: v.string(),
  },
  handler: async (ctx, { displayName }) => {
    const userId = await requireAuth(ctx);

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

    // Update app user's displayName
    const trimmedName = displayName.trim();
    await ctx.db.patch(userId as Id<"users">, {
      displayName: trimmedName,
    });

    // Also sync to Better Auth's displayUsername
    try {
      const appUser = await ctx.db.get(userId as Id<"users">);
      if (appUser?.authId) {
        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: "user",
            where: [{ field: "_id", value: appUser.authId }],
            update: { displayUsername: trimmedName },
          },
        });
      }
    } catch (error) {
      console.error("Failed to sync displayName to Better Auth:", error);
      // Don't fail the mutation - app user is already updated
    }

    return { success: true };
  },
});
