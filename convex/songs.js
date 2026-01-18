import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("songs").collect();
    },
});
export const getById = query({
    args: { id: v.id("songs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
export const create = mutation({
    args: {
        title: v.string(),
        artist: v.string(),
        youtubeId: v.string(),
        sourceLanguage: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("songs", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
