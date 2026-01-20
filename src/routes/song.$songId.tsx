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
import { useAudioPreloader } from "../hooks/useAudioPreloader";
import { useVisitorId } from "../hooks/useVisitorId";
import { useConvexMutation } from "@convex-dev/react-query";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Repeat, Languages, Volume2, Video, Play, Square, Waves, Pause, ChevronDown, ChevronUp } from "lucide-react";
import { WishlistButton } from "../components/WishlistButton";

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

  // Get visitor ID and line progress for visual states
  const visitorId = useVisitorId();
  const { data: lineProgress } = useSuspenseQuery(
    convexQuery(api.songProgress.getLineProgressBySong, { visitorId, songId })
  );

  // Load user preferences
  const { data: userPreferences } = useSuspenseQuery(
    convexQuery(api.userPreferences.getByVisitor, { visitorId })
  );
  const updatePreferencesMutation = useConvexMutation(api.userPreferences.updatePreferences);

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

  // Practice tracking state and logic
  const logPracticeMutation = useConvexMutation(api.practiceLog.logPractice);
  const recordLineCompletionMutation = useConvexMutation(api.songProgress.recordLineCompletion);
  const toggleLineLearnedMutation = useConvexMutation(api.songProgress.toggleLineLearned);
  const toggleWordLearnedMutation = useConvexMutation(api.wordProgress.toggleLearned);
  
  // Track accumulated practice time (in seconds)
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [accumulatedSilentTime, setAccumulatedSilentTime] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());
  const audioStartTimeRef = useRef<number | null>(null);
  const silentStartTimeRef = useRef<number>(Date.now());
  
  // Track lines completed in this session (for deduplication)
  const [sessionCompletedLines, setSessionCompletedLines] = useState<Set<number>>(new Set());
  
  // Track which line is currently playing for completion recording
  const currentPlayingLineRef = useRef<number | null>(null);
  
  // Reset accumulated time after 2 minutes of inactivity
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes
      
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        setAccumulatedTime(0);
        setAccumulatedSilentTime(0);
        silentStartTimeRef.current = now;
      }
    };
    
    const interval = setInterval(checkInactivity, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Track silent time (when not playing audio) and log periodically
  useEffect(() => {
    const trackSilentTime = () => {
      // Only track silent time if no audio is currently playing
      if (!audioStartTimeRef.current) {
        const now = Date.now();
        const silentDuration = (now - silentStartTimeRef.current) / 1000;
        const newAccumulatedSilentTime = accumulatedSilentTime + silentDuration;
        
        setAccumulatedSilentTime(newAccumulatedSilentTime);
        silentStartTimeRef.current = now;
        
        // Log silent time in batches of 60+ seconds (1 minute)
        if (newAccumulatedSilentTime >= 60 && visitorId) {
          logPracticeMutation({
            visitorId,
            eventType: "silent_time",
            value: Math.floor(newAccumulatedSilentTime)
          });
          setAccumulatedSilentTime(0); // Reset after logging
        }
      }
    };
    
    const interval = setInterval(trackSilentTime, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [accumulatedSilentTime, visitorId, logPracticeMutation]);
  
  // Handle audio snippet completion - track practice time and log if needed
  const handleAudioEnded = useCallback((lineNumber: number) => {
    if (audioStartTimeRef.current) {
      const audioDuration = (Date.now() - audioStartTimeRef.current) / 1000;
      const newAccumulatedTime = accumulatedTime + audioDuration;
      
      setAccumulatedTime(newAccumulatedTime);
      lastActivityRef.current = Date.now();
      
      // Log practice in batches of 30+ seconds
      if (newAccumulatedTime >= 30 && visitorId) {
        logPracticeMutation({
          visitorId,
          eventType: "audio_time",
          value: Math.floor(newAccumulatedTime)
        });
        setAccumulatedTime(0); // Reset after logging
      }
    }
    
    // Record line completion using the lineNumber from the audio hook
    if (visitorId && songId) {
      if (!sessionCompletedLines.has(lineNumber)) {
        recordLineCompletionMutation({
          visitorId,
          songId: songId as Id<"songs">,
          lineNumber
        });
        setSessionCompletedLines(prev => new Set(prev).add(lineNumber));
      }
    }
    
    audioStartTimeRef.current = null;
    currentPlayingLineRef.current = null;
  }, [accumulatedTime, visitorId, logPracticeMutation, songId, sessionCompletedLines, recordLineCompletionMutation]);
  
  // Track when audio starts playing
  const trackAudioStart = useCallback(() => {
    audioStartTimeRef.current = Date.now();
    lastActivityRef.current = Date.now();
    // Reset silent time tracking when audio starts
    silentStartTimeRef.current = Date.now();
  }, []);

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
  } = useAudioPreloader(audioSnippets, handleAudioEnded);

  const playerRef = useRef<LocalVideoPlayerHandle>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number | undefined>(
    undefined
  );
  const [clickedLineIndex, setClickedLineIndex] = useState<number | undefined>(
    undefined
  );

  // Ref to track when we're seeking for a loop restart (prevents line flash during seek)
  const isLoopSeekingRef = useRef(false);

  // Ref to track the "target" line index during seeking - used to prevent wrong line detection
  // due to keyframe seeking landing slightly before the requested time
  const targetLineIndexRef = useRef<number | undefined>(undefined);

  // Playback mode state: single, loop, or fluid - initialize from preferences
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(
    (userPreferences?.playbackMode as PlaybackMode) || "fluid"
  );
  const [currentLineIndex, setCurrentLineIndex] = useState<number | undefined>(
    undefined
  );

  // Playback speed state - initialize from preferences
  const [playbackSpeed, setPlaybackSpeed] = useState<string>(
    userPreferences?.playbackSpeed?.toString() || "1"
  );

  // Language filter state - initialize from preferences
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>(
    (userPreferences?.languageFilter as LanguageFilter) || "all"
  );

  // Video mute state - initialize from preferences
  const [isVideoMuted, setIsVideoMuted] = useState(
    userPreferences?.videoMuted ?? true
  );

  // Video error state - for fallback handling
  const [videoError, setVideoError] = useState<string | null>(null);

  // Video playing state - for pause/play control
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Word info modal state
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ModalLyricLine | null>(null);

  // Mobile video collapsed state - initialize from preferences
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(
    userPreferences?.videoCollapsed ?? true
  );

  // Detect if mobile (viewport width < 768px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync state with loaded user preferences
  useEffect(() => {
    if (userPreferences) {
      setPlaybackSpeed(userPreferences.playbackSpeed?.toString() || "1");
      setLanguageFilter((userPreferences.languageFilter as LanguageFilter) || "all");
      setPlaybackMode((userPreferences.playbackMode as PlaybackMode) || "fluid");
      setIsVideoMuted(userPreferences.videoMuted ?? true);
      setIsVideoCollapsed(userPreferences.videoCollapsed ?? true);
    }
  }, [userPreferences]);

  // Preference persistence functions
  const persistPlaybackSpeed = useCallback((speed: string) => {
    updatePreferencesMutation({
      visitorId,
      playbackSpeed: parseFloat(speed)
    });
  }, [updatePreferencesMutation, visitorId]);

  const persistLanguageFilter = useCallback((filter: LanguageFilter) => {
    updatePreferencesMutation({
      visitorId,
      languageFilter: filter
    });
  }, [updatePreferencesMutation, visitorId]);

  const persistPlaybackMode = useCallback((mode: PlaybackMode) => {
    updatePreferencesMutation({
      visitorId,
      playbackMode: mode
    });
  }, [updatePreferencesMutation, visitorId]);

  const persistVideoMuted = useCallback((muted: boolean) => {
    updatePreferencesMutation({
      visitorId,
      videoMuted: muted
    });
  }, [updatePreferencesMutation, visitorId]);

  const persistVideoCollapsed = useCallback((collapsed: boolean) => {
    updatePreferencesMutation({
      visitorId,
      videoCollapsed: collapsed
    });
  }, [updatePreferencesMutation, visitorId]);

  // Wrapper for playAudioSnippet that includes tracking
  const playAudioSnippetWithTracking = useCallback((lineNumber: number) => {
    trackAudioStart();
    currentPlayingLineRef.current = lineNumber;
    playAudioSnippet(lineNumber);
  }, [trackAudioStart, playAudioSnippet]);

  const handleSpeedChange = useCallback((speed: string) => {
    setPlaybackSpeed(speed);
    // Update both video and audio playback rate
    playerRef.current?.setPlaybackRate(parseFloat(speed));
    setAudioPlaybackRate(parseFloat(speed));
    // Persist to database
    persistPlaybackSpeed(speed);
  }, [setAudioPlaybackRate, persistPlaybackSpeed]);

  // Handle playback mode change
  const handlePlaybackModeChange = useCallback((mode: PlaybackMode) => {
    const previousMode = playbackMode;
    setPlaybackMode(mode);

    // Apply video mute/unmute behavior immediately based on mode
    if (mode === "fluid") {
      // Fluid mode: unmute video (unless user has manually muted it)
      if (!isVideoMuted) {
        playerRef.current?.unmute();
      }
      // Switching TO Fluid mode: continue playing video
      playerRef.current?.play();
      // Auto-expand video on mobile when switching to Fluid mode
      if (isMobile) {
        setIsVideoCollapsed(false);
        persistVideoCollapsed(false);
      }
    } else {
      // Single/Loop mode: mute video (snippet audio will play instead)
      playerRef.current?.mute();
      
      if (previousMode === "fluid") {
        // Switching FROM Fluid TO Single/Loop mode
        // Stay at current line position and trigger the snippet
        if (activeLineIndex !== undefined) {
          const lineNumber = sortedLyrics[activeLineIndex]?.lineNumber;
          if (lineNumber !== undefined && audioReady) {
            setCurrentLineIndex(activeLineIndex);
            // Set target line index to prevent wrong line detection during seek
            targetLineIndexRef.current = activeLineIndex;
            playAudioSnippetWithTracking(lineNumber);
            // Keep video in sync
            playerRef.current?.seekTo(sortedLyrics[activeLineIndex].startTime);
            playerRef.current?.play();
          }
        }
      }
    }

    // Update audio loop based on mode
    setAudioLoop(mode === "loop");

    // Persist to database
    persistPlaybackMode(mode);
  }, [playbackMode, setAudioLoop, activeLineIndex, sortedLyrics, audioReady, playAudioSnippetWithTracking, isMobile, isVideoMuted, persistPlaybackMode, persistVideoCollapsed]);

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

  // Handle video mute change from player controls
  const handleVideoMuteChange = useCallback((muted: boolean) => {
    setIsVideoMuted(muted);
    persistVideoMuted(muted);
  }, [persistVideoMuted]);

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

      // Set seeking flag to prevent handleTimeUpdate from overwriting our line selection
      // This is critical to avoid the "wrong line flash" bug
      isLoopSeekingRef.current = true;

      // Set the target line index - this tells handleTimeUpdate to use this line
      // even if the video seeks to a time slightly before startTime (keyframe seeking)
      targetLineIndexRef.current = lineIndex;

      // Trigger visual feedback
      triggerClickAnimation(lineIndex);
      // Set as active line
      setActiveLineIndex(lineIndex);
      // Set as current line for looping/single mode
      setCurrentLineIndex(lineIndex);

      // Seek video to match the line
      playerRef.current?.seekTo(startTime);

      // Clear seeking flag after seek completes - increased timeout to prevent flash
      // 200ms gives enough time for video seeking and time update events to stabilize
      // before allowing normal line detection to resume
      setTimeout(() => {
        isLoopSeekingRef.current = false;
      }, 200);

      // Handle differently based on playback mode
      if (playbackMode === "fluid") {
        // Fluid mode: video plays with audio, continue playing after seek
        playerRef.current?.play();
      } else {
        // Single/Loop mode: video muted, audio from snippet
        // Play local audio snippet if available (instant playback)
        if (lineNumber !== undefined && audioReady) {
          playAudioSnippetWithTracking(lineNumber);
        }
        // Also play video (muted) to keep visual in sync
        playerRef.current?.play();
      }
    },
    [triggerClickAnimation, sortedLyrics, audioReady, playAudioSnippetWithTracking, playbackMode]
  );

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      // Skip line updates during loop restart seek to prevent visual flash
      if (isLoopSeekingRef.current) {
        return;
      }

      // Find which line's time range contains currentTime
      // Use startTime <= currentTime < endTime for consistent boundaries
      const calculatedLineIndex = sortedLyrics.findIndex(
        (line) => currentTime >= line.startTime && currentTime < line.endTime
      );

      // If we have a target line index (from clicking or loop restart),
      // use it until we're safely within the target line's time range.
      // This prevents the "wrong line flash" bug caused by:
      // 1. Keyframe seeking landing slightly before the requested time
      // 2. Time update events firing during the seek operation
      // 3. Loop restart triggering at endTime before seek completes
      if (targetLineIndexRef.current !== undefined) {
        const targetLine = sortedLyrics[targetLineIndexRef.current];
        if (targetLine) {
          // Check if we're clearly within the target line's time range
          // (past the start time AND before the end time)
          const withinTargetLine = currentTime >= targetLine.startTime && currentTime < targetLine.endTime;

          if (withinTargetLine && calculatedLineIndex === targetLineIndexRef.current) {
            // We're within the target line AND detection agrees - safe to clear
            targetLineIndexRef.current = undefined;
            // Update active line if needed and fall through
            if (calculatedLineIndex !== activeLineIndex) {
              setActiveLineIndex(calculatedLineIndex);
            }
            return;
          } else {
            // Either:
            // 1. We haven't reached the target line's start time yet (seeking)
            // 2. We're at/past the end time (loop restart about to fire)
            // 3. Detection disagrees with target (keyframe seek landed wrong)
            // In all cases, keep using the target line to prevent flashing
            if (targetLineIndexRef.current !== activeLineIndex) {
              setActiveLineIndex(targetLineIndexRef.current);
            }
            return;
          }
        }
      }

      // Normal time-based detection (target is cleared or never set)
      if (calculatedLineIndex !== -1 && calculatedLineIndex !== activeLineIndex) {
        setActiveLineIndex(calculatedLineIndex);
      }
    },
    [sortedLyrics, activeLineIndex]
  );

  // Handle opening word info modal
  const handleLineInfoClick = useCallback((line: LyricLine) => {
    // Find the full lyric data to get audioSnippetUrl
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

  // Handle checkbox toggle for line learned state
  const handleLineCheckboxClick = useCallback((lineNumber: number) => {
    toggleLineLearnedMutation({ visitorId, songId, lineNumber });
  }, [toggleLineLearnedMutation, visitorId, songId]);

  // Handle word learned toggle and track for scoring
  const handleToggleWordLearned = useCallback((wordId: Id<"words">, persian: string) => {
    if (visitorId) {
      toggleWordLearnedMutation({ visitorId, wordId, persian }).then((newLearnedState) => {
        // Track word learned event for scoring (only when marking as learned, not unmarking)
        if (newLearnedState) {
          logPracticeMutation({
            visitorId,
            eventType: "word_learned",
            value: 1
          });
        }
      });
    }
  }, [toggleWordLearnedMutation, logPracticeMutation, visitorId]);

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
          // Set flag to prevent line flashing during seek
          isLoopSeekingRef.current = true;
          // Set the target line index - this prevents handleTimeUpdate from
          // showing the wrong line if video keyframe seeking lands before startTime
          targetLineIndexRef.current = currentLineIndex;
          player.seekTo(currentLine.startTime);
          // Clear flag after seek completes - increased timeout to prevent flash
          // 200ms gives enough time for video seeking and time update events to stabilize
          // before allowing normal line detection to resume
          setTimeout(() => {
            isLoopSeekingRef.current = false;
          }, 200);
          
          // Track loop completion for scoring
          if (visitorId) {
            logPracticeMutation({
              visitorId,
              eventType: "line_loop",
              value: 1
            });
          }
        } else {
          // Single mode: advance to next line and pause
          const nextLineIndex = currentLineIndex + 1;
          if (nextLineIndex < sortedLyrics.length) {
            // Advance to next line
            const nextLine = sortedLyrics[nextLineIndex];
            setCurrentLineIndex(nextLineIndex);
            setActiveLineIndex(nextLineIndex);
            targetLineIndexRef.current = nextLineIndex;
            player.seekTo(nextLine.startTime);
          }
          // Pause at the new position (or current if at last line)
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

  // Note: Auto-play is now handled directly by LocalVideoPlayer component
  // via the autoplay prop when playbackMode === "fluid"

  if (!song) {
    throw notFound();
  }

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col overflow-hidden bg-gray-900 text-white">
      {/* Main content - side by side on desktop (lg+) */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* LEFT: Player section (50% on desktop, collapsible on mobile) */}
        <div className={`flex-shrink-0 lg:w-1/2 lg:h-full lg:overflow-y-auto lg:border-r lg:border-gray-800 ${isMobile && isVideoCollapsed ? '' : ''}`}>
          <div className="lg:sticky lg:top-0">
            {/* Mobile: Collapsible Header Bar */}
            {isMobile && (
              <button
                onClick={handleVideoCollapsedToggle}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Video className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <h1 className="text-sm font-bold truncate iran-gradient">{song.title}</h1>
                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                  </div>
                  {/* Wishlist button */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <WishlistButton songId={songId} size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Compact mode toggle when collapsed */}
                  {isVideoCollapsed && (
                    <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                      <ToggleGroup
                        type="single"
                        value={playbackMode}
                        onValueChange={(value) => value && handlePlaybackModeChange(value as PlaybackMode)}
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
                  {isVideoCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>
            )}

            {/* Desktop: Song title (always visible) */}
            {!isMobile && (
              <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold iran-gradient">{song.title}</h1>
                  <p className="text-sm text-gray-400">{song.artist}</p>
                </div>
                <WishlistButton songId={songId} size="md" />
              </div>
            )}

            {/* Player - hidden on mobile when collapsed */}
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
                    muted={isVideoMuted || playbackMode !== "fluid"}
                    autoplay={playbackMode === "fluid"}
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
            )}

            {/* Controls - shown on desktop always, on mobile only when expanded */}
            {(!isMobile || !isVideoCollapsed) && (
              <div className="px-4 pb-4">
                {/* Mobile: Current Line Indicator - always visible on its own row */}
                <div className="md:hidden mb-2">
                  <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2 border border-gray-700">
                    <span className="rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary whitespace-nowrap">
                      {currentLineIndex !== undefined ? `Line ${currentLineIndex + 1}` : 'Select a line'}
                    </span>
                    {currentLineIndex !== undefined && sortedLyrics[currentLineIndex] && (
                      <span className="text-xs text-gray-400 truncate flex-1" dir="rtl">
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

                  {/* Desktop: Current Line Indicator - inline with other controls */}
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
                      onValueChange={handleLanguageFilterChange}
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
            )}
          </div>
        </div>

        {/* RIGHT: Scrollable lyrics (50% on desktop) */}
        <div className="flex-1 lg:w-1/2 overflow-y-auto px-4 py-4">
          <LyricsDisplay
            songId={songId}
            visitorId={visitorId}
            onLineClick={handleLineClick}
            onLineInfoClick={handleLineInfoClick}
            onLineCheckboxClick={handleLineCheckboxClick}
            activeLineIndex={activeLineIndex}
            clickedLineIndex={clickedLineIndex}
            languageFilter={languageFilter}
            lineProgress={lineProgress || []}
          />
        </div>
      </div>

      {/* Word Info Modal */}
      <WordInfoModal
        isOpen={wordModalOpen}
        onClose={() => setWordModalOpen(false)}
        line={selectedLine}
        songId={songId}
        isMobile={isMobile}
        lineAudioUrl={selectedLine?.audioSnippetUrl}
        onToggleLearned={handleToggleWordLearned}
      />
    </div>
  );
}
