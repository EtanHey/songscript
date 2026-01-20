import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Info, Check, Star } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface LyricLine {
  _id: Id<"lyrics">;
  songId: Id<"songs">;
  lineNumber: number;
  startTime: number;
  endTime: number;
  original: string;
  transliteration: string;
  hebrew?: string;
  english: string;
}

export type LanguageFilter = "all" | "persian" | "transliteration" | "hebrew" | "english";

interface LyricsDisplayProps {
  songId: Id<"songs">;
  visitorId: string;
  onLineClick?: (startTime: number, lineIndex: number) => void;
  onLineInfoClick?: (line: LyricLine, lineIndex: number) => void;
  onLineCheckboxClick?: (lineNumber: number) => void;
  activeLineIndex?: number;
  clickedLineIndex?: number;
  languageFilter?: LanguageFilter;
  lineProgress?: Array<{
    _id: string;
    visitorId: string;
    songId: Id<"songs">;
    lineNumber: number;
    learned: boolean;
  }>;
}

export default function LyricsDisplay({
  songId,
  visitorId,
  onLineClick,
  onLineInfoClick,
  onLineCheckboxClick,
  activeLineIndex,
  clickedLineIndex,
  languageFilter = "all",
  lineProgress = [],
}: LyricsDisplayProps) {
  const { data: lyrics } = useSuspenseQuery(
    convexQuery(api.lyrics.getBySong, { songId })
  );

  // Get word progress to determine "words known" state
  const { data: wordProgress } = useSuspenseQuery(
    convexQuery(api.wordProgress.getByVisitor, { visitorId })
  );

  // Sort lyrics by lineNumber to ensure correct order
  const sortedLyrics = [...(lyrics || [])].sort(
    (a, b) => a.lineNumber - b.lineNumber
  ) as LyricLine[];

  // Create lookup maps for efficient state checking
  const lineLearnedMap = new Map(
    lineProgress.map(lp => [lp.lineNumber, lp.learned])
  );
  
  const learnedWordsSet = new Set(
    (wordProgress || [])
      .filter(wp => wp.learned)
      .map(wp => wp.persian)
      .filter(Boolean)
  );

  // Determine visual state for each line
  const getLineState = (line: LyricLine): 'default' | 'wordsKnown' | 'learned' => {
    // Check if line is explicitly marked as learned
    if (lineLearnedMap.get(line.lineNumber)) {
      return 'learned';
    }
    
    // Check if any words in this line are known from other songs
    const words = line.original.split(/\s+/);
    const hasKnownWords = words.some(word => learnedWordsSet.has(word.trim()));
    
    if (hasKnownWords) {
      return 'wordsKnown';
    }
    
    return 'default';
  };

  // Refs for each line to enable auto-scroll
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-scroll active line into view
  useEffect(() => {
    if (activeLineIndex !== undefined && lineRefs.current[activeLineIndex]) {
      lineRefs.current[activeLineIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLineIndex]);

  return (
    <div className="flex flex-col gap-2">
      {sortedLyrics.map((line, index) => {
        const lineState = getLineState(line);
        const isLearned = lineState === 'learned';
        
        return (
        <div
          key={line._id}
          ref={(el) => {
            lineRefs.current[index] = el as HTMLButtonElement | null;
          }}
          className={`flex min-h-11 items-start gap-2 rounded-lg p-3 transition-all duration-150 ${
            activeLineIndex === index
              ? "bg-primary/10 ring-1 ring-primary/20"
              : ""
          } ${
            clickedLineIndex === index
              ? "scale-[0.98] bg-primary/20"
              : ""
          } ${
            // Visual state styling
            lineState === 'learned'
              ? "border-l-4 border-l-emerald-500"
              : lineState === 'wordsKnown'
              ? "border-l-2 border-l-blue-300"
              : ""
          }`}
        >
          {/* Checkbox - left side, sticky position */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLineCheckboxClick?.(line.lineNumber);
            }}
            className={`flex-shrink-0 w-11 h-11 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
              isLearned
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
            }`}
            title={isLearned ? "Mark as not learned" : "Mark as learned"}
          >
            {isLearned && (
              <Check className="h-5 w-5" />
            )}
          </button>

          {/* Main content - clickable to play audio */}
          <button
            type="button"
            onClick={() => onLineClick?.(line.startTime, index)}
            className="flex flex-1 flex-col gap-1 text-left hover:opacity-80 transition-opacity"
          >
            {/* Persian text - RTL, larger font */}
            {(languageFilter === "all" || languageFilter === "persian") && (
              <p
                dir="rtl"
                className="text-right text-xl font-medium leading-relaxed"
              >
                {line.original}
              </p>
            )}

            {/* Transliteration - italic, green */}
            {(languageFilter === "all" || languageFilter === "transliteration") && (
              <p className="text-base italic text-emerald-500">
                {line.transliteration}
              </p>
            )}

            {/* Hebrew text - RTL, blue */}
            {(languageFilter === "all" || languageFilter === "hebrew") && line.hebrew && (
              <p dir="rtl" className="text-right text-base text-blue-500">
                {line.hebrew}
              </p>
            )}

            {/* English translation - smaller, gray */}
            {(languageFilter === "all" || languageFilter === "english") && (
              <p className="text-sm text-gray-400">{line.english}</p>
            )}
          </button>

          {/* Info button - opens word breakdown modal */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLineInfoClick?.(line, index);
            }}
            className="flex-shrink-0 rounded p-1.5 text-gray-500 hover:bg-gray-700 hover:text-white transition-colors"
            title="View word breakdown"
          >
            <Info className="h-4 w-4" />
          </button>
          
          {/* Words known indicator */}
          {lineState === 'wordsKnown' && (
            <div className="flex-shrink-0 rounded p-1.5 text-blue-500" title="Some words known from other songs">
              <Star className="h-4 w-4" />
            </div>
          )}
        </div>
        )
      })}
    </div>
  );
}
