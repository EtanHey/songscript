import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense, useMemo } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import LocalVideoPlayer from "../components/LocalVideoPlayer";
import YouTubePlayer, {
  YouTubePlayerHandle,
} from "../components/YouTubePlayer";
import LyricsDisplay from "../components/LyricsDisplay";
import WordInfoModal from "../components/WordInfoModal";
import { useConvexMutation } from "@convex-dev/react-query";
import { useProgress } from "../hooks/useProgress";
import { usePlaybackState } from "../hooks/usePlaybackState";
import { usePracticeTracking } from "../hooks/usePracticeTracking";
import { useLineProgress } from "../hooks/useLineProgress";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Repeat,
  Languages,
  Video,
  Play,
  Square,
  Waves,
  Pause,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { WishlistButton } from "../components/WishlistButton";
import { AnonymousProgressBanner } from "../components/AnonymousProgressBanner";
import { getLanguageDisplayName } from "../components/dashboard/LanguageChip";
import { isRTLLanguage } from "../components/LanguageFlag";

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
    convexQuery(api.songs.getById, { id: songId }),
  );
  const { data: lyrics } = useSuspenseQuery(
    convexQuery(api.lyrics.getBySong, { songId }),
  );

  // Unified progress hook — routes to localStorage for anonymous, Convex for authenticated
  const progress = useProgress();
  const isAuthenticated = progress.isAuthenticated;

  // For authenticated users, get line progress from Convex
  const { data: lineProgressFromConvex } = useSuspenseQuery(
    convexQuery(api.songProgress.getLineProgressByUserSong, { songId }),
  );

  // Load user preferences
  const { data: userPreferences } = useSuspenseQuery(
    convexQuery(api.userPreferences.getUserPreferences, {}),
  );
  const updatePreferencesMutation = useConvexMutation(
    api.userPreferences.updatePreferences,
  );

  // Mutations
  const logPracticeMutation = useConvexMutation(api.practiceLog.logPractice);
  const recordLineCompletionMutation = useConvexMutation(
    api.songProgress.recordLineCompletion,
  );
  const toggleLineLearnedMutation = useConvexMutation(
    api.songProgress.toggleLineLearned,
  );
  const toggleWordLearnedMutation = useConvexMutation(
    api.wordProgress.toggleLearned,
  );

  // Sort lyrics by lineNumber
  const sortedLyrics = useMemo(
    () => [...(lyrics || [])].sort((a, b) => a.lineNumber - b.lineNumber),
    [lyrics],
  );

  // --- Hook 1: Line progress (optimistic toggles, learned state) ---
  const { lineProgress, handleLineCheckboxClick, handleToggleWordLearned } =
    useLineProgress({
      songId,
      isAuthenticated,
      progress,
      lineProgressFromConvex,
      toggleLineLearnedMutation,
      toggleWordLearnedMutation,
      logPracticeMutation,
    });

  // --- Hook 2: Playback state (all playback controls, handlers, refs) ---
  // Owns sessionCompletedLines internally — no circular dependency
  const playback = usePlaybackState({
    sortedLyrics,
    songId,
    song: {
      videoUrl: song?.videoUrl,
      youtubeId: song?.youtubeId,
      sourceLanguage: song?.sourceLanguage || "",
    },
    isAuthenticated,
    userPreferences,
    updatePreferencesMutation,
    logPracticeMutation,
    recordLineCompletionMutation,
  });

  // --- Hook 3: Practice tracking (activity monitoring, time logging) ---
  // Pure side-effect hook — reads playback state, logs practice time
  const isUsingYouTube = !song?.videoUrl && !!song?.youtubeId;
  usePracticeTracking({
    isVideoPlaying: playback.isPlaying,
    playbackMode: playback.mode,
    isVideoMuted: playback.isMuted,
    isUsingYouTube,
    wordModalOpen: playback.wordModalOpen,
    isAuthenticated,
    logPracticeMutation,
    logPracticeFn: progress.logPractice,
  });

  if (!song) {
    throw notFound();
  }

  return (
    <div className="bg-gray-900 text-white h-[calc(100vh-57px)] sm:h-[calc(100vh-69px)] flex flex-col lg:flex-row">
      {/* LEFT: Video section */}
      <div className="lg:w-1/2 lg:border-r lg:border-gray-800 flex-shrink-0">
        {/* Mobile: Collapsible Header */}
        {playback.isMobile && (
          <div
            role="button"
            tabIndex={0}
            onClick={playback.handleVideoCollapsedToggle}
            onKeyDown={(e) =>
              e.key === "Enter" && playback.handleVideoCollapsedToggle()
            }
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Video className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <h1 className="text-sm font-bold truncate brand-gradient">
                  {song.title}
                </h1>
                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <WishlistButton songId={songId} size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {playback.isCollapsed && (
                <div
                  className="flex items-center gap-1 mr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={playback.togglePlayPause}
                    className="p-1.5 rounded bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                    aria-label={playback.isPlaying ? "Pause" : "Play"}
                  >
                    {playback.isPlaying ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <ToggleGroup
                    type="single"
                    value={playback.mode}
                    onValueChange={(value) =>
                      value &&
                      playback.handlePlaybackModeChange(
                        value as "single" | "loop" | "fluid",
                      )
                    }
                    className="bg-gray-900 rounded p-0.5"
                  >
                    <ToggleGroupItem
                      value="single"
                      aria-label="Single"
                      className="px-2 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Square className="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="loop"
                      aria-label="Loop"
                      className="px-2 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Repeat className="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="fluid"
                      aria-label="Fluid"
                      className="px-2 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Waves className="h-3 w-3" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
              {playback.isCollapsed ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        )}

        {/* Desktop: Song title */}
        {!playback.isMobile && (
          <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold brand-gradient">{song.title}</h1>
              <p className="text-sm text-gray-400">{song.artist}</p>
            </div>
            <WishlistButton songId={songId} size="md" />
          </div>
        )}

        {/* Video player — stays mounted on mobile (animated accordion) to preserve playback position */}
        <div
          className={`overflow-hidden ${playback.isMobile ? `transition-[max-height,opacity] duration-300 ease-in-out ${playback.isCollapsed ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"}` : ""}`}
        >
          <div className={`p-4 pb-2 ${playback.isMobile ? "pt-2" : ""}`}>
            {song.videoUrl && !playback.videoError ? (
              <LocalVideoPlayer
                ref={playback.playerRef}
                videoUrl={song.videoUrl}
                onTimeUpdate={playback.handleTimeUpdate}
                onStateChange={playback.handleVideoStateChange}
                onError={playback.handleVideoError}
                onMuteChange={playback.handleVideoMuteChange}
                muted={playback.isMuted}
                autoplay={
                  playback.preferencesApplied && playback.mode === "fluid"
                }
                showMuteButton={true}
              />
            ) : song.youtubeId ? (
              <YouTubePlayer
                ref={playback.playerRef as React.Ref<YouTubePlayerHandle>}
                videoId={song.youtubeId}
                onTimeUpdate={playback.handleTimeUpdate}
                onStateChange={(state) => {
                  if (state === 1) playback.handleVideoStateChange("playing");
                  else if (state === 2)
                    playback.handleVideoStateChange("paused");
                  else if (state === 0)
                    playback.handleVideoStateChange("ended");
                }}
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                <div className="text-center p-4">
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">No video available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls — stays mounted on mobile (animated accordion) */}
        <div
          className={`overflow-hidden ${playback.isMobile ? `transition-[max-height,opacity] duration-300 ease-in-out ${playback.isCollapsed ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"}` : ""}`}
        >
          <div className="px-4 pb-4">
            {/* Mobile: Current Line Indicator */}
            {(() => {
              const displayLineIndex =
                playback.activeLineIndex ?? playback.currentLineIndex;
              return (
                <div className="md:hidden mb-2">
                  <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2 border border-gray-700">
                    <span className="rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary whitespace-nowrap">
                      {displayLineIndex !== undefined
                        ? `Line ${displayLineIndex + 1}`
                        : "Select a line"}
                    </span>
                    {displayLineIndex !== undefined &&
                      sortedLyrics[displayLineIndex] && (
                        <span
                          className="text-xs text-gray-400 truncate flex-1"
                          dir={
                            isRTLLanguage(song.sourceLanguage) ? "rtl" : "ltr"
                          }
                        >
                          {sortedLyrics[displayLineIndex].original}
                        </span>
                      )}
                    {displayLineIndex === undefined && (
                      <span className="text-xs text-gray-500 italic">
                        Tap a lyric line below to start
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col gap-3 rounded-lg bg-gray-800 p-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
              {/* Pause/Play Button */}
              <div className="relative">
                <button
                  onClick={playback.togglePlayPause}
                  className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                  title={playback.isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {playback.isPlaying ? (
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
                {/* Keyboard shortcut hint — desktop only */}
                {playback.showSpaceHint && !playback.isMobile && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 shadow-lg animate-pulse">
                    Press{" "}
                    <kbd className="rounded bg-gray-600 px-1 font-mono">
                      Space
                    </kbd>{" "}
                    to play/pause
                  </div>
                )}
              </div>

              {/* Desktop: Current Line Indicator */}
              {(playback.activeLineIndex ?? playback.currentLineIndex) !==
                undefined && (
                <div className="hidden md:flex items-center gap-2">
                  <span className="rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                    Line{" "}
                    {(playback.activeLineIndex ?? playback.currentLineIndex)! +
                      1}
                  </span>
                </div>
              )}

              {/* Playback Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Mode</span>
                <ToggleGroup
                  type="single"
                  value={playback.mode}
                  onValueChange={(value) =>
                    value &&
                    playback.handlePlaybackModeChange(
                      value as "single" | "loop" | "fluid",
                    )
                  }
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
              </div>

              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Speed</label>
                <Select
                  value={playback.playbackSpeed}
                  onValueChange={playback.handleSpeedChange}
                >
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
                  value={playback.languageFilter}
                  onValueChange={playback.handleLanguageFilterChange}
                >
                  <SelectTrigger className="w-36 border-gray-700 bg-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="source">
                      {getLanguageDisplayName(song.sourceLanguage)} Only
                    </SelectItem>
                    <SelectItem value="transliteration">
                      Transliteration
                    </SelectItem>
                    <SelectItem value="hebrew">Hebrew Only</SelectItem>
                    <SelectItem value="english">English Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Lyrics section — scrolls */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnonymousProgressBanner />
        <LyricsDisplay
          songId={songId}
          sourceLanguage={song.sourceLanguage}
          onLineClick={playback.handleLineClick}
          onLineInfoClick={playback.handleLineInfoClick}
          onLineCheckboxClick={handleLineCheckboxClick}
          activeLineIndex={playback.activeLineIndex}
          clickedLineIndex={playback.clickedLineIndex}
          languageFilter={playback.languageFilter}
          lineProgress={lineProgress || []}
        />
      </div>

      {/* Word Info Modal */}
      <WordInfoModal
        isOpen={playback.wordModalOpen}
        onClose={playback.handleWordModalClose}
        line={playback.selectedLine}
        songId={songId}
        sourceLanguage={song.sourceLanguage}
        isMobile={playback.isMobile}
        lineAudioUrl={playback.selectedLine?.audioSnippetUrl}
        onToggleLearned={handleToggleWordLearned}
      />
    </div>
  );
}
