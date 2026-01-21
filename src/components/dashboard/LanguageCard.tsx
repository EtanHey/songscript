import { LanguageFlag } from "../LanguageFlag";
import { getLanguageDisplayName, type LanguageProgressData } from "./LanguageChip";

// Helper to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export interface LanguageCardProps {
  language: LanguageProgressData;
  isSelected: boolean;
  onSelect: () => void;
}

// Desktop: Language card (full details)
export function LanguageCard({
  language,
  isSelected,
  onSelect,
}: LanguageCardProps) {
  const displayName = getLanguageDisplayName(language.language);

  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
        isSelected
          ? "bg-emerald-900/30 border-emerald-500 shadow-lg shadow-emerald-500/10"
          : "bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg"
      }`}
    >
      {/* Header with flag, name, and selection indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <LanguageFlag language={language.language} size="1.875em" />
          <div>
            <h3 className="font-bold text-white">{displayName}</h3>
            <p className="text-xs text-gray-400">
              Last practiced {formatRelativeTime(language.lastPracticed)}
            </p>
          </div>
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-lg font-bold text-white">{language.wordsLearned}</div>
          <div className="text-xs text-gray-400">words learned</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-lg font-bold text-white">{language.songsPracticed}</div>
          <div className="text-xs text-gray-400">songs practiced</div>
        </div>
      </div>

      {/* Progress bar with gradient */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Word progress</span>
          <span className="text-white font-medium">{language.wordProgress}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isSelected
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-blue-500 to-purple-500"
            }`}
            style={{ width: `${language.wordProgress}%` }}
          />
        </div>
      </div>

      {/* Tap to filter hint */}
      <div className="text-center text-xs text-gray-500 mt-3">
        {isSelected ? "Tap to clear filter" : "Tap to filter dashboard"}
      </div>
    </button>
  );
}
