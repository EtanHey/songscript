import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Transcription job status tracking.
 * Jobs are processed by external Python pipeline (WhisperX).
 */

// Job status constants
export const JOB_STATUS = {
  PENDING: "pending",
  DOWNLOADING: "downloading",
  SEPARATING: "separating",
  TRANSCRIBING: "transcribing",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

/**
 * Create a new transcription job.
 */
export const createJob = mutation({
  args: {
    youtubeUrl: v.string(),
    language: v.string(),
    visitorId: v.string(),
  },
  handler: async (ctx, { youtubeUrl, language, visitorId }) => {
    // Extract video ID from URL
    let videoId = "";
    if (youtubeUrl.includes("v=")) {
      videoId = youtubeUrl.split("v=")[1].split("&")[0];
    } else if (youtubeUrl.includes("youtu.be/")) {
      videoId = youtubeUrl.split("youtu.be/")[1].split("?")[0];
    }

    // Check if job already exists for this video
    const existing = await ctx.db
      .query("transcriptionJobs")
      .filter((q) => q.eq(q.field("videoId"), videoId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new job
    const jobId = await ctx.db.insert("transcriptionJobs", {
      youtubeUrl,
      videoId,
      language,
      visitorId,
      status: JOB_STATUS.PENDING,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return jobId;
  },
});

/**
 * Update job status (called by Python pipeline via HTTP action).
 */
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("transcriptionJobs"),
    status: v.string(),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
    result: v.optional(v.any()),
  },
  handler: async (ctx, { jobId, status, progress, error, result }) => {
    const updates: Record<string, unknown> = {
      status,
      updatedAt: Date.now(),
    };

    if (progress !== undefined) {
      updates.progress = progress;
    }

    if (error) {
      updates.error = error;
    }

    if (result) {
      updates.result = result;
    }

    await ctx.db.patch(jobId, updates);
  },
});

/**
 * Get job status for real-time updates.
 */
export const getJobStatus = query({
  args: {
    jobId: v.id("transcriptionJobs"),
  },
  handler: async (ctx, { jobId }) => {
    return await ctx.db.get(jobId);
  },
});

/**
 * Get all jobs for a visitor.
 */
export const getJobsByVisitor = query({
  args: {
    visitorId: v.string(),
  },
  handler: async (ctx, { visitorId }) => {
    return await ctx.db
      .query("transcriptionJobs")
      .filter((q) => q.eq(q.field("visitorId"), visitorId))
      .order("desc")
      .collect();
  },
});

/**
 * Import transcription result as a new song.
 * Called after pipeline completes successfully.
 */
export const importTranscription = mutation({
  args: {
    jobId: v.id("transcriptionJobs"),
  },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job || job.status !== JOB_STATUS.COMPLETED || !job.result) {
      throw new Error("Job not ready for import");
    }

    const result = job.result as {
      videoInfo: {
        title: string;
        artist: string;
        duration: number;
      };
      lines: Array<{
        lineNumber: number;
        startTime: number;
        endTime: number;
        original: string;
        transliteration?: string;
        english?: string;
        words?: Array<{
          word: string;
          start: number;
          end: number;
          transliteration?: string;
        }>;
      }>;
    };

    // Create song
    const songId = await ctx.db.insert("songs", {
      title: result.videoInfo.title,
      artist: result.videoInfo.artist || "Unknown Artist",
      youtubeId: job.videoId,
      sourceLanguage: job.language,
      createdAt: Date.now(),
    });

    // Create lyrics
    for (const line of result.lines) {
      await ctx.db.insert("lyrics", {
        songId,
        lineNumber: line.lineNumber,
        startTime: line.startTime,
        endTime: line.endTime,
        original: line.original,
        transliteration: line.transliteration || "",
        english: line.english || "",
      });

      // Create words if available
      if (line.words) {
        for (let i = 0; i < line.words.length; i++) {
          const word = line.words[i];
          await ctx.db.insert("words", {
            songId,
            lineNumber: line.lineNumber,
            wordIndex: i,
            persian: word.word,
            transliteration: word.transliteration || "",
            hebrew: "", // Not provided by pipeline
            english: "", // Would need per-word translation
          });
        }
      }
    }

    // Update job with song reference
    await ctx.db.patch(jobId, {
      songId,
      updatedAt: Date.now(),
    });

    return songId;
  },
});

/**
 * HTTP endpoint for Python pipeline to update job status.
 * Used when running pipeline externally (RunPod, local, etc.)
 */
// Note: HTTP endpoints are defined in http.ts
// This would be called via: POST /api/transcription/update
