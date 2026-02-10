import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import LocalVideoPlayer, { LocalVideoPlayerHandle } from "../components/LocalVideoPlayer";
import LyricsDisplay, { LanguageFilter, LyricLine } from "../components/LyricsDisplay";
import WordInfoModal, { ModalLyricLine } from "../components/WordInfoModal";
import { useConvexMutation } from "@convex-dev/react-query";
import { useProgress } from "../hooks/useProgress";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Repeat, Languages, Video, Play, Square, Waves, Pause, ChevronDown, ChevronUp } from "lucide-react";
import { WishlistButton } from "../components/WishlistButton";
import { AnonymousProgressBanner } from "../components/AnonymousProgressBanner";
import { getLanguageDisplayName } from "../components/dashboard/LanguageChip";
import { isRTLLanguage } from "../components/LanguageFlag";

// Playback modes - ALL modes use video as audio source
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

  // Unified progress hook - routes to localStorage for anonymous, Convex for authenticated
  const progress = useProgress();
  const isAuthenticated = progress.isAuthenticated;

  // Extract stable function references from progress hook to avoid re-renders
  const toggleLineLearnedFn = progress.toggleLineLearned;
  const toggleWordLearnedFn = progress.toggleWordLearned;
  const logPracticeFn = progress.logPractice;

  // For authenticated users, get line progress from Convex
  // For anonymous users, we'll get it from the useProgress hook
  const { data: lineProgressFromConvex } = useSuspenseQuery(
    convexQuery(api.songProgress.getLineProgressByUserSong, { songId })
  );

  // Optimistic toggle state for instant UI feedback
  // Maps lineNumber -> optimistic learned state (true/false)
  const [optimisticToggles, setOptimisticToggles] = useState<Map<number, boolean>>(new Map());

  // Build line progress array for LyricsDisplay - combine Convex data (authenticated) with local data (anonymous)
  // Note: For anonymous users, we include `progress` in deps to trigger recompute when localStorage changes
  // Type for the simplified line progress used by UI (subset of Convex data)
  type LineProgressUI = {
    _id: string;
    visitorId: string;
    songId: Id<"songs">;
    lineNumber: number;
    learned: boolean;
  };

  const lineProgress = useMemo((): LineProgressUI[] => {
    if (isAuthenticated) {
      // Use Convex data for authenticated users, with optimistic overrides
      const convexProgress = lineProgressFromConvex || [];

      // Transform Convex data to UI format and apply optimistic updates
      const progressMap = new Map<number, LineProgressUI>();

      // Add all Convex data
      for (const p of convexProgress) {
        progressMap.set(p.lineNumber, {
          _id: p._id,
          visitorId: p.visitorId,
          songId: p.songId,
          lineNumber: p.lineNumber,
          learned: p.learned,
        });
      }

      // Apply optimistic updates on top
      for (const [lineNumber, learned] of optimisticToggles) {
        const existing = progressMap.get(lineNumber);
        if (existing) {
          progressMap.set(lineNumber, { ...existing, learned });
        } else if (learned) {
          // Add new optimistic entry
          progressMap.set(lineNumber, {
            _id: `optimistic-${songId}-${lineNumber}`,
            visitorId: 'authenticated',
            songId: songId as Id<"songs">,
            lineNumber,
            learned: true,
          });
        }
      }

      return Array.from(progressMap.values());
    } else {
      // Build from anonymous localStorage data
      const learnedLines = progress.getLearnedLinesForSong(songId);
      return learnedLines.map(lineNumber => ({
        _id: `anon-${songId}-${lineNumber}`,
        visitorId: 'anonymous',
        songId: songId as Id<"songs">,
        lineNumber,
        learned: true,
      }));
    }
  }, [isAuthenticated, lineProgressFromConvex, progress, songId, optimisticToggles]);

  // Clear optimistic state only when server confirms our expected state
  // This prevents flicker when Convex pushes stale data before mutation completes
  useEffect(() => {
    if (!lineProgressFromConvex || optimisticToggles.size === 0) return;

    // Only clear optimistic entries where server state matches what we expected
    const serverStateMap = new Map(
      lineProgressFromConvex.map((p: typeof lineProgressFromConvex[0]) => [p.lineNumber, p.learned])
    );

    let hasMatchingEntries = false;
    for (const [lineNumber, optimisticLearned] of optimisticToggles) {
      const serverLearned = serverStateMap.get(lineNumber) ?? false;
      if (serverLearned === optimisticLearned) {
        hasMatchingEntries = true;
        break;
      }
    }

    // Only clear if at least one optimistic entry matches server state
    if (hasMatchingEntries) {
      setOptimisticToggles(prev => {
        const next = new Map(prev);
        for (const [lineNumber, optimisticLearned] of prev) {
          const serverLearned = serverStateMap.get(lineNumber) ?? false;
          if (serverLearned === optimisticLearned) {
            next.delete(lineNumber);
          }
        }
        return next;
      });
    }
  }, [lineProgressFromConvex, optimisticToggles]);

  // Load user preferences
  const { data: userPreferences } = useSuspenseQuery(
    convexQuery(api.userPreferences.getUserPreferences, {})
  );
  const updatePreferencesMutation = useConvexMutation(api.userPreferences.updatePreferences);

  // Sort lyrics by lineNumber
  const sortedLyrics = useMemo(
    () => [...(lyrics || [])].sort((a, b) => a.lineNumber - b.lineNumber),
    [lyrics]
  );

  // Practice tracking
  const logPracticeMutation = useConvexMutation(api.practiceLog.logPractice);
  const recordLineCompletionMutation = useConvexMutation(api.songProgress.recordLineCompletion);
  const toggleLineLearnedMutation = useConvexMutation(api.songProgress.toggleLineLearned);
  const toggleWordLearnedMutation = useConvexMutation(api.wordProgress.toggleLearned);

  const [sessionCompletedLines, setSessionCompletedLines] = useState<Set<number>>(new Set());

  // Video player ref
  const playerRef = useRef<LocalVideoPlayerHandle>(null);

  // Seeking guard - ignore time updates while seeking
  const isSeekingRef = useRef(false);

  // Loop restart guard - prevents multiple loop triggers
  const isLoopingRef = useRef(false);

  // Practice time tracking
  const practiceSecondsRef = useRef(0);

  // Current line being played (for Loop/Single modes)
  const [currentLineIndex, setCurrentLineIndex] = useState<number | undefined>(undefined);

  // Active line (highlighted in UI based on video time)
  const [activeLineIndex, setActiveLineIndex] = useState<number | undefined>(undefined);

  // Click animation
  const [clickedLineIndex, setClickedLineIndex] = useState<number | undefined>(undefined);

  // Playback mode - always start in fluid mode
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("fluid");

  // Playback speed
  const [playbackSpeed, setPlaybackSpeed] = useState<string>(
    userPreferences?.playbackSpeed?.toString() || "1"
  );

  // Language filter
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>(
    (userPreferences?.languageFilter as LanguageFilter) || "all"
  );

  // Video mute state
  const [isVideoMuted, setIsVideoMuted] = useState(
    userPreferences?.videoMuted ?? true
  );

  // Video error state
  const [videoError, setVideoError] = useState<string | null>(null);

  // Video playing state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Word info modal state
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ModalLyricLine | null>(null);

  // Mobile video collapsed state
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(
    userPreferences?.videoCollapsed ?? true
  );

  // Track if preferences have been applied
  const [preferencesApplied, setPreferencesApplied] = useState(false);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Activity tracking for practice time
  const lastActivityRef = useRef<number>(Date.now());
  const IDLE_THRESHOLD_MS = 5000; // 5 seconds of no activity = idle

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track various activity types
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity, true);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity, true);
    };
  }, []);

  // Determine if we should count practice time
  // Count when: video playing (not fluid+muted) OR modal open
  const shouldCountTime = useMemo(() => {
    const isFluidMuted = playbackMode === "fluid" && isVideoMuted;
    const isActivelyPracticing = isVideoPlaying && !isFluidMuted;
    const isInModal = wordModalOpen;
    return isActivelyPracticing || isInModal;
  }, [playbackMode, isVideoMuted, isVideoPlaying, wordModalOpen]);

  // Practice time tracking - count and log every second, but only when active
  useEffect(() => {
    // Tick every second
    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const isActive = timeSinceActivity < IDLE_THRESHOLD_MS;

      // Only count if shouldCountTime AND user is active
      if (shouldCountTime && isActive) {
        practiceSecondsRef.current += 1;

        if (isAuthenticated) {
          // Authenticated: Log every second to DB for real-time header updates
          logPracticeMutation({
            eventType: "audio_time",
            value: 1,
          });
        } else {
          // Anonymous: Log to localStorage via useProgress hook
          logPracticeFn(1);
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      practiceSecondsRef.current = 0;
    };
  }, [shouldCountTime, isAuthenticated, logPracticeMutation, logPracticeFn]);

  // Sync state with loaded user preferences
  useEffect(() => {
    if (userPreferences) {
      setPlaybackSpeed(userPreferences.playbackSpeed?.toString() || "1");
      setLanguageFilter((userPreferences.languageFilter as LanguageFilter) || "all");
      setIsVideoMuted(userPreferences.videoMuted ?? true);
      setIsVideoCollapsed(userPreferences.videoCollapsed ?? true);
      setPreferencesApplied(true);
    }
  }, [userPreferences]);

  // For anonymous users, apply defaults and enable autoplay after brief delay
  useEffect(() => {
    if (!isAuthenticated && !preferencesApplied) {
      // Small delay to allow component to mount
      const timer = setTimeout(() => {
        setPreferencesApplied(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, preferencesApplied]);

  // Preference persistence functions
  const persistPlaybackSpeed = useCallback((speed: string) => {
    if (!isAuthenticated) return;
    updatePreferencesMutation({ playbackSpeed: parseFloat(speed) });
  }, [updatePreferencesMutation, isAuthenticated]);

  const persistLanguageFilter = useCallback((filter: LanguageFilter) => {
    if (!isAuthenticated) return;
    updatePreferencesMutation({ languageFilter: filter });
  }, [updatePreferencesMutation, isAuthenticated]);

  const persistPlaybackMode = useCallback((mode: PlaybackMode) => {
    if (!isAuthenticated) return;
    updatePreferencesMutation({ playbackMode: mode });
  }, [updatePreferencesMutation, isAuthenticated]);

  const persistVideoMuted = useCallback((muted: boolean) => {
    if (!isAuthenticated) return;
    updatePreferencesMutation({ videoMuted: muted });
  }, [updatePreferencesMutation, isAuthenticated]);

  const persistVideoCollapsed = useCallback((collapsed: boolean) => {
    if (!isAuthenticated) return;
    updatePreferencesMutation({ videoCollapsed: collapsed });
  }, [updatePreferencesMutation, isAuthenticated]);

  // Handle speed change - applies to video playback rate
  const handleSpeedChange = useCallback((speed: string) => {
    setPlaybackSpeed(speed);
    playerRef.current?.setPlaybackRate(parseFloat(speed));
    persistPlaybackSpeed(speed);
  }, [persistPlaybackSpeed]);

  // Handle playback mode change
  const handlePlaybackModeChange = useCallback((mode: PlaybackMode) => {
    setPlaybackMode(mode);

    if (mode === "fluid") {
      // Fluid mode: unmute video, continue playing
      setIsVideoMuted(false);
      persistVideoMuted(false);
      playerRef.current?.play();
      if (isMobile) {
        setIsVideoCollapsed(false);
        persistVideoCollapsed(false);
      }
    } else {
      // Loop/Single mode: start from current line, active line, or first line
      const lineIndexToPlay = currentLineIndex ?? activeLineIndex ?? 0;
      if (sortedLyrics[lineIndexToPlay]) {
        setCurrentLineIndex(lineIndexToPlay);
        setActiveLineIndex(lineIndexToPlay);
        isSeekingRef.current = true;
        playerRef.current?.seekTo(sortedLyrics[lineIndexToPlay].startTime);
        setTimeout(() => { isSeekingRef.current = false; }, 200);
        playerRef.current?.play();
      }
    }

    persistPlaybackMode(mode);
  }, [activeLineIndex, currentLineIndex, sortedLyrics, isMobile, persistPlaybackMode, persistVideoMuted, persistVideoCollapsed]);

  // Handle language filter change
  const handleLanguageFilterChange = useCallback((filter: LanguageFilter) => {
    setLanguageFilter(filter);
    persistLanguageFilter(filter);
  }, [persistLanguageFilter]);

  // Handle video collapsed toggle
  const handleVideoCollapsedToggle = useCallback(() => {
    const newCollapsed = !isVideoCollapsed;
    setIsVideoCollapsed(newCollapsed);
    persistVideoCollapsed(newCollapsed);
  }, [isVideoCollapsed, persistVideoCollapsed]);

  // Handle video mute change
  const handleVideoMuteChange = useCallback((muted: boolean) => {
    setIsVideoMuted(muted);
    persistVideoMuted(muted);
  }, [persistVideoMuted]);

  // Handle video error
  const handleVideoError = useCallback((error: string) => {
    setVideoError(error);
    console.warn('Local video error:', error);
  }, []);

  // Handle video state change
  const handleVideoStateChange = useCallback((state: 'playing' | 'paused' | 'ended') => {
    setIsVideoPlaying(state === 'playing');
  }, []);

  // Toggle pause/play
  const togglePlayPause = useCallback(() => {
    if (isVideoPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
  }, [isVideoPlaying]);

  // Click animation
  const triggerClickAnimation = useCallback((lineIndex: number) => {
    setClickedLineIndex(lineIndex);
    setTimeout(() => setClickedLineIndex(undefined), 300);
  }, []);

  // Handle line click - seek video to line
  const handleLineClick = useCallback(
    (startTime: number, lineIndex: number) => {
      // Record completion of previous line in Loop mode
      if (currentLineIndex !== undefined && currentLineIndex !== lineIndex && isAuthenticated && songId) {
        const previousLineNumber = sortedLyrics[currentLineIndex]?.lineNumber;
        if (previousLineNumber !== undefined && !sessionCompletedLines.has(previousLineNumber)) {
          recordLineCompletionMutation({
            songId: songId as Id<"songs">,
            lineNumber: previousLineNumber
          });
          setSessionCompletedLines(prev => new Set(prev).add(previousLineNumber));
        }
      }

      triggerClickAnimation(lineIndex);
      setActiveLineIndex(lineIndex);
      setCurrentLineIndex(lineIndex);

      // Reset loop guard when clicking a new line
      isLoopingRef.current = false;

      // Seek and play video with guard
      isSeekingRef.current = true;
      playerRef.current?.seekTo(startTime);
      setTimeout(() => { isSeekingRef.current = false; }, 200);
      playerRef.current?.play();

      // If in Fluid mode and video was muted, unmute it
      if (playbackMode === "fluid" && isVideoMuted) {
        setIsVideoMuted(false);
        persistVideoMuted(false);
      }
    },
    [triggerClickAnimation, sortedLyrics, playbackMode, isVideoMuted, persistVideoMuted, currentLineIndex, isAuthenticated, songId, sessionCompletedLines, recordLineCompletionMutation]
  );

  // Helper to seek with guard
  const seekTo = useCallback((time: number) => {
    isSeekingRef.current = true;
    playerRef.current?.seekTo(time);
    // Clear seeking flag after browser processes seek (200ms for safety)
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 200);
  }, []);

  // Handle time update - update active line based on video time
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      // Ignore time updates while seeking
      if (isSeekingRef.current) return;

      // In Loop/Single mode, lock activeLineIndex to currentLineIndex
      if (playbackMode !== "fluid" && currentLineIndex !== undefined) {
        // Keep highlight locked to current line
        if (activeLineIndex !== currentLineIndex) {
          setActiveLineIndex(currentLineIndex);
        }

        const currentLine = sortedLyrics[currentLineIndex];
        if (currentLine) {
          // Check if we've passed the end of the current line (with small buffer)
          if (currentTime >= currentLine.endTime - 0.05 && !isLoopingRef.current) {
            if (playbackMode === "loop") {
              // Prevent multiple loop triggers
              isLoopingRef.current = true;

              // Loop: seek back to start of line
              seekTo(currentLine.startTime);

              // Clear loop guard after seek is complete
              setTimeout(() => {
                isLoopingRef.current = false;
              }, 300);

              // Track loop completion
              if (isAuthenticated) {
                logPracticeMutation({ eventType: "line_loop", value: 1 });
              }
            } else {
              // Single: move to next line and pause
              const nextLineIndex = currentLineIndex + 1;
              if (nextLineIndex < sortedLyrics.length) {
                setCurrentLineIndex(nextLineIndex);
                setActiveLineIndex(nextLineIndex);
                seekTo(sortedLyrics[nextLineIndex].startTime);
              }
              playerRef.current?.pause();

              // Record line completion
              if (songId && !sessionCompletedLines.has(currentLine.lineNumber)) {
                recordLineCompletionMutation({
                  songId: songId as Id<"songs">,
                  lineNumber: currentLine.lineNumber
                });
                setSessionCompletedLines(prev => new Set(prev).add(currentLine.lineNumber));
              }
            }
          }
        }
      } else {
        // Fluid mode: highlight follows video time
        const lineIndex = sortedLyrics.findIndex(
          (line) => currentTime >= line.startTime && currentTime < line.endTime
        );

        if (lineIndex !== -1 && lineIndex !== activeLineIndex) {
          setActiveLineIndex(lineIndex);
        }
      }
    },
    [sortedLyrics, activeLineIndex, playbackMode, currentLineIndex, isAuthenticated, songId, sessionCompletedLines, logPracticeMutation, recordLineCompletionMutation, seekTo]
  );

  // Handle opening word info modal
  const handleLineInfoClick = useCallback((line: LyricLine) => {
    playerRef.current?.pause();

    const fullLyricData = sortedLyrics.find(l => l.lineNumber === line.lineNumber);

    setSelectedLine({
      lineNumber: line.lineNumber,
      original: line.original,
      transliteration: line.transliteration,
      hebrew: line.hebrew,
      english: line.english,
      audioSnippetUrl: fullLyricData?.audioSnippetUrl,
    });
    setWordModalOpen(true);
  }, [sortedLyrics]);

  // Handle closing word info modal
  const handleWordModalClose = useCallback(() => {
    setWordModalOpen(false);

    // Resume playback
    if (selectedLine) {
      const lineIndex = sortedLyrics.findIndex(l => l.lineNumber === selectedLine.lineNumber);
      if (lineIndex !== -1) {
        setCurrentLineIndex(lineIndex);
        setActiveLineIndex(lineIndex);
        isSeekingRef.current = true;
        playerRef.current?.seekTo(sortedLyrics[lineIndex].startTime);
        setTimeout(() => { isSeekingRef.current = false; }, 200);
        playerRef.current?.play();
      }
    }
  }, [selectedLine, sortedLyrics]);

  // Handle checkbox toggle for line learned state
  const handleLineCheckboxClick = useCallback((lineNumber: number) => {
    if (isAuthenticated) {
      // Optimistic update: determine current state and toggle it
      const currentProgress = lineProgressFromConvex?.find((p: typeof lineProgressFromConvex[0]) => p.lineNumber === lineNumber);
      const currentlyLearned = optimisticToggles.has(lineNumber)
        ? optimisticToggles.get(lineNumber)
        : currentProgress?.learned ?? false;
      const newLearnedState = !currentlyLearned;

      // Set optimistic state immediately for instant UI feedback
      setOptimisticToggles(prev => {
        const next = new Map(prev);
        next.set(lineNumber, newLearnedState);
        return next;
      });

      // Authenticated: use Convex mutation
      toggleLineLearnedMutation({ songId, lineNumber });
    } else {
      // Anonymous: use localStorage via useProgress hook (already instant)
      toggleLineLearnedFn(songId, lineNumber);
    }
  }, [isAuthenticated, toggleLineLearnedMutation, songId, toggleLineLearnedFn, lineProgressFromConvex, optimisticToggles]);

  // Handle word learned toggle
  const handleToggleWordLearned = useCallback((wordId: Id<"words">, persian: string) => {
    if (isAuthenticated) {
      // Authenticated: use Convex mutation
      toggleWordLearnedMutation({ wordId, persian }).then((newLearnedState) => {
        if (newLearnedState) {
          logPracticeMutation({ eventType: "word_learned", value: 1 });
        }
      });
    } else {
      // Anonymous: use localStorage via useProgress hook
      toggleWordLearnedFn(persian, wordId);
    }
  }, [isAuthenticated, toggleWordLearnedMutation, logPracticeMutation, toggleWordLearnedFn]);

  // Spacebar for pause/play
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault();
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  // On desktop, prevent page scroll - only lyrics should scroll
  useEffect(() => {
    if (!isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile]);

  if (!song) {
    throw notFound();
  }

  return (
    <div className="bg-gray-900 text-white h-[calc(100vh-57px)] sm:h-[calc(100vh-69px)] flex flex-col lg:flex-row">
      {/* LEFT: Video section */}
      <div className="lg:w-1/2 lg:border-r lg:border-gray-800 flex-shrink-0">
          {/* Mobile: Collapsible Header - use div instead of button to allow nested buttons */}
            {isMobile && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleVideoCollapsedToggle}
                onKeyDown={(e) => e.key === 'Enter' && handleVideoCollapsedToggle()}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Video className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <h1 className="text-sm font-bold truncate iran-gradient">{song.title}</h1>
                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <WishlistButton songId={songId} size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isVideoCollapsed && (
                    <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                      <ToggleGroup
                        type="single"
                        value={playbackMode}
                        onValueChange={(value) => value && handlePlaybackModeChange(value as PlaybackMode)}
                        className="bg-gray-900 rounded p-0.5"
                      >
                        <ToggleGroupItem value="single" aria-label="Single" className="px-2 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                          <Square className="h-3 w-3" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="loop" aria-label="Loop" className="px-2 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                          <Repeat className="h-3 w-3" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="fluid" aria-label="Fluid" className="px-2 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                          <Waves className="h-3 w-3" />
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}
                  {isVideoCollapsed ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
            )}

            {/* Desktop: Song title */}
            {!isMobile && (
              <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold iran-gradient">{song.title}</h1>
                  <p className="text-sm text-gray-400">{song.artist}</p>
                </div>
                <WishlistButton songId={songId} size="md" />
              </div>
            )}

            {/* Video player */}
            {(!isMobile || !isVideoCollapsed) && (
              <div className={`p-4 pb-2 ${isMobile ? 'pt-2' : ''}`}>
                {song.videoUrl && !videoError ? (
                  <LocalVideoPlayer
                    ref={playerRef}
                    videoUrl={song.videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onStateChange={handleVideoStateChange}
                    onError={handleVideoError}
                    onMuteChange={handleVideoMuteChange}
                    muted={isVideoMuted}
                    autoplay={preferencesApplied && playbackMode === "fluid"}
                    showMuteButton={true}
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                    <div className="text-center p-4">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold">Video not available</p>
                      <p className="text-sm mt-1">{videoError || 'Local video file not found'}</p>
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
            )}

            {/* Controls */}
            {(!isMobile || !isVideoCollapsed) && (
              <div className="px-4 pb-4">
                {/* Mobile: Current Line Indicator */}
                <div className="md:hidden mb-2">
                  <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2 border border-gray-700">
                    <span className="rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary whitespace-nowrap">
                      {currentLineIndex !== undefined ? `Line ${currentLineIndex + 1}` : 'Select a line'}
                    </span>
                    {currentLineIndex !== undefined && sortedLyrics[currentLineIndex] && (
                      <span className="text-xs text-gray-400 truncate flex-1" dir={isRTLLanguage(song.sourceLanguage) ? "rtl" : "ltr"}>
                        {sortedLyrics[currentLineIndex].original}
                      </span>
                    )}
                    {currentLineIndex === undefined && (
                      <span className="text-xs text-gray-500 italic">
                        Tap a lyric line below to start
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg bg-gray-800 p-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
                  {/* Pause/Play Button */}
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                    title={isVideoPlaying ? "Pause (Space)" : "Play (Space)"}
                  >
                    {isVideoPlaying ? (
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

                  {/* Desktop: Current Line Indicator */}
                  {currentLineIndex !== undefined && (
                    <div className="hidden md:flex items-center gap-2">
                      <span className="rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                        Line {currentLineIndex + 1}
                      </span>
                    </div>
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
                      <ToggleGroupItem value="single" aria-label="Single play mode" className="px-3 py-1.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                        <Square className="h-3 w-3 mr-1" />
                        Single
                      </ToggleGroupItem>
                      <ToggleGroupItem value="loop" aria-label="Loop mode" className="px-3 py-1.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                        <Repeat className="h-3 w-3 mr-1" />
                        Loop
                      </ToggleGroupItem>
                      <ToggleGroupItem value="fluid" aria-label="Fluid play mode" className="px-3 py-1.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                        <Waves className="h-3 w-3 mr-1" />
                        Fluid
                      </ToggleGroupItem>
                    </ToggleGroup>
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
                    <Select value={languageFilter} onValueChange={handleLanguageFilterChange}>
                      <SelectTrigger className="w-36 border-gray-700 bg-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-gray-700 bg-gray-900">
                        <SelectItem value="all">All Languages</SelectItem>
                        <SelectItem value="persian">{getLanguageDisplayName(song.sourceLanguage)} Only</SelectItem>
                        <SelectItem value="transliteration">Transliteration</SelectItem>
                        <SelectItem value="hebrew">Hebrew Only</SelectItem>
                        <SelectItem value="english">English Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* RIGHT: Lyrics section - scrolls */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* CTA banner for anonymous users with progress */}
        <AnonymousProgressBanner />
        <LyricsDisplay
          songId={songId}
          sourceLanguage={song.sourceLanguage}
          onLineClick={handleLineClick}
          onLineInfoClick={handleLineInfoClick}
          onLineCheckboxClick={handleLineCheckboxClick}
          activeLineIndex={activeLineIndex}
          clickedLineIndex={clickedLineIndex}
          languageFilter={languageFilter}
          lineProgress={lineProgress || []}
        />
      </div>

      {/* Word Info Modal */}
      <WordInfoModal
        isOpen={wordModalOpen}
        onClose={handleWordModalClose}
        line={selectedLine}
        songId={songId}
        sourceLanguage={song.sourceLanguage}
        isMobile={isMobile}
        lineAudioUrl={selectedLine?.audioSnippetUrl}
        onToggleLearned={handleToggleWordLearned}
      />
    </div>
  );
}
