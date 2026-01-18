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
});
