import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId, requireAuth } from "./authHelpers";

/**
 * Get user's wishlist ordered by sortOrder
 * Returns wishlist items with full song details
 */
export const getWishlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const wishlistItems = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by sortOrder (lower = higher priority)
    wishlistItems.sort((a, b) => a.sortOrder - b.sortOrder);

    // Get song details for each item
    const itemsWithSongs = await Promise.all(
      wishlistItems.map(async (item) => {
        const song = await ctx.db.get(item.songId);
        return {
          ...item,
          song: song
            ? {
                _id: song._id,
                title: song.title,
                artist: song.artist,
                youtubeId: song.youtubeId,
                sourceLanguage: song.sourceLanguage,
              }
            : null,
        };
      })
    );

    // Filter out items where song was deleted
    return itemsWithSongs.filter((item) => item.song !== null);
  },
});

/**
 * Check if a song is in user's wishlist
 */
export const isInWishlist = query({
  args: {
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const existing = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .first();

    return existing !== null;
  },
});

/**
 * Add a song to the user's wishlist
 */
export const addToWishlist = mutation({
  args: {
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check if already in wishlist
    const existing = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .first();

    if (existing) {
      return existing._id; // Already in wishlist
    }

    // Get current max sortOrder for this user
    const allItems = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const maxSortOrder =
      allItems.length > 0
        ? Math.max(...allItems.map((item) => item.sortOrder))
        : 0;

    // Add with sortOrder at the end
    return await ctx.db.insert("userWishlist", {
      userId,
      visitorId: "authenticated", // Placeholder for required field
      songId: args.songId,
      addedAt: Date.now(),
      sortOrder: maxSortOrder + 1,
    });
  },
});

/**
 * Remove a song from the user's wishlist
 */
export const removeFromWishlist = mutation({
  args: {
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

/**
 * Reorder wishlist items
 * Takes an array of song IDs in the desired order
 */
export const reorderWishlist = mutation({
  args: {
    songIds: v.array(v.id("songs")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Get all wishlist items for this user
    const items = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Create a map of songId -> wishlist item
    const itemMap = new Map(items.map((item) => [item.songId.toString(), item]));

    // Update sortOrder based on new order
    await Promise.all(
      args.songIds.map(async (songId, index) => {
        const item = itemMap.get(songId.toString());
        if (item && item.sortOrder !== index) {
          await ctx.db.patch(item._id, { sortOrder: index });
        }
      })
    );

    return true;
  },
});

/**
 * Toggle wishlist status - adds if not present, removes if present
 * Returns the new status (true = now in wishlist, false = removed)
 */
export const toggleWishlist = mutation({
  args: {
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("songId"), args.songId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // Removed from wishlist
    }

    // Get current max sortOrder
    const allItems = await ctx.db
      .query("userWishlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const maxSortOrder =
      allItems.length > 0
        ? Math.max(...allItems.map((item) => item.sortOrder))
        : 0;

    await ctx.db.insert("userWishlist", {
      userId,
      visitorId: "authenticated", // Placeholder for required field
      songId: args.songId,
      addedAt: Date.now(),
      sortOrder: maxSortOrder + 1,
    });

    return true; // Added to wishlist
  },
});

