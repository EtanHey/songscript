import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import YouTubePlayer, { YouTubePlayerHandle } from "../components/YouTubePlayer";
import LyricsDisplay, { LanguageFilter } from "../components/LyricsDisplay";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Repeat, Languages } from "lucide-react";

export const Route = createFileRoute("/song/$songId")({
  component: SongPage,
});

function SongPage() {
  const { songId } = Route.useParams();

  return (
    <Suspense fallback={<SongPageLoading />}>
      <SongPageContent songId={songId as Id<"songs">} />
    </Suspense>
  );
}

function SongPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading song...</span>
      </div>
    </div>
  );
}

interface SongPageContentProps {
  songId: Id<"songs">;
}

function SongPageContent({ songId }: SongPageContentProps) {
  const { data: song } = useSuspenseQuery(
    convexQuery(api.songs.getById, { id: songId })
  );
  const { data: lyrics } = useSuspenseQuery(
    convexQuery(api.lyrics.getBySong, { songId })
  );

  // Sort lyrics by lineNumber for consistent access
  const sortedLyrics = [...(lyrics || [])].sort(
    (a, b) => a.lineNumber - b.lineNumber
  );

  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number | undefined>(
    undefined
  );
  const [clickedLineIndex, setClickedLineIndex] = useState<number | undefined>(
    undefined
  );

  // Loop mode state
  const [isLooping, setIsLooping] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | undefined>(
    undefined
  );

  // Playback speed state
  const [playbackSpeed, setPlaybackSpeed] = useState<string>("1");

  // Language filter state
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");

  const handleSpeedChange = useCallback((speed: string) => {
    setPlaybackSpeed(speed);
    playerRef.current?.setPlaybackRate(parseFloat(speed));
  }, []);

  // Clear click animation after 300ms
  const triggerClickAnimation = useCallback((lineIndex: number) => {
    setClickedLineIndex(lineIndex);
    setTimeout(() => {
      setClickedLineIndex(undefined);
    }, 300);
  }, []);

  const handleLineClick = useCallback(
    (startTime: number, lineIndex: number) => {
      // Seek to the timestamp
      playerRef.current?.seekTo(startTime);
      // Start playing after seek
      playerRef.current?.play();
      // Trigger visual feedback
      triggerClickAnimation(lineIndex);
      // Set as active line
      setActiveLineIndex(lineIndex);
      // Set as current line for looping
      setCurrentLineIndex(lineIndex);
    },
    [triggerClickAnimation]
  );

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      // Find which line's startTime <= currentTime < endTime
      const lineIndex = sortedLyrics.findIndex(
        (line) => currentTime >= line.startTime && currentTime < line.endTime
      );
      if (lineIndex !== -1 && lineIndex !== activeLineIndex) {
        setActiveLineIndex(lineIndex);
      }
    },
    [sortedLyrics, activeLineIndex]
  );

  // Loop mode effect - check time every 100ms and seek back if needed
  useEffect(() => {
    if (!isLooping || currentLineIndex === undefined) {
      return;
    }

    const currentLine = sortedLyrics[currentLineIndex];
    if (!currentLine) {
      return;
    }

    const intervalId = setInterval(() => {
      const currentTime = playerRef.current?.getCurrentTime();
      if (currentTime !== undefined && currentTime >= currentLine.endTime) {
        // Seek back to start of current line
        playerRef.current?.seekTo(currentLine.startTime);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [isLooping, currentLineIndex, sortedLyrics]);

  if (!song) {
    throw notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <h1 className="text-2xl font-bold iran-gradient">{song.title}</h1>
        <p className="text-gray-400">{song.artist}</p>
      </header>

      {/* Main content */}
      <main className="flex flex-col gap-4 p-4 lg:flex-row">
        {/* YouTube Player */}
        <div className="w-full lg:w-1/2">
          <div className="sticky top-4">
            <YouTubePlayer
              ref={playerRef}
              videoId={song.youtubeId}
              onTimeUpdate={handleTimeUpdate}
            />
            {/* Controls */}
            <div className="mt-4 flex items-center gap-4 rounded-lg bg-gray-800 p-3">
              {/* Loop Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="loop-mode"
                  checked={isLooping}
                  onCheckedChange={setIsLooping}
                />
                <label
                  htmlFor="loop-mode"
                  className={`flex cursor-pointer items-center gap-1.5 text-sm ${
                    isLooping ? "text-primary" : "text-gray-400"
                  }`}
                >
                  <Repeat
                    className={`h-4 w-4 ${isLooping ? "text-primary" : "text-gray-400"}`}
                  />
                  <span>Loop</span>
                  {isLooping && currentLineIndex !== undefined && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                      Line {currentLineIndex + 1}
                    </span>
                  )}
                </label>
              </div>

              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Speed</label>
                <Select value={playbackSpeed} onValueChange={handleSpeedChange}>
                  <SelectTrigger className="w-20 border-gray-700 bg-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language Filter */}
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-gray-400" />
                <Select
                  value={languageFilter}
                  onValueChange={(value) => setLanguageFilter(value as LanguageFilter)}
                >
                  <SelectTrigger className="w-36 border-gray-700 bg-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="persian">Persian Only</SelectItem>
                    <SelectItem value="transliteration">Transliteration</SelectItem>
                    <SelectItem value="hebrew">Hebrew Only</SelectItem>
                    <SelectItem value="english">English Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Lyrics */}
        <div className="w-full lg:w-1/2">
          <LyricsDisplay
            songId={songId}
            onLineClick={handleLineClick}
            activeLineIndex={activeLineIndex}
            clickedLineIndex={clickedLineIndex}
            languageFilter={languageFilter}
          />
        </div>
      </main>
    </div>
  );
}
