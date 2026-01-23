import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./authHelpers";
import type { Id } from "./_generated/dataModel";
import { validateAnonymousProgress } from "./lib/validation";

/**
 * BUG-026 Fix: Migrate progress data from old Better Auth ID to new app users ID
 *
 * Root cause: Old system stored userId = Better Auth user._id directly
 * New system: getAuthUserId() returns app users table _id (which links to Better Auth via authId)
 *
 * This is a one-time migration to update existing records.
 */
export const migrateUserIdFromBetterAuthToAppUsers = internalMutation({
  args: {
    oldUserId: v.string(), // The Better Auth user._id stored in progress tables
    newUserId: v.string(), // The app users table _id
  },
  handler: async (ctx, { oldUserId, newUserId }) => {
    const results = {
      wordProgress: 0,
      userSongProgress: 0,
      lineProgress: 0,
      userWishlist: 0,
      userPracticeLog: 0,
      userGoals: 0,
      userPreferences: 0,
    };

    // 1. Migrate wordProgress records
    const wordProgressRecords = await ctx.db
      .query("wordProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of wordProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.wordProgress++;
    }

    // 2. Migrate userSongProgress records
    const songProgressRecords = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of songProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userSongProgress++;
    }

    // 3. Migrate lineProgress records
    const lineProgressRecords = await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of lineProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.lineProgress++;
    }

    // 4. Migrate userWishlist records
    const wishlistRecords = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of wishlistRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userWishlist++;
    }

    // 5. Migrate userPracticeLog records
    const practiceLogRecords = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of practiceLogRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userPracticeLog++;
    }

    // 6. Migrate userGoals records
    const goalsRecords = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of goalsRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userGoals++;
    }

    // 7. Migrate userPreferences records
    const preferencesRecords = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of preferencesRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userPreferences++;
    }

    return results;
  },
});

/**
 * Public wrapper to run the migration (for CLI execution)
 * Usage: npx convex run migration:runUserIdMigration '{"oldUserId": "...", "newUserId": "..."}'
 */
export const runUserIdMigration = mutation({
  args: {
    oldUserId: v.string(),
    newUserId: v.string(),
  },
  handler: async (ctx, { oldUserId, newUserId }) => {
    const results = {
      wordProgress: 0,
      userSongProgress: 0,
      lineProgress: 0,
      userWishlist: 0,
      userPracticeLog: 0,
      userGoals: 0,
      userPreferences: 0,
    };

    // 1. Migrate wordProgress records
    const wordProgressRecords = await ctx.db
      .query("wordProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of wordProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.wordProgress++;
    }

    // 2. Migrate userSongProgress records
    const songProgressRecords = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of songProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userSongProgress++;
    }

    // 3. Migrate lineProgress records
    const lineProgressRecords = await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of lineProgressRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.lineProgress++;
    }

    // 4. Migrate userWishlist records
    const wishlistRecords = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of wishlistRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userWishlist++;
    }

    // 5. Migrate userPracticeLog records
    const practiceLogRecords = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of practiceLogRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userPracticeLog++;
    }

    // 6. Migrate userGoals records
    const goalsRecords = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of goalsRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userGoals++;
    }

    // 7. Migrate userPreferences records
    const preferencesRecords = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", oldUserId))
      .collect();

    for (const record of preferencesRecords) {
      await ctx.db.patch(record._id, { userId: newUserId });
      results.userPreferences++;
    }

    return results;
  },
});

/**
 * Query to verify progress data counts for a user
 */
export const verifyUserProgressData = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const wordProgress = await ctx.db
      .query("wordProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userSongProgress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const lineProgress = await ctx.db
      .query("lineProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userWishlist = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userPracticeLog = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userGoals = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      wordProgress: wordProgress.length,
      userSongProgress: userSongProgress.length,
      lineProgress: lineProgress.length,
      userWishlist: userWishlist.length,
      userPracticeLog: userPracticeLog.length,
      userGoals: userGoals.length,
      userPreferences: userPreferences.length,
      total: wordProgress.length + userSongProgress.length + lineProgress.length +
             userWishlist.length + userPracticeLog.length + userGoals.length + userPreferences.length,
    };
  },
});

/**
 * Migrate anonymous progress data from localStorage to Convex
 *
 * SECURITY NOTE: This mutation accepts user-submitted data from localStorage.
 * All data is validated and sanitized before insertion using validation helpers.
 *
 * The mutation:
 * - Requires authentication (user must be logged in)
 * - Validates all input data types and bounds
 * - Rejects malformed data gracefully (partial success OK)
 * - Checks for duplicates to avoid data conflicts
 * - Returns count of successfully migrated records
 */
export const migrateAnonymousData = mutation({
  args: {
    progressData: v.object({
      visitorId: v.string(),
      wordProgress: v.array(
        v.object({
          persian: v.string(),
          wordId: v.optional(v.string()),
          learned: v.boolean(),
          viewCount: v.number(),
          playCount: v.number(),
          lastSeen: v.number(),
        })
      ),
      lineProgress: v.array(
        v.object({
          songId: v.string(),
          lineNumber: v.number(),
          learned: v.boolean(),
        })
      ),
      songProgress: v.array(
        v.object({
          songId: v.string(),
          lastPlayedAt: v.number(),
          totalListenTime: v.number(),
        })
      ),
      practiceLog: v.array(
        v.object({
          date: v.string(),
          practiceSeconds: v.number(),
          wordsLearned: v.number(),
          linesCompleted: v.number(),
        })
      ),
      wishlist: v.array(
        v.object({
          songId: v.string(),
          addedAt: v.number(),
        })
      ),
      preferences: v.object({
        playbackSpeed: v.number(),
        languageFilter: v.string(),
        playbackMode: v.string(),
        videoMuted: v.boolean(),
        videoCollapsed: v.boolean(),
      }),
    }),
  },
  handler: async (ctx, { progressData }) => {
    const userId = await requireAuth(ctx);

    // Validate all input data
    const validated = validateAnonymousProgress(progressData);

    // Log validation errors for debugging (server-side only)
    if (validated.errors.length > 0) {
      console.warn(
        `[migrateAnonymousData] Validation warnings for user ${userId}:`,
        validated.errors.slice(0, 10) // Limit log size
      );
    }

    const results = {
      wordProgress: 0,
      userSongProgress: 0,
      lineProgress: 0,
      userWishlist: 0,
      userPracticeLog: 0,
      userGoals: 0,
      userPreferences: 0,
      validationErrorCount: validated.totalInvalidCount,
    };

    // 1. Migrate word progress
    for (const word of validated.wordProgress) {
      // Check for duplicates by persian text
      const existing = await ctx.db
        .query("wordProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("persian"), word.persian))
        .first();

      if (!existing) {
        // We need a wordId for the schema - find a matching word in the database
        // or skip if we can't find one (wordId is required in schema)
        let wordId = word.wordId;

        // If no wordId provided, try to find a word with matching persian text
        if (!wordId) {
          const matchingWord = await ctx.db
            .query("words")
            .filter((q) => q.eq(q.field("persian"), word.persian))
            .first();
          if (matchingWord) {
            wordId = matchingWord._id;
          }
        }

        // Only insert if we have a valid wordId (schema requires it)
        if (wordId) {
          try {
            await ctx.db.insert("wordProgress", {
              userId,
              visitorId: "migrated",
              wordId: wordId as Id<"words">,
              persian: word.persian,
              learned: word.learned,
              viewCount: word.viewCount,
              playCount: word.playCount,
              lastSeen: word.lastSeen,
            });
            results.wordProgress++;
          } catch (e) {
            // Log but continue - partial success OK
            console.warn(`[migrateAnonymousData] Failed to insert word "${word.persian}":`, e);
          }
        }
      }
    }

    // 2. Migrate line progress
    for (const line of validated.lineProgress) {
      // Validate songId exists
      const song = await ctx.db.get(line.songId as Id<"songs">);
      if (!song) {
        continue; // Skip invalid song references
      }

      // Check for duplicates
      const existing = await ctx.db
        .query("lineProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("songId"), line.songId as Id<"songs">),
            q.eq(q.field("lineNumber"), line.lineNumber)
          )
        )
        .first();

      if (!existing) {
        try {
          await ctx.db.insert("lineProgress", {
            userId,
            visitorId: "migrated",
            songId: line.songId as Id<"songs">,
            lineNumber: line.lineNumber,
            learned: line.learned,
          });
          results.lineProgress++;
        } catch (e) {
          console.warn(`[migrateAnonymousData] Failed to insert line progress:`, e);
        }
      }
    }

    // 3. Migrate song progress
    for (const songProg of validated.songProgress) {
      // Validate songId exists
      const song = await ctx.db.get(songProg.songId as Id<"songs">);
      if (!song) {
        continue;
      }

      // Check for duplicates
      const existing = await ctx.db
        .query("userSongProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("songId"), songProg.songId as Id<"songs">))
        .first();

      if (!existing) {
        try {
          await ctx.db.insert("userSongProgress", {
            userId,
            visitorId: "migrated",
            songId: songProg.songId as Id<"songs">,
            linesCompleted: [],
            lastPracticed: songProg.lastPlayedAt,
          });
          results.userSongProgress++;
        } catch (e) {
          console.warn(`[migrateAnonymousData] Failed to insert song progress:`, e);
        }
      }
    }

    // 4. Migrate practice log
    for (const log of validated.practiceLog) {
      // Check for duplicates by date
      const existing = await ctx.db
        .query("userPracticeLog")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", log.date))
        .first();

      if (!existing) {
        try {
          await ctx.db.insert("userPracticeLog", {
            userId,
            visitorId: "migrated",
            date: log.date,
            practiceCount: 1, // Default count
            totalSeconds: log.practiceSeconds,
          });
          results.userPracticeLog++;
        } catch (e) {
          console.warn(`[migrateAnonymousData] Failed to insert practice log:`, e);
        }
      }
    }

    // 5. Migrate wishlist
    for (const wish of validated.wishlist) {
      // Validate songId exists
      const song = await ctx.db.get(wish.songId as Id<"songs">);
      if (!song) {
        continue;
      }

      // Check for duplicates
      const existing = await ctx.db
        .query("userWishlist")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("songId"), wish.songId as Id<"songs">))
        .first();

      if (!existing) {
        // Get max sortOrder for new item
        const allWishlist = await ctx.db
          .query("userWishlist")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        const maxOrder = allWishlist.reduce(
          (max, item) => Math.max(max, item.sortOrder),
          0
        );

        try {
          await ctx.db.insert("userWishlist", {
            userId,
            visitorId: "migrated",
            songId: wish.songId as Id<"songs">,
            addedAt: wish.addedAt,
            sortOrder: maxOrder + 1,
          });
          results.userWishlist++;
        } catch (e) {
          console.warn(`[migrateAnonymousData] Failed to insert wishlist:`, e);
        }
      }
    }

    // 6. Migrate goals
    for (const goal of validated.goals) {
      // Check for duplicates by goalType and period
      const existing = await ctx.db
        .query("userGoals")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("goalType"), goal.goalType),
            q.eq(q.field("period"), goal.period)
          )
        )
        .first();

      if (!existing) {
        try {
          await ctx.db.insert("userGoals", {
            userId,
            visitorId: "migrated",
            goalType: goal.goalType,
            period: goal.period,
            targetValue: goal.targetValue,
            isActive: goal.isActive,
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt,
          });
          results.userGoals++;
        } catch (e) {
          console.warn(`[migrateAnonymousData] Failed to insert goal:`, e);
        }
      }
    }

    // 7. Migrate preferences
    if (validated.preferences) {
      const existing = await ctx.db
        .query("userPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!existing) {
        try {
          await ctx.db.insert("userPreferences", {
            userId,
            visitorId: "migrated",
            playbackSpeed: validated.preferences.playbackSpeed,
            languageFilter: validated.preferences.languageFilter,
            playbackMode: validated.preferences.playbackMode,
            videoMuted: validated.preferences.videoMuted,
            videoCollapsed: validated.preferences.videoCollapsed,
          });
          results.userPreferences = 1;
        } catch (e) {
          console.warn(`[migrateAnonymousData] Failed to insert preferences:`, e);
        }
      }
    }

    return results;
  },
});

/**
 * Update lyrics timestamps for a song
 * Used for applying WhisperX-generated timestamps
 */
export const updateLyricsTimestamps = mutation({
  args: {
    songTitle: v.string(),
    timestamps: v.array(
      v.object({
        lineNumber: v.number(),
        startTime: v.number(),
        endTime: v.number(),
      })
    ),
  },
  handler: async (ctx, { songTitle, timestamps }) => {
    // Find the song by title (case-insensitive partial match)
    const allSongs = await ctx.db.query("songs").collect();
    const song = allSongs.find((s) =>
      s.title.toLowerCase().includes(songTitle.toLowerCase())
    );

    if (!song) {
      throw new Error(`Song not found: ${songTitle}`);
    }

    // Get all lyrics for this song
    const lyrics = await ctx.db
      .query("lyrics")
      .withIndex("by_song", (q) => q.eq("songId", song._id))
      .collect();

    let updated = 0;

    for (const ts of timestamps) {
      const lyric = lyrics.find((l) => l.lineNumber === ts.lineNumber);
      if (lyric) {
        await ctx.db.patch(lyric._id, {
          startTime: ts.startTime,
          endTime: ts.endTime,
        });
        updated++;
      }
    }

    return { updated, total: timestamps.length };
  },
});
