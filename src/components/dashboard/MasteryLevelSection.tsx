import { useState } from "react";
import { WordChip, type VocabWord } from "./WordChip";

// Full color set type for mastery level styling
export type MasteryLevelColorSet = {
  bg: string;
  text: string;
  badge: string;
  chipBg: string;
  chipText: string;
};

export interface MasteryLevelSectionProps {
  level: "new" | "learning" | "mastered";
  label: string;
  count: number;
  words: VocabWord[];
  onWordClick: (persian: string) => void;
}

// Mastery Level Section - expandable list of words
export function MasteryLevelSection({
  level,
  label,
  count,
  words,
  onWordClick,
}: MasteryLevelSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Colors based on mastery level
  const colors: Record<"new" | "learning" | "mastered", MasteryLevelColorSet> = {
    new: {
      bg: "bg-gray-700/50",
      text: "text-gray-300",
      badge: "bg-gray-500/20 text-gray-400",
      chipBg: "bg-gray-700",
      chipText: "text-gray-200",
    },
    learning: {
      bg: "bg-amber-900/20",
      text: "text-amber-300",
      badge: "bg-amber-500/20 text-amber-400",
      chipBg: "bg-amber-900/40",
      chipText: "text-amber-200",
    },
    mastered: {
      bg: "bg-emerald-900/20",
      text: "text-emerald-300",
      badge: "bg-emerald-500/20 text-emerald-400",
      chipBg: "bg-emerald-900/40",
      chipText: "text-emerald-200",
    },
  };

  const colorSet = colors[level];

  return (
    <div className={`rounded-lg ${colorSet.bg} overflow-hidden`}>
      {/* Level header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-black/10 transition-colors min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <span className={`font-medium ${colorSet.text}`}>{label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${colorSet.badge}`}>
            {count} words
          </span>
        </div>
        <svg
          className={`w-4 h-4 ${colorSet.text} transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Word chips */}
      <div
        className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          {words.map((word) => (
            <WordChip
              key={word.persian}
              word={word}
              colorSet={colorSet}
              onClick={() => onWordClick(word.persian)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MasteryLevelSection;
