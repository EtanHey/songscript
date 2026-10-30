import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // App-specific users table (linked to Better Auth via authId)
  users: defineTable({
    email: v.string(),
    authId: v.optional(v.string()), // Links to Better Auth user
    displayName: v.optional(v.string()), // Display name for leaderboard
    createdAt: v.optional(v.number()), // Account creation timestamp
  })
    .index("email", ["email"])
    .index("authId", ["authId"]),

  songs: defineTable({
    title: v.string(),
    artist: v.string(),
    youtubeId: v.string(),
    sourceLanguage: v.string(), // e.g., "persian"
    createdAt: v.number(),
    // Optional local video URL (relative path) for instant seeking without YouTube buffering
    videoUrl: v.optional(v.string()), // e.g., "/video/baraye/baraye.mp4"
    // Lock timestamps to prevent AI from modifying without explicit unlock
    timestampsLocked: v.optional(v.boolean()),
  }),

  lyrics: defineTable({
    songId: v.id("songs"),
    lineNumber: v.number(),
    startTime: v.number(), // seconds
    endTime: v.number(),
    original: v.string(), // Persian text
    transliteration: v.string(),
    hebrew: v.optional(v.string()),
    english: v.string(),
    // Local audio snippet URL (relative path) for instant playback
    audioSnippetUrl: v.optional(v.string()), // e.g., "/audio/baraye/baraye_001.mp3"
  }).index("by_song", ["songId", "lineNumber"]),

  // Word-by-word breakdown for each lyric line
  words: defineTable({
    songId: v.id("songs"),
    lineNumber: v.number(),
    wordIndex: v.number(),
    persian: v.string(),
    transliteration: v.string(),
    hebrew: v.string(),
    english: v.string(),
    grammarType: v.optional(v.string()), // noun, verb, preposition, adjective, etc.
    forvoAudioUrl: v.optional(v.string()), // Future: audio from Forvo or ElevenLabs
  }).index("by_song_line", ["songId", "lineNumber"]),

  // Track user's learning progress for individual words
  // Learning state is keyed by persian text so repeated words (e.g., "برای") sync across all instances
  wordProgress: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    userId: v.optional(v.string()), // Better Auth user ID
    wordId: v.id("words"), // Reference to a specific word instance (for view/play counts)
    persian: v.optional(v.string()), // The actual word text - used for syncing learned state across instances
    viewCount: v.number(),
    playCount: v.number(),
    learned: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_visitor", ["visitorId"])
    .index("by_user", ["userId"])
    .index("by_visitor_word", ["visitorId", "wordId"])
    .index("by_visitor_persian", ["visitorId", "persian"]),

  // Track user's song-level practice progress
  // Records which lines have been practiced/completed in each song
  userSongProgress: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    userId: v.optional(v.string()), // Better Auth user ID
    songId: v.id("songs"),
    linesCompleted: v.array(v.number()), // Array of line numbers that have been practiced
    lastPracticed: v.number(), // Timestamp of last practice
    lastLineIndex: v.optional(v.number()), // Last line index the user was on (for "continue where you left off")
  })
    .index("by_visitor", ["visitorId"])
    .index("by_user", ["userId"])
    .index("by_visitor_song", ["visitorId", "songId"])
    .index("by_user_song", ["userId", "songId"]),

  // Track which lines users have explicitly marked as "learned"
  // Separate from linesCompleted which tracks practice - this is for mastery
  lineProgress: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    userId: v.optional(v.string()), // Better Auth user ID
    songId: v.id("songs"),
    lineNumber: v.number(),
    learned: v.boolean(), // Whether this line is marked as learned
  })
    .index("by_visitor", ["visitorId"])
    .index("by_user", ["userId"])
    .index("by_visitor_song", ["visitorId", "songId"])
    .index("by_visitor_song_line", ["visitorId", "songId", "lineNumber"])
    .index("by_user_song", ["userId", "songId"])
    .index("by_user_song_line", ["userId", "songId", "lineNumber"]),

  // User's learning queue / wishlist of songs to learn later
  userWishlist: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    userId: v.optional(v.string()), // Better Auth user ID
    songId: v.id("songs"),
    addedAt: v.number(), // Timestamp when added
    sortOrder: v.number(), // User's custom order (lower = higher priority)
  })
    .index("by_visitor", ["visitorId"])
    .index("by_user", ["userId"])
    .index("by_visitor_song", ["visitorId", "songId"]),

  // Daily practice log for streak tracking and heatmap
  userPracticeLog: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    userId: v.optional(v.string()), // Better Auth user ID
    date: v.string(), // YYYY-MM-DD format
    practiceCount: v.number(), // Number of practice sessions that day
    totalSeconds: v.number(), // Total practice time in seconds
    totalPoints: v.optional(v.number()), // Total weighted practice points earned
  })
    .index("by_visitor", ["visitorId"])
    .index("by_user", ["userId"])
    .index("by_visitor_date", ["visitorId", "date"])
    .index("by_user_date", ["userId", "date"]),

  // User learning goals (daily/weekly targets)
  userGoals: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    userId: v.optional(v.string()), // Better Auth user ID
    goalType: v.string(), // "words" | "time" | "lines" | "songs"
    period: v.string(), // "daily" | "weekly"
    targetValue: v.number(), // Target number to achieve
    isActive: v.boolean(), // Whether this goal is currently active
    createdAt: v.number(), // Timestamp when created
    updatedAt: v.number(), // Timestamp when last updated
  })
    .index("by_visitor", ["visitorId"])
    .index("by_user", ["userId"])
    .index("by_visitor_type_period", ["visitorId", "goalType", "period"]),

  // User preferences for playback and UI settings
  userPreferences: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    userId: v.optional(v.string()), // Better Auth user ID
    playbackSpeed: v.number(), // Playback speed multiplier (0.5, 1.0, 1.5, 2.0)
    languageFilter: v.string(), // Language preference for display
    playbackMode: v.string(), // "auto" | "manual" | "loop"
    videoMuted: v.boolean(), // Whether video should be muted by default
    videoCollapsed: v.boolean(), // Whether video should be collapsed by default
  })
    .index("by_visitor", ["visitorId"])
    .index("by_user", ["userId"]),

  // Transcription jobs for WhisperX pipeline
  transcriptionJobs: defineTable({
    youtubeUrl: v.string(),
    videoId: v.string(),
    language: v.string(), // Source language code (fa, ko, ar)
    visitorId: v.string(), // Who requested the transcription
    status: v.string(), // pending, downloading, separating, transcribing, processing, completed, failed
    progress: v.number(), // 0-100 progress percentage
    error: v.optional(v.string()), // Error message if failed
    result: v.optional(v.any()), // Transcription result JSON
    songId: v.optional(v.id("songs")), // Created song ID after import
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_visitor", ["visitorId"])
    .index("by_video", ["videoId"])
    .index("by_status", ["status"]),
});
