import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user preferences for a visitor
export const getByVisitor = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();
  },
});

// Update user preferences (upsert - create if doesn't exist, update if it does)
export const updatePreferences = mutation({
  args: {
    visitorId: v.string(),
    playbackSpeed: v.optional(v.number()),
    languageFilter: v.optional(v.string()),
    playbackMode: v.optional(v.string()),
    videoMuted: v.optional(v.boolean()),
    videoCollapsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { visitorId, ...preferences } = args;

    // Check if preferences already exist
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
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
        visitorId,
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
