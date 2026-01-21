/**
 * Language difficulty multipliers based on FSI (Foreign Service Institute) rankings
 * for English speakers learning other languages.
 */

export const DIFFICULTY_MULTIPLIERS = {
  // Standard difficulty (1.0x) - Category I languages
  spanish: 1.0,
  es: 1.0,
  french: 1.0,
  fr: 1.0,
  italian: 1.0,
  it: 1.0,
  dutch: 1.0,
  nl: 1.0,

  // Hard difficulty (1.5x) - Category III/IV languages
  hebrew: 1.5,
  he: 1.5,
  persian: 1.5,
  fa: 1.5,
  russian: 1.5,
  ru: 1.5,
  hindi: 1.5,
  hi: 1.5,

  // Super-hard difficulty (2.0x) - Category V languages
  arabic: 2.0,
  ar: 2.0,
  japanese: 2.0,
  ja: 2.0,
  korean: 2.0,
  ko: 2.0,
  chinese: 2.0,
  mandarin: 2.0,
  zh: 2.0,
} as const;

/**
 * Get the difficulty multiplier for a given language.
 * @param language - Language code or name (case-insensitive)
 * @returns Difficulty multiplier (1.0, 1.5, or 2.0)
 */
export function getLanguageMultiplier(language: string): number {
  const normalizedLanguage = language.toLowerCase().trim();
  return DIFFICULTY_MULTIPLIERS[normalizedLanguage as keyof typeof DIFFICULTY_MULTIPLIERS] ?? 1.0;
}
