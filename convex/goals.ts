import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Goal types available
export const GOAL_TYPES = ["words", "time", "lines"] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

// Goal periods
export const GOAL_PERIODS = ["daily", "weekly"] as const;
export type GoalPeriod = (typeof GOAL_PERIODS)[number];

// Default goal values
export const DEFAULT_GOALS = {
  words: { daily: 10, weekly: 50 },
  time: { daily: 15, weekly: 60 }, // in minutes
  lines: { daily: 20, weekly: 100 },
} as const;

// Get all goals for a visitor
export const getByVisitor = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    return await ctx.db
      .query("userGoals")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();
  },
});

// Get goals with progress calculated
export const getGoalsWithProgress = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    // Get user's goals
    const goals = await ctx.db
      .query("userGoals")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Calculate date ranges
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // Get Monday of current week
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const mondayStr = monday.toISOString().split("T")[0];

    // Get practice log for today
    const todayLog = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_visitor_date", (q) =>
        q.eq("visitorId", visitorId).eq("date", todayStr)
      )
      .first();

    // Get practice logs for this week
    const weekLogs = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .filter((q) => q.gte(q.field("date"), mondayStr))
      .collect();

    // Calculate weekly totals
    const weeklySeconds = weekLogs.reduce(
      (sum, log) => sum + log.totalSeconds,
      0
    );

    // Get word progress for today (unique words LEARNED today)
    // Only count words that are marked as learned (consistent with userStats)
    const todayStart = new Date(todayStr).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const allWordProgress = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    // Words learned today (based on lastSeen AND learned=true)
    // Only count words that are CURRENTLY learned and were interacted with today
    const wordsToday = allWordProgress.filter(
      (wp) => wp.learned && wp.lastSeen >= todayStart && wp.lastSeen < todayEnd
    );
    const uniqueWordsToday = new Set(wordsToday.map((wp) => wp.persian)).size;

    // Words learned this week
    const weekStart = new Date(mondayStr).getTime();
    const wordsThisWeek = allWordProgress.filter(
      (wp) => wp.learned && wp.lastSeen >= weekStart
    );
    const uniqueWordsThisWeek = new Set(wordsThisWeek.map((wp) => wp.persian))
      .size;

    // Get lines practiced today
    const songProgress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .filter((q) => q.gte(q.field("lastPracticed"), todayStart))
      .collect();

    const linesToday = songProgress.reduce(
      (sum, sp) => sum + sp.linesCompleted.length,
      0
    );

    // Get lines practiced this week
    const weekSongProgress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .filter((q) => q.gte(q.field("lastPracticed"), weekStart))
      .collect();

    const linesThisWeek = weekSongProgress.reduce(
      (sum, sp) => sum + sp.linesCompleted.length,
      0
    );

    // Calculate progress for each goal
    return goals.map((goal) => {
      let currentValue = 0;

      if (goal.period === "daily") {
        switch (goal.goalType) {
          case "words":
            currentValue = uniqueWordsToday;
            break;
          case "time":
            currentValue = Math.floor((todayLog?.totalSeconds || 0) / 60); // Convert to minutes
            break;
          case "lines":
            currentValue = linesToday;
            break;
        }
      } else {
        // weekly
        switch (goal.goalType) {
          case "words":
            currentValue = uniqueWordsThisWeek;
            break;
          case "time":
            currentValue = Math.floor(weeklySeconds / 60); // Convert to minutes
            break;
          case "lines":
            currentValue = linesThisWeek;
            break;
        }
      }

      const progress = Math.min(
        100,
        Math.round((currentValue / goal.targetValue) * 100)
      );
      const isCompleted = currentValue >= goal.targetValue;

      return {
        ...goal,
        currentValue,
        progress,
        isCompleted,
      };
    });
  },
});

// Set or update a goal
export const setGoal = mutation({
  args: {
    visitorId: v.string(),
    goalType: v.string(),
    period: v.string(),
    targetValue: v.number(),
  },
  handler: async (ctx, { visitorId, goalType, period, targetValue }) => {
    // Check if goal already exists
    const existing = await ctx.db
      .query("userGoals")
      .withIndex("by_visitor_type_period", (q) =>
        q.eq("visitorId", visitorId).eq("goalType", goalType).eq("period", period)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing goal
      await ctx.db.patch(existing._id, {
        targetValue,
        updatedAt: now,
        isActive: true,
      });
      return existing._id;
    } else {
      // Create new goal
      return await ctx.db.insert("userGoals", {
        visitorId,
        goalType,
        period,
        targetValue,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update a goal's target value
export const updateGoal = mutation({
  args: {
    goalId: v.id("userGoals"),
    targetValue: v.number(),
  },
  handler: async (ctx, { goalId, targetValue }) => {
    await ctx.db.patch(goalId, {
      targetValue,
      updatedAt: Date.now(),
    });
  },
});

// Delete (deactivate) a goal
export const deleteGoal = mutation({
  args: {
    goalId: v.id("userGoals"),
  },
  handler: async (ctx, { goalId }) => {
    await ctx.db.patch(goalId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Initialize default goals for a new user
export const initializeDefaultGoals = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    // Check if user already has goals
    const existing = await ctx.db
      .query("userGoals")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .first();

    if (existing) {
      return; // Already has goals
    }

    const now = Date.now();

    // Create default daily goals
    await ctx.db.insert("userGoals", {
      visitorId,
      goalType: "words",
      period: "daily",
      targetValue: DEFAULT_GOALS.words.daily,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("userGoals", {
      visitorId,
      goalType: "time",
      period: "daily",
      targetValue: DEFAULT_GOALS.time.daily,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
