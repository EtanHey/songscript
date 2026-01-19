import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";

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

// Get language-specific progress for the "My Languages" dashboard section
// Returns detailed stats for each language the user has practiced
export const getLanguageProgress = query({
  args: { visitorId: v.string() },
  handler: async (ctx, { visitorId }) => {
    if (!visitorId) {
      return [];
    }

    // Get all song progress for this visitor
    const songProgress = await ctx.db
      .query("userSongProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    // Get word progress for word counts
    const wordProgress = await ctx.db
      .query("wordProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", visitorId))
      .collect();

    // Build a map of song ID to song data (and lyrics count)
    const songCache: Map<string, { song: Doc<"songs">; totalLines: number }> =
      new Map();

    // Group progress data by language
    const languageData: Map<
      string,
      {
        language: string;
        wordsLearned: Set<string>; // unique persian words
        songsPracticed: Map<string, { song: Doc<"songs">; linesCompleted: number; totalLines: number }>;
        lastPracticed: number;
      }
    > = new Map();

    // Process song progress
    for (const sp of songProgress) {
      // Get song from cache or fetch it
      let songData = songCache.get(sp.songId);
      if (!songData) {
        const song = await ctx.db.get(sp.songId);
        if (!song) continue;

        // Get total line count
        const lyrics = await ctx.db
          .query("lyrics")
          .withIndex("by_song", (q) => q.eq("songId", sp.songId))
          .collect();

        songData = { song, totalLines: lyrics.length };
        songCache.set(sp.songId, songData);
      }

      const lang = songData.song.sourceLanguage || "unknown";

      // Initialize language data if needed
      if (!languageData.has(lang)) {
        languageData.set(lang, {
          language: lang,
          wordsLearned: new Set(),
          songsPracticed: new Map(),
          lastPracticed: 0,
        });
      }

      const langStats = languageData.get(lang)!;

      // Track song progress
      langStats.songsPracticed.set(sp.songId, {
        song: songData.song,
        linesCompleted: sp.linesCompleted.length,
        totalLines: songData.totalLines,
      });

      // Update last practiced timestamp
      if (sp.lastPracticed > langStats.lastPracticed) {
        langStats.lastPracticed = sp.lastPracticed;
      }
    }

    // Process word progress to count words per language
    for (const wp of wordProgress) {
      if (!wp.persian) continue;

      // Get the word to find its song
      const word = await ctx.db.get(wp.wordId);
      if (!word) continue;

      // Get song from cache or fetch
      let songData = songCache.get(word.songId);
      if (!songData) {
        const song = await ctx.db.get(word.songId);
        if (!song) continue;

        const lyrics = await ctx.db
          .query("lyrics")
          .withIndex("by_song", (q) => q.eq("songId", word.songId))
          .collect();

        songData = { song, totalLines: lyrics.length };
        songCache.set(word.songId, songData);
      }

      const lang = songData.song.sourceLanguage || "unknown";

      // Initialize language data if needed
      if (!languageData.has(lang)) {
        languageData.set(lang, {
          language: lang,
          wordsLearned: new Set(),
          songsPracticed: new Map(),
          lastPracticed: 0,
        });
      }

      // Add unique word
      languageData.get(lang)!.wordsLearned.add(wp.persian);
    }

    // Get total words available per language (for progress calculation)
    // We'll estimate based on all words in songs the user has practiced
    const languageTotalWords: Map<string, Set<string>> = new Map();
    for (const songData of songCache.values()) {
      const lang = songData.song.sourceLanguage || "unknown";
      if (!languageTotalWords.has(lang)) {
        languageTotalWords.set(lang, new Set());
      }

      // Get all words for this song
      const words = await ctx.db
        .query("words")
        .withIndex("by_song_line", (q) => q.eq("songId", songData.song._id))
        .collect();

      for (const w of words) {
        languageTotalWords.get(lang)!.add(w.persian);
      }
    }

    // Build the result array
    const result = Array.from(languageData.entries()).map(
      ([lang, data]) => {
        const totalWordsInLanguage = languageTotalWords.get(lang)?.size || 0;
        const wordsLearnedCount = data.wordsLearned.size;

        // Calculate total lines practiced vs total lines available
        let totalLinesPracticed = 0;
        let totalLinesAvailable = 0;
        for (const sp of data.songsPracticed.values()) {
          totalLinesPracticed += sp.linesCompleted;
          totalLinesAvailable += sp.totalLines;
        }

        return {
          language: lang,
          wordsLearned: wordsLearnedCount,
          totalWordsAvailable: totalWordsInLanguage,
          wordProgress:
            totalWordsInLanguage > 0
              ? Math.round((wordsLearnedCount / totalWordsInLanguage) * 100)
              : 0,
          songsPracticed: data.songsPracticed.size,
          linesPracticed: totalLinesPracticed,
          totalLinesAvailable,
          linesProgress:
            totalLinesAvailable > 0
              ? Math.round((totalLinesPracticed / totalLinesAvailable) * 100)
              : 0,
          lastPracticed: data.lastPracticed,
        };
      }
    );

    // Sort by most practiced (songs count, then words count)
    return result.sort((a, b) => {
      // Primary sort: by songs practiced
      if (b.songsPracticed !== a.songsPracticed) {
        return b.songsPracticed - a.songsPracticed;
      }
      // Secondary sort: by words learned
      return b.wordsLearned - a.wordsLearned;
    });
  },
});
