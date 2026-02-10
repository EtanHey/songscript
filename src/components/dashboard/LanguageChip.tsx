import { LanguageFlag } from "../LanguageFlag";

// Language progress type for My Languages section
export type LanguageProgressData = {
  language: string;
  wordsLearned: number;
  totalWordsAvailable: number;
  wordProgress: number;
  songsPracticed: number;
  linesPracticed: number;
  totalLinesAvailable: number;
  linesProgress: number;
  lastPracticed: number;
};

// Get language display name (capitalize and expand abbreviations)
export function getLanguageDisplayName(lang: string): string {
  const names: Record<string, string> = {
    fa: "Persian",
    persian: "Persian",
    farsi: "Farsi",
    ko: "Korean",
    korean: "Korean",
    ar: "Arabic",
    arabic: "Arabic",
    es: "Spanish",
    spanish: "Spanish",
    he: "Hebrew",
    hebrew: "Hebrew",
    ja: "Japanese",
    japanese: "Japanese",
    zh: "Chinese",
    chinese: "Chinese",
  };
  return names[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

export interface LanguageChipProps {
  language: LanguageProgressData;
  isSelected: boolean;
  onSelect: () => void;
}

// Mobile: Language chip (compact, horizontal scroll item)
export function LanguageChip({
  language,
  isSelected,
  onSelect,
}: LanguageChipProps) {
  const displayName = getLanguageDisplayName(language.language);

  return (
    <button
      onClick={onSelect}
      className={`flex-shrink-0 snap-start flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 min-w-[200px] active:scale-[0.98] ${
        isSelected
          ? "bg-emerald-900/30 border-emerald-500 shadow-lg shadow-emerald-500/10"
          : "bg-gray-900 border-gray-800 hover:border-gray-700"
      }`}
    >
      {/* Flag and name */}
      <LanguageFlag language={language.language} size="1.5em" />
      <div className="flex-1 text-left">
        <div className="font-semibold text-white text-sm">{displayName}</div>
        <div className="text-xs text-gray-400">
          {language.wordsLearned} words · {language.songsPracticed} song{language.songsPracticed !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Progress ring */}
      <div className="w-10 h-10 relative">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
          <circle
            className="text-gray-800"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="20"
            cy="20"
          />
          <circle
            className={isSelected ? "text-emerald-500" : "text-blue-500"}
            strokeWidth="4"
            strokeDasharray={100.53}
            strokeDashoffset={100.53 - (language.wordProgress / 100) * 100.53}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="20"
            cy="20"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{language.wordProgress}%</span>
        </div>
      </div>
    </button>
  );
}
