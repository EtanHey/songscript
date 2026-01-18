import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import YouTubePlayer, { YouTubePlayerHandle } from "../components/YouTubePlayer";
import LyricsDisplay, { LanguageFilter } from "../components/LyricsDisplay";
import { useAudioPreloader } from "../hooks/useAudioPreloader";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Repeat, Languages, Volume2 } from "lucide-react";

export const Route = createFileRoute("/song/$songId")({
  component: SongPage,
});

function SongErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="mb-4 text-6xl font-bold text-gray-400">404</h1>
      <p className="mb-8 text-xl text-gray-500">Song not found</p>
      <Link
        to="/"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}

function SongPage() {
  const { songId } = Route.useParams();

  return (
    <ErrorBoundary FallbackComponent={SongErrorFallback}>
      <Suspense fallback={<SongPageLoading />}>
        <SongPageContent songId={songId as Id<"songs">} />
      </Suspense>
    </ErrorBoundary>
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

  // Sort lyrics by lineNumber for consistent access - memoized to prevent infinite re-renders
  const sortedLyrics = useMemo(
    () => [...(lyrics || [])].sort((a, b) => a.lineNumber - b.lineNumber),
    [lyrics]
  );

  // Prepare audio snippets for the preloader hook
  const audioSnippets = useMemo(
    () =>
      sortedLyrics
        .filter((line) => line.audioSnippetUrl)
        .map((line) => ({
          lineNumber: line.lineNumber,
          audioUrl: line.audioSnippetUrl!,
        })),
    [sortedLyrics]
  );

  // Audio preloader hook for instant playback
  const {
    ready: audioReady,
    loaded: audioLoaded,
    total: audioTotal,
    play: playAudioSnippet,
    setPlaybackRate: setAudioPlaybackRate,
    setLoop: setAudioLoop,
  } = useAudioPreloader(audioSnippets);

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
    // Update both YouTube and audio playback rate
    playerRef.current?.setPlaybackRate(parseFloat(speed));
    setAudioPlaybackRate(parseFloat(speed));
  }, [setAudioPlaybackRate]);

  // Clear click animation after 300ms
  const triggerClickAnimation = useCallback((lineIndex: number) => {
    setClickedLineIndex(lineIndex);
    setTimeout(() => {
      setClickedLineIndex(undefined);
    }, 300);
  }, []);

  const handleLineClick = useCallback(
    (startTime: number, lineIndex: number) => {
      const lineNumber = sortedLyrics[lineIndex]?.lineNumber;

      // Play local audio snippet if available (instant playback)
      if (lineNumber !== undefined && audioReady) {
        playAudioSnippet(lineNumber);
      }

      // Also sync YouTube video for visual reference
      playerRef.current?.seekTo(startTime);
      // Mute YouTube so audio doesn't overlap
      // (YouTube player doesn't have a mute method, so we just don't call play)

      // Trigger visual feedback
      triggerClickAnimation(lineIndex);
      // Set as active line
      setActiveLineIndex(lineIndex);
      // Set as current line for looping
      setCurrentLineIndex(lineIndex);
    },
    [triggerClickAnimation, sortedLyrics, audioReady, playAudioSnippet]
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

  // Sync loop mode to audio preloader
  useEffect(() => {
    setAudioLoop(isLooping);
  }, [isLooping, setAudioLoop]);

  if (!song) {
    throw notFound();
  }

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col overflow-hidden bg-gray-900 text-white">
      {/* Main content - side by side on desktop (lg+) */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* LEFT: Player section (50% on desktop, sticky on mobile) */}
        <div className="flex-shrink-0 lg:w-1/2 lg:h-full lg:overflow-y-auto lg:border-r lg:border-gray-800">
          <div className="lg:sticky lg:top-0">
            {/* Song title */}
            <div className="border-b border-gray-800 px-4 py-3">
              <h1 className="text-xl font-bold iran-gradient">{song.title}</h1>
              <p className="text-sm text-gray-400">{song.artist}</p>
            </div>

            {/* Player */}
            <div className="p-4 pb-2">
              <YouTubePlayer
                ref={playerRef}
                videoId={song.youtubeId}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            {/* Controls */}
            <div className="px-4 pb-4">
              <div className="flex flex-col gap-3 rounded-lg bg-gray-800 p-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
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

                {/* Audio Loading Status */}
                <div className="flex items-center gap-2">
                  <Volume2 className={`h-4 w-4 ${audioReady ? "text-green-500" : "text-gray-400"}`} />
                  {audioReady ? (
                    <span className="text-xs text-green-500">Audio ready</span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Loading audio... {audioLoaded}/{audioTotal}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Scrollable lyrics (50% on desktop) */}
        <div className="flex-1 lg:w-1/2 overflow-y-auto px-4 py-4">
          <LyricsDisplay
            songId={songId}
            onLineClick={handleLineClick}
            activeLineIndex={activeLineIndex}
            clickedLineIndex={clickedLineIndex}
            languageFilter={languageFilter}
          />
        </div>
      </div>
    </div>
  );
}
