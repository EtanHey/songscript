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

interface LyricsDisplayProps {
  songId: Id<"songs">;
  onLineClick?: (startTime: number, lineIndex: number) => void;
  activeLineIndex?: number;
  clickedLineIndex?: number;
}

export default function LyricsDisplay({
  songId,
  onLineClick,
  activeLineIndex,
  clickedLineIndex,
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
          <p
            dir="rtl"
            className="text-right text-xl font-medium leading-relaxed"
          >
            {line.original}
          </p>

          {/* Transliteration - italic, green */}
          <p className="text-base italic text-emerald-500">
            {line.transliteration}
          </p>

          {/* Hebrew text - RTL, blue */}
          {line.hebrew && (
            <p dir="rtl" className="text-right text-base text-blue-500">
              {line.hebrew}
            </p>
          )}

          {/* English translation - smaller, gray */}
          <p className="text-sm text-gray-400">{line.english}</p>
        </button>
      ))}
    </div>
  );
}
