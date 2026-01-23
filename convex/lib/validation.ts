/**
 * Validation helpers for migrating anonymous progress data
 *
 * These functions validate and sanitize user-submitted data from localStorage
 * before inserting into Convex tables. The validation is strict to prevent
 * injection attacks and corrupted data.
 */

// ============================================
// Constants
// ============================================

// String length limits
const MAX_STRING_LENGTH = 500; // For persian text, songId, etc.
const MAX_GOAL_TYPE_LENGTH = 20;
const MAX_PERIOD_LENGTH = 10;
const MAX_LANGUAGE_FILTER_LENGTH = 50;
const MAX_PLAYBACK_MODE_LENGTH = 20;

// Array size limits
const MAX_WORDS = 10000;
const MAX_LINES = 10000;
const MAX_SONGS = 1000;
const MAX_PRACTICE_LOG = 365;
const MAX_WISHLIST = 100;
const MAX_GOALS = 20;

// Numeric bounds
const MAX_COUNT = 1_000_000; // viewCount, playCount, etc.
const MAX_TIMESTAMP = 253402300800000; // Year 9999
const MAX_PRACTICE_SECONDS = 86400 * 365; // 1 year in seconds
const MAX_LISTEN_TIME = 86400 * 365; // 1 year in seconds
const MIN_PLAYBACK_SPEED = 0.25;
const MAX_PLAYBACK_SPEED = 4.0;
const MAX_LINE_NUMBER = 1_000_000;
const MAX_TARGET_VALUE = 1_000_000;

// Convex ID pattern (32 chars, alphanumeric)
const CONVEX_ID_PATTERN = /^[a-z0-9]{32}$/i;

// ============================================
// Type Definitions (matching useAnonymousProgress)
// ============================================

export interface WordProgressInput {
  persian: string;
  wordId?: string;
  learned: boolean;
  viewCount: number;
  playCount: number;
  lastSeen: number;
}

export interface LineProgressInput {
  songId: string;
  lineNumber: number;
  learned: boolean;
}

export interface SongProgressInput {
  songId: string;
  lastPlayedAt: number;
  totalListenTime: number;
}

export interface PracticeLogInput {
  date: string;
  practiceSeconds: number;
  wordsLearned: number;
  linesCompleted: number;
}

export interface WishlistInput {
  songId: string;
  addedAt: number;
}

export interface GoalInput {
  goalType: string;
  period: string;
  targetValue: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PreferencesInput {
  playbackSpeed: number;
  languageFilter: string;
  playbackMode: string;
  videoMuted: boolean;
  videoCollapsed: boolean;
}

export interface AnonymousProgressInput {
  visitorId: string;
  wordProgress: WordProgressInput[];
  lineProgress: LineProgressInput[];
  songProgress: SongProgressInput[];
  practiceLog: PracticeLogInput[];
  wishlist: WishlistInput[];
  goals?: GoalInput[];
  preferences: PreferencesInput;
}

// ============================================
// Validation Results
// ============================================

export interface ValidationResult<T> {
  valid: T[];
  invalidCount: number;
  errors: string[];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Truncate string to max length
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength);
}

/**
 * Validate a string field
 */
function isValidString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

/**
 * Validate a number is a positive integer within bounds
 */
function isValidPositiveInt(value: unknown, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= max
  );
}

/**
 * Validate a number is within float bounds
 */
function isValidFloat(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
  );
}

/**
 * Validate a timestamp (milliseconds since epoch)
 */
function isValidTimestamp(value: unknown): value is number {
  return isValidPositiveInt(value, MAX_TIMESTAMP);
}

/**
 * Validate boolean
 */
function isValidBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
function isValidDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(value))
  );
}

/**
 * Check if string matches Convex ID pattern
 * Note: We don't validate if the ID actually exists - that's done at insert time
 */
function isValidConvexIdFormat(value: unknown): value is string {
  return typeof value === "string" && CONVEX_ID_PATTERN.test(value);
}

// ============================================
// Word Progress Validation
// ============================================

export function validateWordProgress(
  items: unknown[]
): ValidationResult<WordProgressInput> {
  const valid: WordProgressInput[] = [];
  const errors: string[] = [];
  let invalidCount = 0;

  // Take only up to MAX_WORDS
  const itemsToProcess = items.slice(0, MAX_WORDS);

  for (const item of itemsToProcess) {
    if (!item || typeof item !== "object") {
      invalidCount++;
      continue;
    }

    const obj = item as Record<string, unknown>;

    // Required fields
    if (!isValidString(obj.persian, MAX_STRING_LENGTH)) {
      invalidCount++;
      errors.push(`Invalid persian text: ${typeof obj.persian}`);
      continue;
    }

    if (!isValidBoolean(obj.learned)) {
      invalidCount++;
      errors.push(`Invalid learned flag for "${truncateString(String(obj.persian), 20)}"`);
      continue;
    }

    if (!isValidPositiveInt(obj.viewCount, MAX_COUNT)) {
      invalidCount++;
      errors.push(`Invalid viewCount for "${truncateString(String(obj.persian), 20)}"`);
      continue;
    }

    if (!isValidPositiveInt(obj.playCount, MAX_COUNT)) {
      invalidCount++;
      errors.push(`Invalid playCount for "${truncateString(String(obj.persian), 20)}"`);
      continue;
    }

    if (!isValidTimestamp(obj.lastSeen)) {
      invalidCount++;
      errors.push(`Invalid lastSeen for "${truncateString(String(obj.persian), 20)}"`);
      continue;
    }

    // Optional wordId - only include if valid format
    const wordId =
      obj.wordId && isValidConvexIdFormat(obj.wordId) ? obj.wordId : undefined;

    valid.push({
      persian: truncateString(obj.persian, MAX_STRING_LENGTH),
      wordId,
      learned: obj.learned,
      viewCount: Math.min(obj.viewCount, MAX_COUNT),
      playCount: Math.min(obj.playCount, MAX_COUNT),
      lastSeen: Math.min(obj.lastSeen, MAX_TIMESTAMP),
    });
  }

  if (items.length > MAX_WORDS) {
    errors.push(`Truncated wordProgress: ${items.length} items to ${MAX_WORDS}`);
    invalidCount += items.length - MAX_WORDS;
  }

  return { valid, invalidCount, errors };
}

// ============================================
// Line Progress Validation
// ============================================

export function validateLineProgress(
  items: unknown[]
): ValidationResult<LineProgressInput> {
  const valid: LineProgressInput[] = [];
  const errors: string[] = [];
  let invalidCount = 0;

  const itemsToProcess = items.slice(0, MAX_LINES);

  for (const item of itemsToProcess) {
    if (!item || typeof item !== "object") {
      invalidCount++;
      continue;
    }

    const obj = item as Record<string, unknown>;

    // songId is required and must look like a Convex ID
    if (!isValidConvexIdFormat(obj.songId)) {
      invalidCount++;
      errors.push(`Invalid songId format in lineProgress`);
      continue;
    }

    if (!isValidPositiveInt(obj.lineNumber, MAX_LINE_NUMBER)) {
      invalidCount++;
      errors.push(`Invalid lineNumber: ${obj.lineNumber}`);
      continue;
    }

    if (!isValidBoolean(obj.learned)) {
      invalidCount++;
      errors.push(`Invalid learned flag in lineProgress`);
      continue;
    }

    valid.push({
      songId: obj.songId,
      lineNumber: obj.lineNumber,
      learned: obj.learned,
    });
  }

  if (items.length > MAX_LINES) {
    errors.push(`Truncated lineProgress: ${items.length} items to ${MAX_LINES}`);
    invalidCount += items.length - MAX_LINES;
  }

  return { valid, invalidCount, errors };
}

// ============================================
// Song Progress Validation
// ============================================

export function validateSongProgress(
  items: unknown[]
): ValidationResult<SongProgressInput> {
  const valid: SongProgressInput[] = [];
  const errors: string[] = [];
  let invalidCount = 0;

  const itemsToProcess = items.slice(0, MAX_SONGS);

  for (const item of itemsToProcess) {
    if (!item || typeof item !== "object") {
      invalidCount++;
      continue;
    }

    const obj = item as Record<string, unknown>;

    if (!isValidConvexIdFormat(obj.songId)) {
      invalidCount++;
      errors.push(`Invalid songId format in songProgress`);
      continue;
    }

    if (!isValidTimestamp(obj.lastPlayedAt)) {
      invalidCount++;
      errors.push(`Invalid lastPlayedAt in songProgress`);
      continue;
    }

    if (!isValidPositiveInt(obj.totalListenTime, MAX_LISTEN_TIME)) {
      invalidCount++;
      errors.push(`Invalid totalListenTime in songProgress`);
      continue;
    }

    valid.push({
      songId: obj.songId,
      lastPlayedAt: Math.min(obj.lastPlayedAt, MAX_TIMESTAMP),
      totalListenTime: Math.min(obj.totalListenTime, MAX_LISTEN_TIME),
    });
  }

  if (items.length > MAX_SONGS) {
    errors.push(`Truncated songProgress: ${items.length} items to ${MAX_SONGS}`);
    invalidCount += items.length - MAX_SONGS;
  }

  return { valid, invalidCount, errors };
}

// ============================================
// Practice Log Validation
// ============================================

export function validatePracticeLog(
  items: unknown[]
): ValidationResult<PracticeLogInput> {
  const valid: PracticeLogInput[] = [];
  const errors: string[] = [];
  let invalidCount = 0;

  const itemsToProcess = items.slice(0, MAX_PRACTICE_LOG);

  for (const item of itemsToProcess) {
    if (!item || typeof item !== "object") {
      invalidCount++;
      continue;
    }

    const obj = item as Record<string, unknown>;

    if (!isValidDateString(obj.date)) {
      invalidCount++;
      errors.push(`Invalid date format in practiceLog: ${obj.date}`);
      continue;
    }

    if (!isValidPositiveInt(obj.practiceSeconds, MAX_PRACTICE_SECONDS)) {
      invalidCount++;
      errors.push(`Invalid practiceSeconds for date ${obj.date}`);
      continue;
    }

    if (!isValidPositiveInt(obj.wordsLearned, MAX_COUNT)) {
      invalidCount++;
      errors.push(`Invalid wordsLearned for date ${obj.date}`);
      continue;
    }

    if (!isValidPositiveInt(obj.linesCompleted, MAX_COUNT)) {
      invalidCount++;
      errors.push(`Invalid linesCompleted for date ${obj.date}`);
      continue;
    }

    valid.push({
      date: obj.date,
      practiceSeconds: Math.min(obj.practiceSeconds, MAX_PRACTICE_SECONDS),
      wordsLearned: Math.min(obj.wordsLearned, MAX_COUNT),
      linesCompleted: Math.min(obj.linesCompleted, MAX_COUNT),
    });
  }

  if (items.length > MAX_PRACTICE_LOG) {
    errors.push(`Truncated practiceLog: ${items.length} items to ${MAX_PRACTICE_LOG}`);
    invalidCount += items.length - MAX_PRACTICE_LOG;
  }

  return { valid, invalidCount, errors };
}

// ============================================
// Wishlist Validation
// ============================================

export function validateWishlist(items: unknown[]): ValidationResult<WishlistInput> {
  const valid: WishlistInput[] = [];
  const errors: string[] = [];
  let invalidCount = 0;

  const itemsToProcess = items.slice(0, MAX_WISHLIST);

  for (const item of itemsToProcess) {
    if (!item || typeof item !== "object") {
      invalidCount++;
      continue;
    }

    const obj = item as Record<string, unknown>;

    if (!isValidConvexIdFormat(obj.songId)) {
      invalidCount++;
      errors.push(`Invalid songId format in wishlist`);
      continue;
    }

    if (!isValidTimestamp(obj.addedAt)) {
      invalidCount++;
      errors.push(`Invalid addedAt in wishlist`);
      continue;
    }

    valid.push({
      songId: obj.songId,
      addedAt: Math.min(obj.addedAt, MAX_TIMESTAMP),
    });
  }

  if (items.length > MAX_WISHLIST) {
    errors.push(`Truncated wishlist: ${items.length} items to ${MAX_WISHLIST}`);
    invalidCount += items.length - MAX_WISHLIST;
  }

  return { valid, invalidCount, errors };
}

// ============================================
// Goals Validation
// ============================================

export function validateGoals(items: unknown[]): ValidationResult<GoalInput> {
  const valid: GoalInput[] = [];
  const errors: string[] = [];
  let invalidCount = 0;

  const itemsToProcess = items.slice(0, MAX_GOALS);

  for (const item of itemsToProcess) {
    if (!item || typeof item !== "object") {
      invalidCount++;
      continue;
    }

    const obj = item as Record<string, unknown>;

    if (!isValidString(obj.goalType, MAX_GOAL_TYPE_LENGTH)) {
      invalidCount++;
      errors.push(`Invalid goalType in goals`);
      continue;
    }

    if (!isValidString(obj.period, MAX_PERIOD_LENGTH)) {
      invalidCount++;
      errors.push(`Invalid period in goals`);
      continue;
    }

    if (!isValidPositiveInt(obj.targetValue, MAX_TARGET_VALUE)) {
      invalidCount++;
      errors.push(`Invalid targetValue in goals`);
      continue;
    }

    if (!isValidBoolean(obj.isActive)) {
      invalidCount++;
      errors.push(`Invalid isActive in goals`);
      continue;
    }

    if (!isValidTimestamp(obj.createdAt)) {
      invalidCount++;
      errors.push(`Invalid createdAt in goals`);
      continue;
    }

    if (!isValidTimestamp(obj.updatedAt)) {
      invalidCount++;
      errors.push(`Invalid updatedAt in goals`);
      continue;
    }

    valid.push({
      goalType: truncateString(obj.goalType, MAX_GOAL_TYPE_LENGTH),
      period: truncateString(obj.period, MAX_PERIOD_LENGTH),
      targetValue: Math.min(obj.targetValue, MAX_TARGET_VALUE),
      isActive: obj.isActive,
      createdAt: Math.min(obj.createdAt, MAX_TIMESTAMP),
      updatedAt: Math.min(obj.updatedAt, MAX_TIMESTAMP),
    });
  }

  if (items.length > MAX_GOALS) {
    errors.push(`Truncated goals: ${items.length} items to ${MAX_GOALS}`);
    invalidCount += items.length - MAX_GOALS;
  }

  return { valid, invalidCount, errors };
}

// ============================================
// Preferences Validation
// ============================================

export function validatePreferences(input: unknown): PreferencesInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const obj = input as Record<string, unknown>;

  // Provide defaults for invalid values
  const playbackSpeed = isValidFloat(obj.playbackSpeed, MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED)
    ? obj.playbackSpeed
    : 1.0;

  const languageFilter = isValidString(obj.languageFilter, MAX_LANGUAGE_FILTER_LENGTH)
    ? truncateString(obj.languageFilter, MAX_LANGUAGE_FILTER_LENGTH)
    : "all";

  const playbackMode = isValidString(obj.playbackMode, MAX_PLAYBACK_MODE_LENGTH)
    ? truncateString(obj.playbackMode, MAX_PLAYBACK_MODE_LENGTH)
    : "auto";

  const videoMuted = isValidBoolean(obj.videoMuted) ? obj.videoMuted : false;
  const videoCollapsed = isValidBoolean(obj.videoCollapsed) ? obj.videoCollapsed : false;

  return {
    playbackSpeed,
    languageFilter,
    playbackMode,
    videoMuted,
    videoCollapsed,
  };
}

// ============================================
// Full Progress Validation
// ============================================

export interface ValidatedProgress {
  wordProgress: WordProgressInput[];
  lineProgress: LineProgressInput[];
  songProgress: SongProgressInput[];
  practiceLog: PracticeLogInput[];
  wishlist: WishlistInput[];
  goals: GoalInput[];
  preferences: PreferencesInput | null;
  totalInvalidCount: number;
  errors: string[];
}

export function validateAnonymousProgress(input: unknown): ValidatedProgress {
  const errors: string[] = [];
  let totalInvalidCount = 0;

  // Default empty result
  const emptyResult: ValidatedProgress = {
    wordProgress: [],
    lineProgress: [],
    songProgress: [],
    practiceLog: [],
    wishlist: [],
    goals: [],
    preferences: null,
    totalInvalidCount: 0,
    errors: [],
  };

  if (!input || typeof input !== "object") {
    errors.push("Input is not an object");
    return { ...emptyResult, errors, totalInvalidCount: 1 };
  }

  const obj = input as Record<string, unknown>;

  // Validate arrays exist
  const wordProgressRaw = Array.isArray(obj.wordProgress) ? obj.wordProgress : [];
  const lineProgressRaw = Array.isArray(obj.lineProgress) ? obj.lineProgress : [];
  const songProgressRaw = Array.isArray(obj.songProgress) ? obj.songProgress : [];
  const practiceLogRaw = Array.isArray(obj.practiceLog) ? obj.practiceLog : [];
  const wishlistRaw = Array.isArray(obj.wishlist) ? obj.wishlist : [];
  const goalsRaw = Array.isArray(obj.goals) ? obj.goals : [];

  // Validate each section
  const wordResult = validateWordProgress(wordProgressRaw);
  const lineResult = validateLineProgress(lineProgressRaw);
  const songResult = validateSongProgress(songProgressRaw);
  const practiceResult = validatePracticeLog(practiceLogRaw);
  const wishlistResult = validateWishlist(wishlistRaw);
  const goalsResult = validateGoals(goalsRaw);
  const preferences = validatePreferences(obj.preferences);

  // Aggregate errors
  errors.push(...wordResult.errors);
  errors.push(...lineResult.errors);
  errors.push(...songResult.errors);
  errors.push(...practiceResult.errors);
  errors.push(...wishlistResult.errors);
  errors.push(...goalsResult.errors);

  totalInvalidCount =
    wordResult.invalidCount +
    lineResult.invalidCount +
    songResult.invalidCount +
    practiceResult.invalidCount +
    wishlistResult.invalidCount +
    goalsResult.invalidCount;

  return {
    wordProgress: wordResult.valid,
    lineProgress: lineResult.valid,
    songProgress: songResult.valid,
    practiceLog: practiceResult.valid,
    wishlist: wishlistResult.valid,
    goals: goalsResult.valid,
    preferences,
    totalInvalidCount,
    errors,
  };
}
