import { Volume2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";

// Word data structure - will come from Convex once US-033 is implemented
interface WordData {
  persian: string;
  transliteration: string;
  hebrew: string;
  english: string;
  grammarType?: string;
  audioUrl?: string;
}

// Line data from lyrics - simplified interface for modal
export interface ModalLyricLine {
  lineNumber: number;
  original: string;
  transliteration: string;
  hebrew?: string;
  english: string;
}

interface WordInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: ModalLyricLine | null;
  isMobile: boolean;
}

// Temporary word parsing - splits line into words for display
// This will be replaced with actual word data from Convex when US-033 is complete
function parseWordsFromLine(line: ModalLyricLine): WordData[] {
  const persianWords = line.original.split(/\s+/);
  const translitWords = line.transliteration.split(/\s+/);
  const hebrewWords = line.hebrew?.split(/\s+/) || [];

  // Create word objects with basic matching
  return persianWords.map((persian, index) => ({
    persian,
    transliteration: translitWords[index] || "",
    hebrew: hebrewWords[index] || "",
    english: "", // Will come from Convex word data in US-033
    grammarType: undefined, // Will come from Convex word data in US-033
    audioUrl: undefined, // Will come from ElevenLabs in US-031
  }));
}

// Word table component - shared between Dialog and Sheet
function WordTable({ words, onPlayWord }: { words: WordData[]; onPlayWord: (word: WordData) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
            <th className="pb-2 pr-4 font-medium">Persian</th>
            <th className="pb-2 pr-4 font-medium">Sound</th>
            <th className="pb-2 pr-4 font-medium">Hebrew</th>
            <th className="pb-2 pr-4 font-medium">English</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 pl-2 font-medium">🔊</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word, index) => (
            <tr
              key={index}
              className="border-b border-gray-800 last:border-0"
            >
              {/* Persian - RTL */}
              <td className="py-2 pr-4" dir="rtl">
                <span className="text-base font-medium">{word.persian}</span>
              </td>
              {/* Transliteration */}
              <td className="py-2 pr-4">
                <span className="text-sm italic text-emerald-500">{word.transliteration}</span>
              </td>
              {/* Hebrew - RTL */}
              <td className="py-2 pr-4" dir="rtl">
                <span className="text-sm text-blue-500">{word.hebrew || "—"}</span>
              </td>
              {/* English */}
              <td className="py-2 pr-4">
                <span className="text-sm text-gray-400">{word.english || "—"}</span>
              </td>
              {/* Grammar Type */}
              <td className="py-2">
                {word.grammarType ? (
                  <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300">
                    {word.grammarType}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">—</span>
                )}
              </td>
              {/* Audio Button */}
              <td className="py-2 pl-2">
                <button
                  onClick={() => onPlayWord(word)}
                  disabled={!word.audioUrl}
                  className={`rounded p-1 transition-colors ${
                    word.audioUrl
                      ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                      : "cursor-not-allowed text-gray-700"
                  }`}
                  title={word.audioUrl ? "Play pronunciation" : "Audio not available (coming soon)"}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WordInfoModal({ isOpen, onClose, line, isMobile }: WordInfoModalProps) {
  if (!line) return null;

  const words = parseWordsFromLine(line);

  // Play word pronunciation (will be implemented in US-031)
  const handlePlayWord = (word: WordData) => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play();
    }
  };

  // Mobile: Use Sheet (drawer from bottom)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[80vh] bg-gray-900 text-white border-gray-700">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-white">Line {line.lineNumber}</SheetTitle>
            <SheetDescription className="text-gray-400">
              Word-by-word breakdown
            </SheetDescription>
          </SheetHeader>

          {/* Full line display */}
          <div className="mb-4 rounded-lg bg-gray-800 p-3">
            <p dir="rtl" className="text-right text-lg font-medium leading-relaxed">
              {line.original}
            </p>
            <p className="mt-1 text-sm italic text-emerald-500">{line.transliteration}</p>
            <p className="mt-1 text-sm text-gray-400">{line.english}</p>
          </div>

          {/* Word table - scrollable */}
          <div className="flex-1 overflow-y-auto pb-4">
            <WordTable words={words} onPlayWord={handlePlayWord} />
          </div>

          {/* Note about missing data */}
          <p className="mt-4 text-center text-xs text-gray-500">
            Word meanings and audio coming soon
          </p>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog (centered modal)
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Line {line.lineNumber}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Word-by-word breakdown
          </DialogDescription>
        </DialogHeader>

        {/* Full line display */}
        <div className="rounded-lg bg-gray-800 p-4">
          <p dir="rtl" className="text-right text-xl font-medium leading-relaxed">
            {line.original}
          </p>
          <p className="mt-2 text-base italic text-emerald-500">{line.transliteration}</p>
          {line.hebrew && (
            <p dir="rtl" className="mt-2 text-right text-base text-blue-500">{line.hebrew}</p>
          )}
          <p className="mt-2 text-sm text-gray-400">{line.english}</p>
        </div>

        {/* Word table */}
        <div className="mt-4 max-h-[50vh] overflow-y-auto">
          <WordTable words={words} onPlayWord={handlePlayWord} />
        </div>

        {/* Note about missing data */}
        <p className="mt-2 text-center text-xs text-gray-500">
          Word meanings and audio coming soon
        </p>
      </DialogContent>
    </Dialog>
  );
}
