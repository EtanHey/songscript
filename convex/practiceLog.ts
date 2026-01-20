import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

// Log a practice session with weighted scoring
export const logPractice = mutation({
  args: {
    visitorId: v.string(),
    eventType: v.union(
      v.literal("word_learned"),
      v.literal("line_loop"),
      v.literal("audio_time"),
      v.literal("silent_time")
    ),
    value: v.number(), // seconds for time events, count for discrete events
  },
  handler: async (ctx, { visitorId, eventType, value }) => {
    const today = getTodayDateString();

    // Calculate points based on event type and weighted formula
    let points = 0;
    let durationSeconds = 0;

    switch (eventType) {
      case "word_learned":
        points = value * 10; // 10 points per word
        break;
      case "line_loop":
        points = value * 3; // 3 points per loop completion
        break;
      case "audio_time":
        points = Math.floor(value / 60) * 2; // 2 points per minute
        durationSeconds = value;
        break;
      case "silent_time":
        // Cap silent time at 15 minutes (900 seconds)
        const cappedTime = Math.min(value, 900);
        points = Math.floor(cappedTime / 60) * 1; // 1 point per minute, capped
        durationSeconds = value;
        break;
    }

    // Check if there's already a log for today
    const existingLog = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_visitor_date", (q) =>
        q.eq("visitorId", visitorId).eq("date", today)
      )
      .first();

    if (existingLog) {
      // Update existing log
      await ctx.db.patch(existingLog._id, {
        practiceCount: existingLog.practiceCount + 1,
        totalSeconds: existingLog.totalSeconds + durationSeconds,
        totalPoints: (existingLog.totalPoints || 0) + points,
      });
      return existingLog._id;
    } else {
      // Create new log for today
      return await ctx.db.insert("userPracticeLog", {
        visitorId,
        date: today,
        practiceCount: 1,
        totalSeconds: durationSeconds,
        totalPoints: points,
      });
    }
  },
});

// Get practice history for last N days (default 90)
export const getPracticeHistory = query({
  args: {
    visitorId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { visitorId, days = 90 }) => {
    // Get all practice logs for this visitor
    const logs = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    // Filter to last N days and create a map
    const cutoffDate = getDateDaysAgo(days);
    const practiceMap = new Map<
      string,
      { date: string; practiceCount: number; totalSeconds: number; totalPoints: number }
    >();

    for (const log of logs) {
      if (log.date >= cutoffDate) {
        practiceMap.set(log.date, {
          date: log.date,
          practiceCount: log.practiceCount,
          totalSeconds: log.totalSeconds,
          totalPoints: log.totalPoints || 0,
        });
      }
    }

    // Calculate streaks
    const today = getTodayDateString();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check dates in order to calculate longest streak
    const sortedDates = Array.from(practiceMap.keys()).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      const prevDate = i > 0 ? sortedDates[i - 1] : null;

      // Check if this date continues the streak
      if (prevDate) {
        const prevDateObj = new Date(prevDate);
        const currDateObj = new Date(currentDate);
        const diffDays = Math.round(
          (currDateObj.getTime() - prevDateObj.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Calculate current streak (must include today or yesterday)
    const hasPracticedToday = practiceMap.has(today);
    const yesterday = getDateDaysAgo(1);
    const hasPracticedYesterday = practiceMap.has(yesterday);

    // If not practiced today or yesterday, streak is 0
    if (!hasPracticedToday && !hasPracticedYesterday) {
      currentStreak = 0;
    } else {
      // Count backwards from the most recent day practiced
      const startDate = hasPracticedToday ? today : yesterday;
      let date = startDate;
      while (practiceMap.has(date)) {
        currentStreak++;
        const dateObj = new Date(date);
        dateObj.setDate(dateObj.getDate() - 1);
        date = dateObj.toISOString().split("T")[0];
      }
    }

    // Convert map to array for the response
    const practiceData = Array.from(practiceMap.values());

    // Calculate total practice time, sessions, and points
    const totalSessions = practiceData.reduce(
      (sum, d) => sum + d.practiceCount,
      0
    );
    const totalTime = practiceData.reduce((sum, d) => sum + d.totalSeconds, 0);
    const totalPoints = practiceData.reduce((sum, d) => sum + d.totalPoints, 0);

    return {
      practiceData,
      currentStreak,
      longestStreak,
      totalSessions,
      totalTimeSeconds: totalTime,
      totalPoints,
      daysTracked: days,
    };
  },
});
