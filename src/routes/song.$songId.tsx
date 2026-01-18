import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import LocalVideoPlayer, { LocalVideoPlayerHandle } from "../components/LocalVideoPlayer";
import LyricsDisplay, { LanguageFilter } from "../components/LyricsDisplay";
import { useAudioPreloader } from "../hooks/useAudioPreloader";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Repeat, Languages, Volume2, Video, Play, Square, Waves, Pause } from "lucide-react";

// Playback modes
type PlaybackMode = "single" | "loop" | "fluid";

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
    pause: pauseAudioSnippet,
    resume: resumeAudioSnippet,
    isPlaying: isAudioPlaying,
    setPlaybackRate: setAudioPlaybackRate,
    setLoop: setAudioLoop,
  } = useAudioPreloader(audioSnippets);

  const playerRef = useRef<LocalVideoPlayerHandle>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number | undefined>(
    undefined
  );
  const [clickedLineIndex, setClickedLineIndex] = useState<number | undefined>(
    undefined
  );

  // Playback mode state: single, loop, or fluid
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("single");
  const [currentLineIndex, setCurrentLineIndex] = useState<number | undefined>(
    undefined
  );

  // Playback speed state
  const [playbackSpeed, setPlaybackSpeed] = useState<string>("1");

  // Language filter state
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");

  // Video mute state - derived from playback mode (muted in single/loop, unmuted in fluid)
  // But we also track it separately for edge cases
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  // Video error state - for fallback handling
  const [videoError, setVideoError] = useState<string | null>(null);

  // Video playing state - for pause/play control
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleSpeedChange = useCallback((speed: string) => {
    setPlaybackSpeed(speed);
    // Update both video and audio playback rate
    playerRef.current?.setPlaybackRate(parseFloat(speed));
    setAudioPlaybackRate(parseFloat(speed));
  }, [setAudioPlaybackRate]);

  // Handle playback mode change
  const handlePlaybackModeChange = useCallback((mode: PlaybackMode) => {
    const previousMode = playbackMode;
    setPlaybackMode(mode);

    // Sync video mute state with mode
    if (mode === "fluid") {
      // Switching TO Fluid mode: unmute video, continue from current position
      playerRef.current?.unmute();
      setIsVideoMuted(false);
      // Continue playing from current position (don't restart)
      playerRef.current?.play();
    } else {
      // Switching TO Single/Loop mode: mute video, audio from snippets
      playerRef.current?.mute();
      setIsVideoMuted(true);

      // If coming FROM Fluid mode, stay at current line position
      // The activeLineIndex already tracks where we are, so just trigger the snippet
      if (previousMode === "fluid" && activeLineIndex !== undefined) {
        const lineNumber = sortedLyrics[activeLineIndex]?.lineNumber;
        if (lineNumber !== undefined && audioReady) {
          setCurrentLineIndex(activeLineIndex);
          playAudioSnippet(lineNumber);
          // Keep video in sync (muted)
          playerRef.current?.seekTo(sortedLyrics[activeLineIndex].startTime);
          playerRef.current?.play();
        }
      }
    }

    // Update audio loop based on mode
    setAudioLoop(mode === "loop");
  }, [playbackMode, setAudioLoop, activeLineIndex, sortedLyrics, audioReady, playAudioSnippet]);

  // REMOVED: playFullVideo function - Fluid mode now replaces "Play Full Video" functionality
  // When user switches to Fluid mode, video continues from current position instead of restarting

  // Handle video error (for fallback)
  const handleVideoError = useCallback((error: string) => {
    setVideoError(error);
    console.warn('Local video error:', error);
  }, []);

  // Handle video state change (playing/paused/ended)
  const handleVideoStateChange = useCallback((state: 'playing' | 'paused' | 'ended') => {
    setIsVideoPlaying(state === 'playing');
  }, []);

  // Toggle pause/play across all modes
  const togglePlayPause = useCallback(() => {
    if (playbackMode === "fluid") {
      // Fluid mode: only video matters (video audio is playing)
      if (isVideoPlaying) {
        playerRef.current?.pause();
      } else {
        playerRef.current?.play();
      }
    } else {
      // Single/Loop mode: pause/resume both video (muted) and audio snippet
      if (isVideoPlaying || isAudioPlaying) {
        // Pause both
        playerRef.current?.pause();
        pauseAudioSnippet();
      } else {
        // Resume both
        playerRef.current?.play();
        resumeAudioSnippet();
      }
    }
  }, [playbackMode, isVideoPlaying, isAudioPlaying, pauseAudioSnippet, resumeAudioSnippet]);

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

      // Trigger visual feedback
      triggerClickAnimation(lineIndex);
      // Set as active line
      setActiveLineIndex(lineIndex);
      // Set as current line for looping/single mode
      setCurrentLineIndex(lineIndex);

      // Seek video to match the line
      playerRef.current?.seekTo(startTime);

      // Handle differently based on playback mode
      if (playbackMode === "fluid") {
        // Fluid mode: video plays with audio, continue playing after seek
        playerRef.current?.play();
      } else {
        // Single/Loop mode: video muted, audio from snippet
        // Play local audio snippet if available (instant playback)
        if (lineNumber !== undefined && audioReady) {
          playAudioSnippet(lineNumber);
        }
        // Also play video (muted) to keep visual in sync
        playerRef.current?.play();
      }
    },
    [triggerClickAnimation, sortedLyrics, audioReady, playAudioSnippet, playbackMode]
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

  // Sync loop mode to audio preloader (for Single/Loop snippet modes)
  useEffect(() => {
    setAudioLoop(playbackMode === "loop");
  }, [playbackMode, setAudioLoop]);

  // Handle video segment looping/stopping in Single/Loop modes
  // In these modes, video plays muted alongside audio snippets
  useEffect(() => {
    if (currentLineIndex === undefined || playbackMode === "fluid") {
      return; // Only handle in Single/Loop modes
    }

    const currentLine = sortedLyrics[currentLineIndex];
    if (!currentLine) return;

    const checkTime = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const currentTime = player.getCurrentTime();
      // If we've reached the end of the current line
      if (currentTime >= currentLine.endTime) {
        if (playbackMode === "loop") {
          // Loop mode: seek back to start of line
          player.seekTo(currentLine.startTime);
        } else {
          // Single mode: pause video at end of segment
          player.pause();
        }
      }
    }, 100);

    return () => clearInterval(checkTime);
  }, [playbackMode, currentLineIndex, sortedLyrics]);

  // Handle video segment looping in Fluid mode (when Loop mode was active before switching to Fluid)
  useEffect(() => {
    if (currentLineIndex === undefined || playbackMode !== "fluid") {
      return; // Only handle in Fluid mode
    }

    // In Fluid mode, video just continues playing naturally
    // No special handling needed - video plays through all segments
  }, [playbackMode, currentLineIndex]);

  // Spacebar keyboard shortcut for pause/play
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle spacebar, and not when typing in an input
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault(); // Prevent page scroll
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

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
              {song.videoUrl && !videoError ? (
                <LocalVideoPlayer
                  ref={playerRef}
                  videoUrl={song.videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onStateChange={handleVideoStateChange}
                  onError={handleVideoError}
                  muted={isVideoMuted}
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                  <div className="text-center p-4">
                    <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">Video not available</p>
                    <p className="text-sm mt-1">
                      {videoError || 'Local video file not found'}
                    </p>
                    {song.youtubeId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        Watch on YouTube →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-4 pb-4">
              <div className="flex flex-col gap-3 rounded-lg bg-gray-800 p-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
                {/* Pause/Play Button - hidden in Fluid mode (video has native controls) */}
                {playbackMode !== "fluid" && (
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                    title={isVideoPlaying || isAudioPlaying ? "Pause (Space)" : "Play (Space)"}
                  >
                    {isVideoPlaying || isAudioPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                )}

                {/* Watch on YouTube link - shown in Fluid mode as alternative to native controls */}
                {playbackMode === "fluid" && song.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                  >
                    <Video className="h-4 w-4" />
                    <span>Watch on YouTube</span>
                  </a>
                )}

                {/* Playback Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Mode</span>
                  <ToggleGroup
                    type="single"
                    value={playbackMode}
                    onValueChange={(value) => value && handlePlaybackModeChange(value as PlaybackMode)}
                    className="bg-gray-900 rounded-lg p-1"
                  >
                    <ToggleGroupItem
                      value="single"
                      aria-label="Single play mode"
                      className="px-3 py-1.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Single
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="loop"
                      aria-label="Loop mode"
                      className="px-3 py-1.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Repeat className="h-3 w-3 mr-1" />
                      Loop
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="fluid"
                      aria-label="Fluid play mode"
                      className="px-3 py-1.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Waves className="h-3 w-3 mr-1" />
                      Fluid
                    </ToggleGroupItem>
                  </ToggleGroup>
                  {/* Show current line indicator in Loop mode */}
                  {playbackMode === "loop" && currentLineIndex !== undefined && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                      Line {currentLineIndex + 1}
                    </span>
                  )}
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

                {/* Audio Loading Status - show only when not in Fluid mode (using snippets) */}
                {playbackMode !== "fluid" && (
                  <div className="flex items-center gap-2">
                    <Volume2 className={`h-4 w-4 ${audioReady ? "text-green-500" : "text-gray-400"}`} />
                    {audioReady ? (
                      <span className="text-xs text-green-500">Snippets ready</span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Loading snippets... {audioLoaded}/{audioTotal}
                      </span>
                    )}
                  </div>
                )}
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
