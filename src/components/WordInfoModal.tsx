import { useEffect, useState, useCallback } from "react";
import { Volume2, Check } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useVisitorId } from "../hooks/useVisitorId";
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
import { Checkbox } from "./ui/checkbox";

// Word data from Convex
type WordData = Doc<"words">;

// Progress data from Convex
type WordProgressData = Doc<"wordProgress"> | null;

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
  songId: Id<"songs">;
  isMobile: boolean;
}

// Word table component - for desktop Dialog
function WordTable({
  words,
  wordProgress,
  onPlayWord,
  onToggleLearned,
}: {
  words: WordData[];
  wordProgress: Map<string, WordProgressData>;
  onPlayWord: (word: WordData) => void;
  onToggleLearned: (wordId: Id<"words">) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
            <th className="pb-2 pr-2 font-medium">✓</th>
            <th className="pb-2 pr-4 font-medium">Persian</th>
            <th className="pb-2 pr-4 font-medium">Sound</th>
            <th className="pb-2 pr-4 font-medium">Hebrew</th>
            <th className="pb-2 pr-4 font-medium">English</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 pl-2 font-medium">🔊</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => {
            const progress = wordProgress.get(word._id);
            const isLearned = progress?.learned ?? false;

            return (
              <tr
                key={word._id}
                className={`border-b border-gray-800 last:border-0 ${
                  isLearned ? "bg-green-900/10" : ""
                }`}
              >
                {/* Learned checkbox */}
                <td className="py-2 pr-2">
                  <Checkbox
                    checked={isLearned}
                    onCheckedChange={() => onToggleLearned(word._id)}
                    className={`${
                      isLearned
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-600"
                    }`}
                  />
                </td>
                {/* Persian - RTL */}
                <td className="py-2 pr-4" dir="rtl">
                  <span
                    className={`text-base font-medium ${
                      isLearned ? "text-green-400" : ""
                    }`}
                  >
                    {word.persian}
                    {isLearned && (
                      <Check className="ml-1 inline-block h-3 w-3 text-green-500" />
                    )}
                  </span>
                </td>
                {/* Transliteration */}
                <td className="py-2 pr-4">
                  <span className="text-sm italic text-emerald-500">
                    {word.transliteration}
                  </span>
                </td>
                {/* Hebrew - RTL */}
                <td className="py-2 pr-4" dir="rtl">
                  <span className="text-sm text-blue-500">
                    {word.hebrew || "—"}
                  </span>
                </td>
                {/* English */}
                <td className="py-2 pr-4">
                  <span className="text-sm text-gray-400">
                    {word.english || "—"}
                  </span>
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
                    disabled={!word.forvoAudioUrl}
                    className={`rounded p-1 transition-colors ${
                      word.forvoAudioUrl
                        ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                        : "cursor-not-allowed text-gray-700"
                    }`}
                    title={
                      word.forvoAudioUrl
                        ? "Play pronunciation"
                        : "Audio not available (coming soon)"
                    }
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Mobile-optimized word cards - vertical layout for narrow screens
function MobileWordCards({
  words,
  wordProgress,
  onPlayWord,
  onToggleLearned,
}: {
  words: WordData[];
  wordProgress: Map<string, WordProgressData>;
  onPlayWord: (word: WordData) => void;
  onToggleLearned: (wordId: Id<"words">) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {words.map((word) => {
        const progress = wordProgress.get(word._id);
        const isLearned = progress?.learned ?? false;

        return (
          <div
            key={word._id}
            className={`rounded-lg border p-4 transition-colors ${
              isLearned
                ? "border-green-600/30 bg-green-900/20"
                : "border-gray-700 bg-gray-800/50"
            }`}
          >
            {/* Top row: Persian word + checkbox + audio */}
            <div className="flex items-center justify-between gap-3">
              {/* Persian word - prominent */}
              <div className="flex-1" dir="rtl">
                <span
                  className={`text-2xl font-medium ${
                    isLearned ? "text-green-400" : "text-white"
                  }`}
                >
                  {word.persian}
                </span>
              </div>

              {/* Actions: Audio + Checkbox */}
              <div className="flex items-center gap-3">
                {/* Audio button - large touch target */}
                <button
                  onClick={() => onPlayWord(word)}
                  disabled={!word.forvoAudioUrl}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                    word.forvoAudioUrl
                      ? "bg-gray-700 text-white active:bg-gray-600"
                      : "bg-gray-800 text-gray-600"
                  }`}
                  title={
                    word.forvoAudioUrl
                      ? "Play pronunciation"
                      : "Audio coming soon"
                  }
                >
                  <Volume2 className="h-5 w-5" />
                </button>

                {/* Learned checkbox - large touch target */}
                <button
                  onClick={() => onToggleLearned(word._id)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                    isLearned
                      ? "bg-green-600 text-white"
                      : "border-2 border-gray-600 bg-transparent text-gray-400"
                  }`}
                >
                  <Check className={`h-5 w-5 ${isLearned ? "" : "opacity-40"}`} />
                </button>
              </div>
            </div>

            {/* Transliteration - how to pronounce */}
            <p className="mt-2 text-lg italic text-emerald-500">
              {word.transliteration}
            </p>

            {/* Hebrew transliteration */}
            {word.hebrew && (
              <p className="mt-1 text-base text-blue-400" dir="rtl">
                {word.hebrew}
              </p>
            )}

            {/* English meaning + grammar type */}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-base text-gray-300">{word.english}</p>
              {word.grammarType && (
                <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                  {word.grammarType}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WordInfoModal({
  isOpen,
  onClose,
  line,
  songId,
  isMobile,
}: WordInfoModalProps) {
  const visitorId = useVisitorId();

  // Fetch words for this line from Convex
  const words = useQuery(
    api.words.getByLine,
    line ? { songId, lineNumber: line.lineNumber } : "skip"
  );

  // Fetch word progress for all words in this line
  const wordIds = words?.map((w) => w._id) ?? [];
  const progressData = useQuery(
    api.wordProgress.getByVisitorWords,
    visitorId && wordIds.length > 0
      ? { visitorId, wordIds }
      : "skip"
  );

  // Build a map of wordId -> progress for easy lookup
  const [wordProgressMap, setWordProgressMap] = useState<
    Map<string, WordProgressData>
  >(new Map());

  useEffect(() => {
    if (progressData) {
      const map = new Map<string, WordProgressData>();
      progressData.forEach(({ wordId, progress }) => {
        map.set(wordId, progress);
      });
      setWordProgressMap(map);
    }
  }, [progressData]);

  // Mutations for tracking
  const incrementViewCount = useMutation(api.wordProgress.incrementViewCount);
  const incrementPlayCount = useMutation(api.wordProgress.incrementPlayCount);
  const toggleLearned = useMutation(api.wordProgress.toggleLearned);

  // Track view counts when modal opens
  useEffect(() => {
    if (isOpen && words && visitorId) {
      // Increment view count for each word in the line
      words.forEach((word) => {
        incrementViewCount({ visitorId, wordId: word._id });
      });
    }
  }, [isOpen, words, visitorId, incrementViewCount]);

  // Play word pronunciation and track play count
  const handlePlayWord = useCallback(
    (word: WordData) => {
      if (word.forvoAudioUrl) {
        const audio = new Audio(word.forvoAudioUrl);
        audio.play();

        // Track play count
        if (visitorId) {
          incrementPlayCount({ visitorId, wordId: word._id });
        }
      }
    },
    [visitorId, incrementPlayCount]
  );

  // Toggle learned status
  const handleToggleLearned = useCallback(
    async (wordId: Id<"words">) => {
      if (visitorId) {
        const newLearned = await toggleLearned({ visitorId, wordId });
        // Update local state optimistically
        setWordProgressMap((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(wordId);
          if (existing) {
            newMap.set(wordId, { ...existing, learned: newLearned });
          } else {
            // Create a placeholder progress entry
            newMap.set(wordId, {
              _id: "temp" as Id<"wordProgress">,
              _creationTime: Date.now(),
              visitorId,
              wordId,
              viewCount: 0,
              playCount: 0,
              learned: newLearned,
              lastSeen: Date.now(),
            });
          }
          return newMap;
        });
      }
    },
    [visitorId, toggleLearned]
  );

  if (!line) return null;

  // Calculate learned count for summary
  const learnedCount =
    words?.filter((w) => wordProgressMap.get(w._id)?.learned).length ?? 0;
  const totalWords = words?.length ?? 0;

  // Show loading state while fetching words
  const isLoading = words === undefined;

  const content = (
    <>
      {/* Full line display */}
      <div className="rounded-lg bg-gray-800 p-4">
        <p dir="rtl" className="text-right text-xl font-medium leading-relaxed">
          {line.original}
        </p>
        <p className="mt-2 text-base italic text-emerald-500">
          {line.transliteration}
        </p>
        {line.hebrew && (
          <p dir="rtl" className="mt-2 text-right text-base text-blue-500">
            {line.hebrew}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-400">{line.english}</p>
      </div>

      {/* Progress summary */}
      {totalWords > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-400">Progress:</span>
          <span
            className={`font-medium ${
              learnedCount === totalWords ? "text-green-500" : "text-gray-300"
            }`}
          >
            {learnedCount}/{totalWords} words learned
          </span>
          {learnedCount === totalWords && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </div>
      )}

      {/* Word table */}
      <div className="mt-4 max-h-[50vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="ml-2 text-sm text-gray-400">Loading words...</span>
          </div>
        ) : words && words.length > 0 ? (
          <WordTable
            words={words}
            wordProgress={wordProgressMap}
            onPlayWord={handlePlayWord}
            onToggleLearned={handleToggleLearned}
          />
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            No word data available for this line yet.
          </p>
        )}
      </div>

      {/* Note about audio */}
      <p className="mt-2 text-center text-xs text-gray-500">
        Word audio coming soon (US-031)
      </p>
    </>
  );

  // Mobile: Use Sheet (drawer from bottom) with card-based layout
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="flex h-[85vh] flex-col border-gray-700 bg-gray-900 text-white"
        >
          {/* Drag handle for visual affordance */}
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-gray-600" />

          <SheetHeader className="flex-shrink-0 pb-2 pt-3">
            <SheetTitle className="text-white">Line {line.lineNumber}</SheetTitle>
            <SheetDescription className="text-gray-400">
              Tap a word to mark as learned
            </SheetDescription>
          </SheetHeader>

          {/* Compact line display for mobile */}
          <div className="flex-shrink-0 rounded-lg bg-gray-800 p-3">
            <p dir="rtl" className="text-right text-lg font-medium leading-relaxed">
              {line.original}
            </p>
            <p className="mt-1 text-sm italic text-emerald-500">
              {line.transliteration}
            </p>
            <p className="mt-1 text-xs text-gray-400">{line.english}</p>
          </div>

          {/* Progress summary */}
          {totalWords > 0 && (
            <div className="flex flex-shrink-0 items-center gap-2 px-1 py-2 text-sm">
              <span className="text-gray-400">Progress:</span>
              <span
                className={`font-medium ${
                  learnedCount === totalWords ? "text-green-500" : "text-gray-300"
                }`}
              >
                {learnedCount}/{totalWords} words
              </span>
              {learnedCount === totalWords && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}

          {/* Scrollable word cards */}
          <div className="flex-1 overflow-y-auto pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="ml-2 text-sm text-gray-400">Loading words...</span>
              </div>
            ) : words && words.length > 0 ? (
              <MobileWordCards
                words={words}
                wordProgress={wordProgressMap}
                onPlayWord={handlePlayWord}
                onToggleLearned={handleToggleLearned}
              />
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">
                No word data available for this line yet.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog (centered modal)
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-gray-700 bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Line {line.lineNumber}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Word-by-word breakdown
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
