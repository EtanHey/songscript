import { useState } from "react";
import { LanguageFlag } from "../LanguageFlag";
import { MasteryLevelSection } from "./MasteryLevelSection";
import type { VocabWord } from "./WordChip";

export interface LanguageVocabularySectionProps {
  language: string;
  totalWords: number;
  newCount: number;
  learningCount: number;
  masteredCount: number;
  words: {
    new: VocabWord[];
    learning: VocabWord[];
    mastered: VocabWord[];
  };
  onWordClick: (persian: string) => void;
}

// Language Vocabulary Section - Collapsible accordion
export function LanguageVocabularySection({
  language,
  totalWords,
  newCount,
  learningCount,
  masteredCount,
  words,
  onWordClick,
}: LanguageVocabularySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Header - always visible, clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors min-h-[56px]"
      >
        <div className="flex items-center gap-3">
          <LanguageFlag language={language} size="1.5em" />
          <div>
            <h3 className="font-semibold text-white capitalize">{language}</h3>
            <p className="text-sm text-gray-400">{totalWords} words</p>
          </div>
        </div>

        {/* Mastery summary badges */}
        <div className="flex items-center gap-2">
          {masteredCount > 0 && (
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              {masteredCount}
            </span>
          )}
          {learningCount > 0 && (
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
              {learningCount}
            </span>
          )}
          {newCount > 0 && (
            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
              {newCount}
            </span>
          )}
          {/* Expand/collapse icon */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
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
        </div>
      </button>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-4 pt-0 space-y-4">
          {/* Mastered words */}
          {words.mastered.length > 0 && (
            <MasteryLevelSection
              level="mastered"
              label="Mastered"
              count={masteredCount}
              words={words.mastered}
              onWordClick={onWordClick}
            />
          )}

          {/* Learning words */}
          {words.learning.length > 0 && (
            <MasteryLevelSection
              level="learning"
              label="Learning"
              count={learningCount}
              words={words.learning}
              onWordClick={onWordClick}
            />
          )}

          {/* New words */}
          {words.new.length > 0 && (
            <MasteryLevelSection
              level="new"
              label="New"
              count={newCount}
              words={words.new}
              onWordClick={onWordClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default LanguageVocabularySection;
