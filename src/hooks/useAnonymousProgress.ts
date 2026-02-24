/**
 * useAnonymousProgress - localStorage-based progress tracking for anonymous users
 *
 * This hook manages all progress data for unauthenticated users using localStorage.
 * The schema mirrors Convex tables for easy migration when users sign up.
 */

const VISITOR_ID_KEY = "songscript_visitor_id";
const PROGRESS_KEY = "songscript_anonymous_progress";

// Types mirroring Convex schema for easy migration
export interface WordProgressItem {
  persian: string;
  wordId?: string;
  learned: boolean;
  viewCount: number;
  playCount: number;
  lastSeen: number;
}

export interface LineProgressItem {
  songId: string;
  lineNumber: number;
  learned: boolean;
}

export interface SongProgressItem {
  songId: string;
  lastPlayedAt: number;
  totalListenTime: number;
}

export interface PracticeLogItem {
  date: string; // YYYY-MM-DD
  practiceSeconds: number;
  wordsLearned: number;
  linesCompleted: number;
}

export interface WishlistItem {
  songId: string;
  addedAt: number;
}

export interface UserPreferences {
  playbackSpeed: number;
  languageFilter: string;
  playbackMode: string;
  videoMuted: boolean;
  videoCollapsed: boolean;
}

export interface AnonymousProgress {
  visitorId: string;
  wordProgress: WordProgressItem[];
  lineProgress: LineProgressItem[];
  songProgress: SongProgressItem[];
  practiceLog: PracticeLogItem[];
  wishlist: WishlistItem[];
  preferences: UserPreferences;
}

// Default state
const DEFAULT_PREFERENCES: UserPreferences = {
  playbackSpeed: 1.0,
  languageFilter: "all",
  playbackMode: "auto",
  videoMuted: false,
  videoCollapsed: false,
};

function createEmptyProgress(visitorId: string): AnonymousProgress {
  return {
    visitorId,
    wordProgress: [],
    lineProgress: [],
    songProgress: [],
    practiceLog: [],
    wishlist: [],
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

/**
 * Generate a UUID v4 for visitor identification
 */
function generateVisitorId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create the visitor ID
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") {
    return "ssr-visitor";
  }

  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch {
    // localStorage not available (e.g., private mode)
    return generateVisitorId();
  }
}

/**
 * Validate and parse localStorage data
 * Returns empty progress if data is corrupted
 */
function validateProgress(data: unknown, visitorId: string): AnonymousProgress {
  if (!data || typeof data !== "object") {
    return createEmptyProgress(visitorId);
  }

  const obj = data as Record<string, unknown>;

  // Validate basic structure
  if (typeof obj.visitorId !== "string") {
    return createEmptyProgress(visitorId);
  }

  // Validate arrays exist and are arrays
  const validateArray = (key: string): unknown[] => {
    if (!Array.isArray(obj[key])) return [];
    return obj[key] as unknown[];
  };

  // Validate word progress items
  const wordProgress = validateArray("wordProgress")
    .filter((item): item is WordProgressItem => {
      if (!item || typeof item !== "object") return false;
      const w = item as Record<string, unknown>;
      return (
        typeof w.persian === "string" &&
        typeof w.learned === "boolean" &&
        typeof w.viewCount === "number" &&
        typeof w.playCount === "number" &&
        typeof w.lastSeen === "number"
      );
    })
    .slice(0, 10000); // Limit array size

  // Validate line progress items
  const lineProgress = validateArray("lineProgress")
    .filter((item): item is LineProgressItem => {
      if (!item || typeof item !== "object") return false;
      const l = item as Record<string, unknown>;
      return (
        typeof l.songId === "string" &&
        typeof l.lineNumber === "number" &&
        typeof l.learned === "boolean"
      );
    })
    .slice(0, 10000);

  // Validate song progress items
  const songProgress = validateArray("songProgress")
    .filter((item): item is SongProgressItem => {
      if (!item || typeof item !== "object") return false;
      const s = item as Record<string, unknown>;
      return (
        typeof s.songId === "string" &&
        typeof s.lastPlayedAt === "number" &&
        typeof s.totalListenTime === "number"
      );
    })
    .slice(0, 1000);

  // Validate practice log items
  const practiceLog = validateArray("practiceLog")
    .filter((item): item is PracticeLogItem => {
      if (!item || typeof item !== "object") return false;
      const p = item as Record<string, unknown>;
      return (
        typeof p.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(p.date) &&
        typeof p.practiceSeconds === "number" &&
        typeof p.wordsLearned === "number" &&
        typeof p.linesCompleted === "number"
      );
    })
    .slice(0, 365); // Max one year of daily logs

  // Validate wishlist items
  const wishlist = validateArray("wishlist")
    .filter((item): item is WishlistItem => {
      if (!item || typeof item !== "object") return false;
      const w = item as Record<string, unknown>;
      return typeof w.songId === "string" && typeof w.addedAt === "number";
    })
    .slice(0, 100);

  // Validate preferences
  let preferences = DEFAULT_PREFERENCES;
  if (obj.preferences && typeof obj.preferences === "object") {
    const p = obj.preferences as Record<string, unknown>;
    preferences = {
      playbackSpeed:
        typeof p.playbackSpeed === "number" ? p.playbackSpeed : 1.0,
      languageFilter:
        typeof p.languageFilter === "string"
          ? p.languageFilter === "persian"
            ? "original"
            : p.languageFilter
          : "all",
      playbackMode:
        typeof p.playbackMode === "string" ? p.playbackMode : "auto",
      videoMuted: typeof p.videoMuted === "boolean" ? p.videoMuted : false,
      videoCollapsed:
        typeof p.videoCollapsed === "boolean" ? p.videoCollapsed : false,
    };
  }

  return {
    visitorId: obj.visitorId as string,
    wordProgress,
    lineProgress,
    songProgress,
    practiceLog,
    wishlist,
    preferences,
  };
}

/**
 * Read progress from localStorage
 */
export function readProgress(): AnonymousProgress {
  const visitorId = getVisitorId();

  if (typeof window === "undefined") {
    return createEmptyProgress(visitorId);
  }

  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (!stored) {
      return createEmptyProgress(visitorId);
    }

    const parsed = JSON.parse(stored);
    return validateProgress(parsed, visitorId);
  } catch {
    // JSON parse error or localStorage error - reset to empty state
    console.warn(
      "[useAnonymousProgress] Corrupted localStorage data, resetting to empty state",
    );
    const empty = createEmptyProgress(visitorId);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(empty));
    } catch {
      // Ignore write errors
    }
    return empty;
  }
}

/**
 * Write progress to localStorage
 */
export function writeProgress(progress: AnonymousProgress): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn("[useAnonymousProgress] Failed to write to localStorage:", e);
  }
}

/**
 * Clear all anonymous progress data
 */
export function clearProgress(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(VISITOR_ID_KEY);
  } catch {
    // Ignore errors
  }
}

// ============================================
// Word Progress Functions
// ============================================

/**
 * Get word progress for a specific word (by persian text)
 */
export function getWordProgress(persian: string): WordProgressItem | undefined {
  const progress = readProgress();
  return progress.wordProgress.find((w) => w.persian === persian);
}

/**
 * Check if a word is marked as learned
 */
export function isWordLearned(persian: string): boolean {
  const wordProgress = getWordProgress(persian);
  return wordProgress?.learned ?? false;
}

/**
 * Set a word as learned or not learned
 */
export function setWordLearned(
  persian: string,
  learned: boolean,
  wordId?: string,
): void {
  const progress = readProgress();
  const existing = progress.wordProgress.find((w) => w.persian === persian);

  if (existing) {
    existing.learned = learned;
    existing.lastSeen = Date.now();
    if (wordId) {
      existing.wordId = wordId;
    }
  } else {
    progress.wordProgress.push({
      persian,
      wordId,
      learned,
      viewCount: 0,
      playCount: 0,
      lastSeen: Date.now(),
    });
  }

  writeProgress(progress);
}

/**
 * Increment view count for a word
 */
export function incrementWordView(persian: string, wordId?: string): void {
  const progress = readProgress();
  const existing = progress.wordProgress.find((w) => w.persian === persian);

  if (existing) {
    existing.viewCount++;
    existing.lastSeen = Date.now();
    if (wordId) {
      existing.wordId = wordId;
    }
  } else {
    progress.wordProgress.push({
      persian,
      wordId,
      learned: false,
      viewCount: 1,
      playCount: 0,
      lastSeen: Date.now(),
    });
  }

  writeProgress(progress);
}

/**
 * Increment play count for a word
 */
export function incrementWordPlay(persian: string, wordId?: string): void {
  const progress = readProgress();
  const existing = progress.wordProgress.find((w) => w.persian === persian);

  if (existing) {
    existing.playCount++;
    existing.lastSeen = Date.now();
    if (wordId) {
      existing.wordId = wordId;
    }
  } else {
    progress.wordProgress.push({
      persian,
      wordId,
      learned: false,
      viewCount: 0,
      playCount: 1,
      lastSeen: Date.now(),
    });
  }

  writeProgress(progress);
}

/**
 * Get all learned words count
 */
export function getLearnedWordsCount(): number {
  const progress = readProgress();
  return progress.wordProgress.filter((w) => w.learned).length;
}

// ============================================
// Line Progress Functions
// ============================================

/**
 * Get line progress for a specific song and line
 */
export function getLineProgress(
  songId: string,
  lineNumber: number,
): LineProgressItem | undefined {
  const progress = readProgress();
  return progress.lineProgress.find(
    (l) => l.songId === songId && l.lineNumber === lineNumber,
  );
}

/**
 * Check if a line is marked as learned
 */
export function isLineLearned(songId: string, lineNumber: number): boolean {
  const lineProgress = getLineProgress(songId, lineNumber);
  return lineProgress?.learned ?? false;
}

/**
 * Set a line as learned or not learned
 */
export function setLineLearned(
  songId: string,
  lineNumber: number,
  learned: boolean,
): void {
  const progress = readProgress();
  const existing = progress.lineProgress.find(
    (l) => l.songId === songId && l.lineNumber === lineNumber,
  );

  if (existing) {
    existing.learned = learned;
  } else {
    progress.lineProgress.push({
      songId,
      lineNumber,
      learned,
    });
  }

  writeProgress(progress);
}

/**
 * Get all learned lines for a song
 */
export function getLearnedLinesForSong(songId: string): number[] {
  const progress = readProgress();
  return progress.lineProgress
    .filter((l) => l.songId === songId && l.learned)
    .map((l) => l.lineNumber);
}

/**
 * Get total learned lines count
 */
export function getLearnedLinesCount(): number {
  const progress = readProgress();
  return progress.lineProgress.filter((l) => l.learned).length;
}

// ============================================
// Song Progress Functions
// ============================================

/**
 * Get song progress for a specific song
 */
export function getSongProgress(songId: string): SongProgressItem | undefined {
  const progress = readProgress();
  return progress.songProgress.find((s) => s.songId === songId);
}

/**
 * Update song progress (called when playing a song)
 */
export function updateSongProgress(
  songId: string,
  listenTimeSeconds: number,
): void {
  const progress = readProgress();
  const existing = progress.songProgress.find((s) => s.songId === songId);

  if (existing) {
    existing.lastPlayedAt = Date.now();
    existing.totalListenTime += listenTimeSeconds;
  } else {
    progress.songProgress.push({
      songId,
      lastPlayedAt: Date.now(),
      totalListenTime: listenTimeSeconds,
    });
  }

  writeProgress(progress);
}

// ============================================
// Practice Log Functions
// ============================================

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Log practice activity for today
 */
export function logPractice(
  practiceSeconds: number,
  wordsLearned: number = 0,
  linesCompleted: number = 0,
): void {
  const progress = readProgress();
  const today = getTodayDate();
  const existing = progress.practiceLog.find((p) => p.date === today);

  if (existing) {
    existing.practiceSeconds += practiceSeconds;
    existing.wordsLearned += wordsLearned;
    existing.linesCompleted += linesCompleted;
  } else {
    progress.practiceLog.push({
      date: today,
      practiceSeconds,
      wordsLearned,
      linesCompleted,
    });
  }

  writeProgress(progress);
}

/**
 * Get practice log for a date range
 */
export function getPracticeLog(days: number = 30): PracticeLogItem[] {
  const progress = readProgress();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  return progress.practiceLog.filter((p) => p.date >= cutoffStr);
}

// ============================================
// Wishlist Functions
// ============================================

/**
 * Check if a song is in wishlist
 */
export function isInWishlist(songId: string): boolean {
  const progress = readProgress();
  return progress.wishlist.some((w) => w.songId === songId);
}

/**
 * Add a song to wishlist
 */
export function addToWishlist(songId: string): void {
  const progress = readProgress();
  if (!progress.wishlist.some((w) => w.songId === songId)) {
    progress.wishlist.push({
      songId,
      addedAt: Date.now(),
    });
    writeProgress(progress);
  }
}

/**
 * Remove a song from wishlist
 */
export function removeFromWishlist(songId: string): void {
  const progress = readProgress();
  progress.wishlist = progress.wishlist.filter((w) => w.songId !== songId);
  writeProgress(progress);
}

/**
 * Get all wishlist items
 */
export function getWishlist(): WishlistItem[] {
  const progress = readProgress();
  return progress.wishlist;
}

// ============================================
// Preferences Functions
// ============================================

/**
 * Get user preferences
 */
export function getPreferences(): UserPreferences {
  const progress = readProgress();
  return progress.preferences;
}

/**
 * Update user preferences
 */
export function updatePreferences(
  updates: Partial<UserPreferences>,
): UserPreferences {
  const progress = readProgress();
  progress.preferences = { ...progress.preferences, ...updates };
  writeProgress(progress);
  return progress.preferences;
}

// ============================================
// Migration Export
// ============================================

/**
 * Export all progress data for migration to authenticated account
 * Returns the full progress object for sending to Convex migration mutation
 */
export function exportForMigration(): AnonymousProgress {
  return readProgress();
}

/**
 * Check if there is any progress to migrate
 */
export function hasProgressToMigrate(): boolean {
  const progress = readProgress();
  return (
    progress.wordProgress.length > 0 ||
    progress.lineProgress.length > 0 ||
    progress.songProgress.length > 0 ||
    progress.practiceLog.length > 0 ||
    progress.wishlist.length > 0
  );
}

// ============================================
// React Hook (optional, for component use)
// ============================================

import { useState, useCallback, useSyncExternalStore } from "react";

// Subscribe to localStorage changes
const subscribeToStorage = (callback: () => void) => {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === PROGRESS_KEY || e.key === VISITOR_ID_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
};

const getSnapshot = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(PROGRESS_KEY);
};

const getServerSnapshot = () => null;

/**
 * React hook for anonymous progress
 * Re-renders when localStorage changes
 */
export function useAnonymousProgress() {
  // Subscribe to localStorage changes - useSyncExternalStore ensures re-render on storage events
  // The snapshot value triggers re-renders when localStorage changes
  useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);

  // Re-parse on snapshot change
  const progress = readProgress();

  // Force update helper for local changes
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  // Wrapped setters that trigger re-render
  const setWordLearnedLocal = useCallback(
    (persian: string, learned: boolean, wordId?: string) => {
      setWordLearned(persian, learned, wordId);
      triggerUpdate();
    },
    [triggerUpdate],
  );

  const setLineLearnedLocal = useCallback(
    (songId: string, lineNumber: number, learned: boolean) => {
      setLineLearned(songId, lineNumber, learned);
      triggerUpdate();
    },
    [triggerUpdate],
  );

  const updatePreferencesLocal = useCallback(
    (updates: Partial<UserPreferences>) => {
      const result = updatePreferences(updates);
      triggerUpdate();
      return result;
    },
    [triggerUpdate],
  );

  return {
    // Data
    progress,
    visitorId: progress.visitorId,

    // Word functions
    isWordLearned,
    setWordLearned: setWordLearnedLocal,
    getWordProgress,
    incrementWordView,
    incrementWordPlay,
    getLearnedWordsCount,

    // Line functions
    isLineLearned,
    setLineLearned: setLineLearnedLocal,
    getLineProgress,
    getLearnedLinesForSong,
    getLearnedLinesCount,

    // Song functions
    getSongProgress,
    updateSongProgress,

    // Practice functions
    logPractice,
    getPracticeLog,

    // Wishlist functions
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    getWishlist,

    // Preferences
    getPreferences,
    updatePreferences: updatePreferencesLocal,

    // Migration
    exportForMigration,
    hasProgressToMigrate,
    clearProgress,
  };
}
