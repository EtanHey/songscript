import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Info } from "lucide-react";
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
  onLineClick?: (startTime: number, lineIndex: number) => void;
  onLineInfoClick?: (line: LyricLine, lineIndex: number) => void;
  activeLineIndex?: number;
  clickedLineIndex?: number;
  languageFilter?: LanguageFilter;
}

export default function LyricsDisplay({
  songId,
  onLineClick,
  onLineInfoClick,
  activeLineIndex,
  clickedLineIndex,
  languageFilter = "all",
}: LyricsDisplayProps) {
  const { data: lyrics } = useSuspenseQuery(
    convexQuery(api.lyrics.getBySong, { songId })
  );

  // Sort lyrics by lineNumber to ensure correct order
  const sortedLyrics = [...(lyrics || [])].sort(
    (a, b) => a.lineNumber - b.lineNumber
  ) as LyricLine[];

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
      {sortedLyrics.map((line, index) => (
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
          }`}
        >
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
        </div>
      ))}
    </div>
  );
}
