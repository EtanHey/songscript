// Word type for vocabulary
export type VocabWord = {
  persian: string;
  transliteration: string;
  english: string;
  hebrew: string;
  practiceCount: number;
  lastSeen: number;
  learned: boolean;
  masteryLevel: "new" | "learning" | "mastered";
  sourceLanguage: string;
};

// Color set type for WordChip styling
export type WordChipColorSet = {
  chipBg: string;
  chipText: string;
};

export interface WordChipProps {
  word: VocabWord;
  colorSet: WordChipColorSet;
  onClick: () => void;
}

// Word Chip Component - clickable to open word details modal
export function WordChip({ word, colorSet, onClick }: WordChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full ${colorSet.chipBg} ${colorSet.chipText} text-sm font-medium hover:opacity-80 hover:scale-105 active:scale-95 transition-all min-h-[36px] flex items-center`}
      title={`${word.transliteration} - ${word.english}`}
    >
      {word.persian}
    </button>
  );
}

export default WordChip;
