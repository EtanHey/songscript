import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId, requireAuth } from "./authHelpers";

// Get user preferences for the authenticated user
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Update user preferences (upsert - create if doesn't exist, update if it does)
export const updatePreferences = mutation({
  args: {
    playbackSpeed: v.optional(v.number()),
    languageFilter: v.optional(v.string()),
    playbackMode: v.optional(v.string()),
    videoMuted: v.optional(v.boolean()),
    videoCollapsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const preferences = args;

    // Check if preferences already exist
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing preferences with only the provided fields
      const updates: Record<string, any> = {};
      for (const [key, value] of Object.entries(preferences)) {
        if (value !== undefined) {
          updates[key] = value;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
      }
      return existing._id;
    } else {
      // Create new preferences with defaults for missing fields
      const newPreferences = {
        userId,
        visitorId: "authenticated", // Legacy support
        playbackSpeed: preferences.playbackSpeed ?? 1.0,
        languageFilter: preferences.languageFilter ?? "all",
        playbackMode: preferences.playbackMode ?? "auto",
        videoMuted: preferences.videoMuted ?? true,
        videoCollapsed: preferences.videoCollapsed ?? false,
      };
      
      return await ctx.db.insert("userPreferences", newPreferences);
    }
  },
});
