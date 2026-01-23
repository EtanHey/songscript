// Centralized flag component for language display
// Uses local Persian lion flag SVG, emoji flags for other languages

interface LanguageFlagProps {
  language: string;
  size?: string;
  className?: string;
}

// Helper to check if language is Persian
function isPersian(lang: string): boolean {
  const l = lang.toLowerCase();
  return l === "fa" || l === "persian" || l === "farsi";
}

// Get emoji flag for non-Persian languages
function getLanguageFlagEmoji(language: string): string {
  switch (language.toLowerCase()) {
    case "ko":
    case "korean":
      return "🇰🇷";
    case "ar":
    case "arabic":
      return "🇸🇦";
    case "he":
    case "hebrew":
      return "🇮🇱";
    case "ja":
    case "japanese":
      return "🇯🇵";
    case "zh":
    case "chinese":
      return "🇨🇳";
    default:
      return "🌍";
  }
}

/**
 * LanguageFlag component - displays the appropriate flag for a language
 *
 * For Persian: Uses the local iran-lion.svg (historical Sun & Lion flag)
 * For other languages: Uses standard emoji flags
 *
 * @param language - Language code or name (e.g., "fa", "persian", "ko", "korean")
 * @param size - CSS size value for the flag (default: "1.25em")
 * @param className - Additional CSS classes to apply
 */
export function LanguageFlag({ language, size = "1.25em", className = "" }: LanguageFlagProps) {
  if (isPersian(language)) {
    return (
      <img
        src="/flags/iran-lion.svg"
        alt="Persian"
        className={`inline-block ${className}`}
        style={{ width: size, height: size, verticalAlign: "middle" }}
      />
    );
  }

  return (
    <span className={className} style={{ fontSize: size }}>
      {getLanguageFlagEmoji(language)}
    </span>
  );
}

/**
 * Get language flag as a string (for contexts where a component can't be used)
 * Returns 🦁 for Persian (since we can't use SVG), emoji for others
 */
export function getLanguageFlagString(language: string): string {
  if (isPersian(language)) {
    return "🦁";
  }
  return getLanguageFlagEmoji(language);
}

export default LanguageFlag;
