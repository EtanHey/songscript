import { useEffect, useState, useCallback } from "react";
import { Volume2, Loader2, Music, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { playWordAudio, stopWordAudio } from "../utils/wordAudio";
import { Link } from "@tanstack/react-router";
import { LanguageFlag } from "./LanguageFlag";
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


interface WordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  persian: string | null;
  isMobile: boolean;
}

export default function WordDetailsModal({
  isOpen,
  onClose,
  persian,
  isMobile,
}: WordDetailsModalProps) {
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch word details with songs
  const { data: wordDetails, isLoading: detailsLoading } = useQuery({
    ...convexQuery(api.wordProgress.getWordDetailsWithSongs, {
      persian: persian || "",
    }),
    enabled: !!persian && isOpen,
  });

  // Fetch practice history
  const { data: practiceHistory, isLoading: historyLoading } = useQuery({
    ...convexQuery(api.wordProgress.getWordPracticeHistory, {
      persian: persian || "",
    }),
    enabled: !!persian && isOpen,
  });

  // Stop audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopWordAudio();
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Play word pronunciation
  const handlePlayAudio = useCallback(async () => {
    if (!persian) return;

    setIsLoading(true);
    setIsPlaying(false);

    try {
      // Use Forvo audio URL if available from wordDetails
      const result = await playWordAudio(persian, wordDetails?.forvoAudioUrl);
      if (result.success) {
        setIsPlaying(true);
        // Clear playing state after audio finishes (typically short)
        setTimeout(() => {
          setIsPlaying(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error playing word audio:", error);
    } finally {
      setIsLoading(false);
    }
  }, [persian, wordDetails?.forvoAudioUrl]);

  if (!persian) return null;

  const isDataLoading = detailsLoading || historyLoading;

  const content = (
    <>
      {/* Large word display */}
      <div className="rounded-lg bg-gray-800 p-6 text-center">
        <p dir="rtl" className="text-4xl font-bold text-white mb-3">
          {persian}
        </p>
        {wordDetails && (
          <>
            <p className="text-xl italic text-emerald-400 mb-2">
              {wordDetails.transliteration}
            </p>
            {wordDetails.hebrew && (
              <p dir="rtl" className="text-lg text-blue-400 mb-2">
                {wordDetails.hebrew}
              </p>
            )}
            <p className="text-lg text-gray-300">{wordDetails.english}</p>
            {wordDetails.grammarType && (
              <span className="mt-3 inline-block rounded-full bg-gray-700 px-3 py-1 text-sm text-gray-400">
                {wordDetails.grammarType}
              </span>
            )}
          </>
        )}
      </div>

      {/* Audio play button - prominent */}
      <div className="flex justify-center my-4">
        <button
          onClick={handlePlayAudio}
          disabled={isLoading}
          className={`flex items-center gap-3 px-6 py-3 rounded-full font-medium transition-all min-h-[52px] ${
            isPlaying
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : isLoading
                ? "bg-gray-700 text-gray-400"
                : "bg-gray-700 text-white hover:bg-gray-600 active:scale-95"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Volume2 className="h-6 w-6" />
          )}
          <span>{isPlaying ? "Playing..." : "Listen to pronunciation"}</span>
        </button>
      </div>

      {/* Practice stats */}
      {practiceHistory && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Your Practice Stats
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">
                {practiceHistory.totalPracticeCount}
              </p>
              <p className="text-xs text-gray-400">Times Practiced</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {practiceHistory.viewCount}
              </p>
              <p className="text-xs text-gray-400">Views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {practiceHistory.playCount}
              </p>
              <p className="text-xs text-gray-400">Audio Plays</p>
            </div>
          </div>
          {practiceHistory.lastSeen && (
            <p className="mt-3 text-center text-xs text-gray-500">
              Last practiced: {formatRelativeTime(practiceHistory.lastSeen)}
            </p>
          )}
        </div>
      )}

      {/* Songs list */}
      {wordDetails && wordDetails.songs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Music className="h-4 w-4" />
            Appears in {wordDetails.songCount}{" "}
            {wordDetails.songCount === 1 ? "song" : "songs"}
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {wordDetails.songs.map((song: typeof wordDetails.songs[0]) => (
              <Link
                key={`${song.songId}-${song.lineNumber}`}
                to="/song/$songId"
                params={{ songId: song.songId as string }}
                search={{ line: song.lineNumber }}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors group min-h-[60px]"
              >
                <LanguageFlag language={song.sourceLanguage} size="1.25em" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate group-hover:text-primary transition-colors">
                    {song.title}
                  </p>
                  <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isDataLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-2 text-sm text-gray-400">
            Loading word details...
          </span>
        </div>
      )}
    </>
  );

  // Mobile: Use Sheet (bottom drawer) with drag handle
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="flex h-[85vh] flex-col border-gray-700 bg-gray-900 text-white"
        >
          {/* Drag handle for visual affordance / swipe-down dismiss hint */}
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-gray-600" />

          <SheetHeader className="flex-shrink-0 pb-2 pt-3">
            <SheetTitle className="text-white">Word Details</SheetTitle>
            <SheetDescription className="text-gray-400">
              Tap the speaker to hear pronunciation
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto pb-4 px-1">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog (centered modal with backdrop)
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-gray-700 bg-gray-900 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Word Details</DialogTitle>
          <DialogDescription className="text-gray-400">
            Click the speaker to hear pronunciation
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
