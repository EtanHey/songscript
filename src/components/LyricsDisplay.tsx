import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface LyricLine {
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
  activeLineIndex?: number;
  clickedLineIndex?: number;
  languageFilter?: LanguageFilter;
}

export default function LyricsDisplay({
  songId,
  onLineClick,
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

  return (
    <div className="flex flex-col gap-2">
      {sortedLyrics.map((line, index) => (
        <button
          key={line._id}
          type="button"
          onClick={() => onLineClick?.(line.startTime, index)}
          className={`flex flex-col gap-1 rounded-lg p-3 text-left transition-all duration-150 hover:bg-primary/5 ${
            activeLineIndex === index
              ? "bg-primary/10 ring-1 ring-primary/20"
              : ""
          } ${
            clickedLineIndex === index
              ? "scale-[0.98] bg-primary/20"
              : ""
          }`}
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
      ))}
    </div>
  );
}
