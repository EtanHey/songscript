/**
 * Unit tests for useAnonymousProgress hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getVisitorId,
  readProgress,
  writeProgress,
  clearProgress,
  getWordProgress,
  isWordLearned,
  setWordLearned,
  incrementWordView,
  incrementWordPlay,
  getLearnedWordsCount,
  getLineProgress,
  isLineLearned,
  setLineLearned,
  getLearnedLinesForSong,
  getLearnedLinesCount,
  getSongProgress,
  updateSongProgress,
  logPractice,
  getPracticeLog,
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getPreferences,
  updatePreferences,
  exportForMigration,
  hasProgressToMigrate,
  type AnonymousProgress,
} from "./useAnonymousProgress";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get _store() {
      return store;
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useAnonymousProgress", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe("getVisitorId", () => {
    it("generates a new visitor ID if none exists", () => {
      const visitorId = getVisitorId();
      expect(visitorId).toBeDefined();
      expect(typeof visitorId).toBe("string");
      expect(visitorId.length).toBeGreaterThan(0);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "songscript_visitor_id",
        visitorId
      );
    });

    it("returns existing visitor ID if one exists", () => {
      const existingId = "existing-visitor-id";
      localStorageMock._store["songscript_visitor_id"] = existingId;

      const visitorId = getVisitorId();
      expect(visitorId).toBe(existingId);
    });

    it("generates UUID format", () => {
      const visitorId = getVisitorId();
      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(visitorId).toMatch(uuidRegex);
    });
  });

  describe("readProgress / writeProgress", () => {
    it("returns empty progress when localStorage is empty", () => {
      const progress = readProgress();
      expect(progress.wordProgress).toEqual([]);
      expect(progress.lineProgress).toEqual([]);
      expect(progress.songProgress).toEqual([]);
      expect(progress.practiceLog).toEqual([]);
      expect(progress.wishlist).toEqual([]);
      expect(progress.preferences).toEqual({
        playbackSpeed: 1.0,
        languageFilter: "all",
        playbackMode: "auto",
        videoMuted: false,
        videoCollapsed: false,
      });
    });

    it("persists and retrieves word progress correctly", () => {
      const progress = readProgress();
      progress.wordProgress.push({
        persian: "برای",
        learned: true,
        viewCount: 5,
        playCount: 3,
        lastSeen: Date.now(),
      });
      writeProgress(progress);

      const retrieved = readProgress();
      expect(retrieved.wordProgress).toHaveLength(1);
      expect(retrieved.wordProgress[0].persian).toBe("برای");
      expect(retrieved.wordProgress[0].learned).toBe(true);
    });

    it("persists and retrieves line progress correctly", () => {
      const progress = readProgress();
      progress.lineProgress.push({
        songId: "song123",
        lineNumber: 5,
        learned: true,
      });
      writeProgress(progress);

      const retrieved = readProgress();
      expect(retrieved.lineProgress).toHaveLength(1);
      expect(retrieved.lineProgress[0].songId).toBe("song123");
      expect(retrieved.lineProgress[0].lineNumber).toBe(5);
      expect(retrieved.lineProgress[0].learned).toBe(true);
    });

    it("handles corrupted JSON gracefully", () => {
      localStorageMock._store["songscript_anonymous_progress"] =
        "not valid json {";

      const progress = readProgress();
      // Should return empty state without throwing
      expect(progress.wordProgress).toEqual([]);
      expect(progress.lineProgress).toEqual([]);
    });

    it("handles missing fields gracefully", () => {
      localStorageMock._store["songscript_anonymous_progress"] = JSON.stringify(
        {
          visitorId: "test-id",
          // Missing all other fields
        }
      );

      const progress = readProgress();
      expect(progress.visitorId).toBe("test-id");
      expect(progress.wordProgress).toEqual([]);
      expect(progress.lineProgress).toEqual([]);
    });

    it("validates corrupted word progress items", () => {
      localStorageMock._store["songscript_anonymous_progress"] = JSON.stringify(
        {
          visitorId: "test-id",
          wordProgress: [
            { persian: "valid", learned: true, viewCount: 1, playCount: 0, lastSeen: 123 },
            { invalid: "item" }, // Should be filtered out
            "not an object", // Should be filtered out
            null, // Should be filtered out
          ],
        }
      );

      const progress = readProgress();
      expect(progress.wordProgress).toHaveLength(1);
      expect(progress.wordProgress[0].persian).toBe("valid");
    });

    it("limits array sizes to prevent abuse", () => {
      const hugeProgress: AnonymousProgress = {
        visitorId: "test-id",
        wordProgress: Array(15000)
          .fill(null)
          .map((_, i) => ({
            persian: `word${i}`,
            learned: false,
            viewCount: 0,
            playCount: 0,
            lastSeen: Date.now(),
          })),
        lineProgress: [],
        songProgress: [],
        practiceLog: [],
        wishlist: [],
        preferences: {
          playbackSpeed: 1.0,
          languageFilter: "all",
          playbackMode: "auto",
          videoMuted: false,
          videoCollapsed: false,
        },
      };
      localStorageMock._store["songscript_anonymous_progress"] =
        JSON.stringify(hugeProgress);

      const progress = readProgress();
      expect(progress.wordProgress.length).toBeLessThanOrEqual(10000);
    });
  });

  describe("clearProgress", () => {
    it("removes all progress data", () => {
      const progress = readProgress();
      progress.wordProgress.push({
        persian: "test",
        learned: true,
        viewCount: 1,
        playCount: 0,
        lastSeen: Date.now(),
      });
      writeProgress(progress);

      clearProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "songscript_anonymous_progress"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "songscript_visitor_id"
      );
    });
  });

  describe("Word Progress Functions", () => {
    it("getWordProgress returns undefined for unknown word", () => {
      expect(getWordProgress("unknown")).toBeUndefined();
    });

    it("isWordLearned returns false for unknown word", () => {
      expect(isWordLearned("unknown")).toBe(false);
    });

    it("setWordLearned creates new entry for unknown word", () => {
      setWordLearned("برای", true);

      const progress = readProgress();
      expect(progress.wordProgress).toHaveLength(1);
      expect(progress.wordProgress[0].persian).toBe("برای");
      expect(progress.wordProgress[0].learned).toBe(true);
    });

    it("setWordLearned updates existing entry", () => {
      setWordLearned("برای", true);
      setWordLearned("برای", false);

      const progress = readProgress();
      expect(progress.wordProgress).toHaveLength(1);
      expect(progress.wordProgress[0].learned).toBe(false);
    });

    it("incrementWordView increments view count", () => {
      incrementWordView("برای");
      incrementWordView("برای");
      incrementWordView("برای");

      const wordProgress = getWordProgress("برای");
      expect(wordProgress?.viewCount).toBe(3);
    });

    it("incrementWordPlay increments play count", () => {
      incrementWordPlay("برای");
      incrementWordPlay("برای");

      const wordProgress = getWordProgress("برای");
      expect(wordProgress?.playCount).toBe(2);
    });

    it("getLearnedWordsCount returns correct count", () => {
      setWordLearned("word1", true);
      setWordLearned("word2", true);
      setWordLearned("word3", false);

      expect(getLearnedWordsCount()).toBe(2);
    });
  });

  describe("Line Progress Functions", () => {
    it("getLineProgress returns undefined for unknown line", () => {
      expect(getLineProgress("song123", 1)).toBeUndefined();
    });

    it("isLineLearned returns false for unknown line", () => {
      expect(isLineLearned("song123", 1)).toBe(false);
    });

    it("setLineLearned creates new entry for unknown line", () => {
      setLineLearned("song123", 5, true);

      const progress = readProgress();
      expect(progress.lineProgress).toHaveLength(1);
      expect(progress.lineProgress[0].songId).toBe("song123");
      expect(progress.lineProgress[0].lineNumber).toBe(5);
      expect(progress.lineProgress[0].learned).toBe(true);
    });

    it("setLineLearned updates existing entry", () => {
      setLineLearned("song123", 5, true);
      setLineLearned("song123", 5, false);

      const progress = readProgress();
      expect(progress.lineProgress).toHaveLength(1);
      expect(progress.lineProgress[0].learned).toBe(false);
    });

    it("getLearnedLinesForSong returns correct lines", () => {
      setLineLearned("song123", 1, true);
      setLineLearned("song123", 3, true);
      setLineLearned("song123", 5, false);
      setLineLearned("song456", 1, true);

      const learnedLines = getLearnedLinesForSong("song123");
      expect(learnedLines).toEqual([1, 3]);
    });

    it("getLearnedLinesCount returns correct count", () => {
      setLineLearned("song123", 1, true);
      setLineLearned("song123", 3, true);
      setLineLearned("song456", 1, true);

      expect(getLearnedLinesCount()).toBe(3);
    });
  });

  describe("Song Progress Functions", () => {
    it("getSongProgress returns undefined for unknown song", () => {
      expect(getSongProgress("unknown")).toBeUndefined();
    });

    it("updateSongProgress creates new entry", () => {
      updateSongProgress("song123", 60);

      const songProgress = getSongProgress("song123");
      expect(songProgress?.totalListenTime).toBe(60);
    });

    it("updateSongProgress accumulates listen time", () => {
      updateSongProgress("song123", 60);
      updateSongProgress("song123", 30);

      const songProgress = getSongProgress("song123");
      expect(songProgress?.totalListenTime).toBe(90);
    });
  });

  describe("Practice Log Functions", () => {
    it("logPractice creates entry for today", () => {
      logPractice(120, 5, 2);

      const log = getPracticeLog(7);
      expect(log).toHaveLength(1);
      expect(log[0].practiceSeconds).toBe(120);
      expect(log[0].wordsLearned).toBe(5);
      expect(log[0].linesCompleted).toBe(2);
    });

    it("logPractice accumulates for same day", () => {
      logPractice(60, 2, 1);
      logPractice(60, 3, 1);

      const log = getPracticeLog(7);
      expect(log).toHaveLength(1);
      expect(log[0].practiceSeconds).toBe(120);
      expect(log[0].wordsLearned).toBe(5);
      expect(log[0].linesCompleted).toBe(2);
    });
  });

  describe("Wishlist Functions", () => {
    it("isInWishlist returns false for unknown song", () => {
      expect(isInWishlist("unknown")).toBe(false);
    });

    it("addToWishlist adds song", () => {
      addToWishlist("song123");

      expect(isInWishlist("song123")).toBe(true);
    });

    it("addToWishlist does not duplicate", () => {
      addToWishlist("song123");
      addToWishlist("song123");

      const wishlist = getWishlist();
      expect(wishlist).toHaveLength(1);
    });

    it("removeFromWishlist removes song", () => {
      addToWishlist("song123");
      removeFromWishlist("song123");

      expect(isInWishlist("song123")).toBe(false);
    });
  });

  describe("Preferences Functions", () => {
    it("getPreferences returns defaults", () => {
      const prefs = getPreferences();
      expect(prefs.playbackSpeed).toBe(1.0);
      expect(prefs.languageFilter).toBe("all");
      expect(prefs.playbackMode).toBe("auto");
      expect(prefs.videoMuted).toBe(false);
      expect(prefs.videoCollapsed).toBe(false);
    });

    it("updatePreferences updates specific fields", () => {
      updatePreferences({ playbackSpeed: 1.5, videoMuted: true });

      const prefs = getPreferences();
      expect(prefs.playbackSpeed).toBe(1.5);
      expect(prefs.videoMuted).toBe(true);
      expect(prefs.languageFilter).toBe("all"); // Unchanged
    });
  });

  describe("Migration Functions", () => {
    it("exportForMigration returns full progress", () => {
      setWordLearned("test", true);
      setLineLearned("song123", 1, true);

      const exported = exportForMigration();
      expect(exported.wordProgress).toHaveLength(1);
      expect(exported.lineProgress).toHaveLength(1);
    });

    it("hasProgressToMigrate returns false when empty", () => {
      expect(hasProgressToMigrate()).toBe(false);
    });

    it("hasProgressToMigrate returns true when has word progress", () => {
      setWordLearned("test", true);
      expect(hasProgressToMigrate()).toBe(true);
    });

    it("hasProgressToMigrate returns true when has line progress", () => {
      setLineLearned("song123", 1, true);
      expect(hasProgressToMigrate()).toBe(true);
    });

    it("hasProgressToMigrate returns true when has wishlist", () => {
      addToWishlist("song123");
      expect(hasProgressToMigrate()).toBe(true);
    });
  });
});
