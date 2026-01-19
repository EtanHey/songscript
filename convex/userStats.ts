import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Get aggregated stats for a visitor across all tables
// Includes: unique words, lines practiced, practice time, language breakdown, most practiced song
export const getAggregatedStats = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    if (!visitorId) {
      return null;
    }

    // Get word progress for unique words count
    const wordProgress = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    // Deduplicate by persian text (count unique words, not word instances)
    const uniqueWordTexts = new Set<string>();
    for (const wp of wordProgress) {
      if (wp.persian) {
        uniqueWordTexts.add(wp.persian);
      }
    }
    const totalUniqueWords = uniqueWordTexts.size;

    // Get song progress for lines practiced
    const songProgress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    // Calculate total lines practiced and track by song
    let totalLinesPracticed = 0;
    const songPracticeCounts: Map<string, { songId: string; count: number }> = new Map();

    for (const sp of songProgress) {
      const linesCount = sp.linesCompleted.length;
      totalLinesPracticed += linesCount;
      songPracticeCounts.set(sp.songId, {
        songId: sp.songId,
        count: linesCount,
      });
    }

    // Get practice logs for total time
    const practiceLog = await ctx.db
      .query("userPracticeLog")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    const totalPracticeTimeSeconds = practiceLog.reduce(
      (sum, log) => sum + log.totalSeconds,
      0
    );

    // Calculate language breakdown for words
    const languageWordCounts: Map<string, number> = new Map();

    // For each word progress, get the word and its song to determine language
    for (const wp of wordProgress) {
      if (!wp.persian) continue;

      // Get the word to find its song
      const word = await ctx.db.get(wp.wordId);
      if (!word) continue;

      // Get the song to find the language
      const song = await ctx.db.get(word.songId);
      if (!song) continue;

      const lang = song.sourceLanguage || "unknown";
      // Only count unique words per language
      const key = `${lang}:${wp.persian}`;
      if (!languageWordCounts.has(key)) {
        languageWordCounts.set(
          lang,
          (languageWordCounts.get(lang) || 0) + 1
        );
      }
    }

    // Actually calculate properly - group by language, track unique persian per language
    const wordsByLanguage: Map<string, Set<string>> = new Map();
    for (const wp of wordProgress) {
      if (!wp.persian) continue;
      const word = await ctx.db.get(wp.wordId);
      if (!word) continue;
      const song = await ctx.db.get(word.songId);
      if (!song) continue;
      const lang = song.sourceLanguage || "unknown";
      if (!wordsByLanguage.has(lang)) {
        wordsByLanguage.set(lang, new Set());
      }
      wordsByLanguage.get(lang)!.add(wp.persian);
    }

    const languageBreakdown = Array.from(wordsByLanguage.entries())
      .map(([language, words]) => ({
        language,
        wordCount: words.size,
      }))
      .sort((a, b) => b.wordCount - a.wordCount);

    // Find most practiced song
    let mostPracticedSong: {
      _id: string;
      title: string;
      artist: string;
      sourceLanguage: string;
      practiceCount: number;
    } | null = null;

    if (songPracticeCounts.size > 0) {
      // Find the song with most lines practiced
      let maxCount = 0;
      let maxSongId: Id<"songs"> | null = null;

      for (const [songId, data] of songPracticeCounts) {
        if (data.count > maxCount) {
          maxCount = data.count;
          maxSongId = songId as Id<"songs">;
        }
      }

      if (maxSongId) {
        const song = await ctx.db.get(maxSongId);
        if (song) {
          mostPracticedSong = {
            _id: song._id,
            title: song.title,
            artist: song.artist,
            sourceLanguage: song.sourceLanguage,
            practiceCount: maxCount,
          };
        }
      }
    }

    return {
      totalUniqueWords,
      totalLinesPracticed,
      totalPracticeTimeSeconds,
      languageBreakdown,
      mostPracticedSong,
      songsInProgress: songProgress.length,
    };
  },
});
