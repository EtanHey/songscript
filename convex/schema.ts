import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // App-specific users table (linked to Better Auth via authId)
  users: defineTable({
    email: v.string(),
    authId: v.optional(v.string()), // Links to Better Auth user
    role: v.optional(v.string()), // "admin" or "user"
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
    wordId: v.id("words"), // Reference to a specific word instance (for view/play counts)
    persian: v.optional(v.string()), // The actual word text - used for syncing learned state across instances
    viewCount: v.number(),
    playCount: v.number(),
    learned: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_visitor", ["visitorId"])
    .index("by_visitor_word", ["visitorId", "wordId"])
    .index("by_visitor_persian", ["visitorId", "persian"]),

  // Track user's song-level practice progress
  // Records which lines have been practiced/completed in each song
  userSongProgress: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    songId: v.id("songs"),
    linesCompleted: v.array(v.number()), // Array of line numbers that have been practiced
    lastPracticed: v.number(), // Timestamp of last practice
  })
    .index("by_visitor", ["visitorId"])
    .index("by_visitor_song", ["visitorId", "songId"]),

  // User's learning queue / wishlist of songs to learn later
  userWishlist: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    songId: v.id("songs"),
    addedAt: v.number(), // Timestamp when added
    sortOrder: v.number(), // User's custom order (lower = higher priority)
  })
    .index("by_visitor", ["visitorId"])
    .index("by_visitor_song", ["visitorId", "songId"]),

  // Daily practice log for streak tracking and heatmap
  userPracticeLog: defineTable({
    visitorId: v.string(), // localStorage-generated ID if no auth
    date: v.string(), // YYYY-MM-DD format
    practiceCount: v.number(), // Number of practice sessions that day
    totalSeconds: v.number(), // Total practice time in seconds
  })
    .index("by_visitor", ["visitorId"])
    .index("by_visitor_date", ["visitorId", "date"]),
});
