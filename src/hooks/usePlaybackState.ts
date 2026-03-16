import { useRef, useState, useCallback, useEffect } from "react";
import { Id } from "@convex/_generated/dataModel";
import { LanguageFilter, LyricLine } from "../components/LyricsDisplay";
import { LocalVideoPlayerHandle } from "../components/LocalVideoPlayer";
import { ModalLyricLine } from "../components/WordInfoModal";

export type PlaybackMode = "single" | "loop" | "fluid";

interface SortedLyric {
  startTime: number;
  endTime: number;
  lineNumber: number;
  original: string;
  audioSnippetUrl?: string;
  transliteration?: string;
  hebrew?: string;
  english?: string;
}

interface UsePlaybackStateParams {
  sortedLyrics: SortedLyric[];
  songId: Id<"songs">;
  song: {
    videoUrl?: string;
    youtubeId?: string;
    sourceLanguage: string;
  };
  isAuthenticated: boolean;
  userPreferences: {
    playbackSpeed?: number;
    languageFilter?: string;
    videoMuted?: boolean;
    videoCollapsed?: boolean;
    playbackMode?: string;
  } | null;
  updatePreferencesMutation: (
    args: Record<string, unknown>,
  ) => Promise<unknown>;
  logPracticeMutation: (args: {
    eventType: "word_learned" | "line_loop" | "audio_time" | "silent_time";
    value: number;
  }) => Promise<unknown>;
  recordLineCompletionMutation: (args: {
    songId: Id<"songs">;
    lineNumber: number;
  }) => Promise<unknown>;
}

export interface UsePlaybackStateReturn {
  // State
  mode: PlaybackMode;
  isPlaying: boolean;
  activeLineIndex: number | undefined;
  currentLineIndex: number | undefined;
  clickedLineIndex: number | undefined;
  playbackSpeed: string;
  isMuted: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  preferencesApplied: boolean;
  videoError: string | null;
  showSpaceHint: boolean;
  languageFilter: LanguageFilter;
  wordModalOpen: boolean;
  selectedLine: ModalLyricLine | null;

  // Handlers
  handlePlaybackModeChange: (mode: PlaybackMode) => void;
  togglePlayPause: () => void;
  handleSpeedChange: (speed: string) => void;
  handleVideoMuteChange: (muted: boolean) => void;
  handleVideoCollapsedToggle: () => void;
  handleLineClick: (startTime: number, lineIndex: number) => void;
  handleTimeUpdate: (currentTime: number) => void;
  handleVideoStateChange: (state: "playing" | "paused" | "ended") => void;
  handleVideoError: (error: string) => void;
  handleLanguageFilterChange: (filter: LanguageFilter) => void;
  handleLineInfoClick: (line: LyricLine) => void;
  handleWordModalClose: () => void;

  // Refs
  playerRef: React.RefObject<LocalVideoPlayerHandle | null>;
}

export function usePlaybackState({
  sortedLyrics,
  songId,
  isAuthenticated,
  userPreferences,
  updatePreferencesMutation,
  logPracticeMutation,
  recordLineCompletionMutation,
}: UsePlaybackStateParams): UsePlaybackStateReturn {
  // Video player ref
  const playerRef = useRef<LocalVideoPlayerHandle>(null);

  // Session completed lines — tracks which lines user has completed this session
  const [sessionCompletedLines, setSessionCompletedLines] = useState<
    Set<number>
  >(new Set());

  // Seeking guard — ignore time updates while seeking
  const isSeekingRef = useRef(false);

  // Loop restart guard — prevents multiple loop triggers
  const isLoopingRef = useRef(false);

  // Current line being played (for Loop/Single modes)
  const [currentLineIndex, setCurrentLineIndex] = useState<number | undefined>(
    undefined,
  );

  // Active line (highlighted in UI based on video time)
  const [activeLineIndex, setActiveLineIndex] = useState<number | undefined>(
    undefined,
  );

  // Click animation
  const [clickedLineIndex, setClickedLineIndex] = useState<number | undefined>(
    undefined,
  );

  // Playback mode — always start in fluid mode
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("fluid");

  // Playback speed
  const [playbackSpeed, setPlaybackSpeed] = useState<string>(
    userPreferences?.playbackSpeed?.toString() || "1",
  );

  // Language filter
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>(
    (userPreferences?.languageFilter as LanguageFilter) || "all",
  );

  // Video mute state
  const [isVideoMuted, setIsVideoMuted] = useState(
    userPreferences?.videoMuted ?? true,
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
    userPreferences?.videoCollapsed ?? true,
  );

  // Track if preferences have been applied
  const [preferencesApplied, setPreferencesApplied] = useState(false);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard shortcut hint (desktop only, dismisses after first interaction)
  const [showSpaceHint, setShowSpaceHint] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("songscript-space-hint-dismissed");
  });

  // Auto-dismiss after 8 seconds or on first spacebar press
  useEffect(() => {
    if (!showSpaceHint || isMobile) return;
    const timer = setTimeout(() => {
      setShowSpaceHint(false);
      localStorage.setItem("songscript-space-hint-dismissed", "1");
    }, 8000);
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setShowSpaceHint(false);
        localStorage.setItem("songscript-space-hint-dismissed", "1");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [showSpaceHint, isMobile]);

  // Sync state with loaded user preferences
  useEffect(() => {
    if (userPreferences) {
      setPlaybackSpeed(userPreferences.playbackSpeed?.toString() || "1");
      const rawFilter = userPreferences.languageFilter || "all";
      setLanguageFilter(
        (rawFilter === "persian" ? "source" : rawFilter) as LanguageFilter,
      );
      setIsVideoMuted(userPreferences.videoMuted ?? true);
      setIsVideoCollapsed(userPreferences.videoCollapsed ?? true);
      setPreferencesApplied(true);
    }
  }, [userPreferences]);

  // For anonymous users, apply defaults and enable autoplay after brief delay
  useEffect(() => {
    if (!isAuthenticated && !preferencesApplied) {
      const timer = setTimeout(() => {
        setPreferencesApplied(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, preferencesApplied]);

  // Preference persistence functions
  const persistPlaybackSpeed = useCallback(
    (speed: string) => {
      if (!isAuthenticated) return;
      updatePreferencesMutation({ playbackSpeed: parseFloat(speed) });
    },
    [updatePreferencesMutation, isAuthenticated],
  );

  const persistLanguageFilter = useCallback(
    (filter: LanguageFilter) => {
      if (!isAuthenticated) return;
      updatePreferencesMutation({ languageFilter: filter });
    },
    [updatePreferencesMutation, isAuthenticated],
  );

  const persistPlaybackMode = useCallback(
    (mode: PlaybackMode) => {
      if (!isAuthenticated) return;
      updatePreferencesMutation({ playbackMode: mode });
    },
    [updatePreferencesMutation, isAuthenticated],
  );

  const persistVideoMuted = useCallback(
    (muted: boolean) => {
      if (!isAuthenticated) return;
      updatePreferencesMutation({ videoMuted: muted });
    },
    [updatePreferencesMutation, isAuthenticated],
  );

  const persistVideoCollapsed = useCallback(
    (collapsed: boolean) => {
      if (!isAuthenticated) return;
      updatePreferencesMutation({ videoCollapsed: collapsed });
    },
    [updatePreferencesMutation, isAuthenticated],
  );

  // Handle speed change
  const handleSpeedChange = useCallback(
    (speed: string) => {
      setPlaybackSpeed(speed);
      playerRef.current?.setPlaybackRate(parseFloat(speed));
      persistPlaybackSpeed(speed);
    },
    [persistPlaybackSpeed],
  );

  // Handle playback mode change
  const handlePlaybackModeChange = useCallback(
    (mode: PlaybackMode) => {
      setPlaybackMode(mode);

      if (mode === "fluid") {
        setIsVideoMuted(false);
        persistVideoMuted(false);
        playerRef.current?.play();
        if (isMobile) {
          setIsVideoCollapsed(false);
          persistVideoCollapsed(false);
        }
      } else {
        // Loop/Single mode: prefer live position over last-clicked line
        const lineIndexToPlay = activeLineIndex ?? currentLineIndex ?? 0;
        if (sortedLyrics[lineIndexToPlay]) {
          setCurrentLineIndex(lineIndexToPlay);
          setActiveLineIndex(lineIndexToPlay);
          isSeekingRef.current = true;
          playerRef.current?.seekTo(sortedLyrics[lineIndexToPlay].startTime);
          setTimeout(() => {
            isSeekingRef.current = false;
          }, 200);
          playerRef.current?.play();
        }
      }

      persistPlaybackMode(mode);
    },
    [
      activeLineIndex,
      currentLineIndex,
      sortedLyrics,
      isMobile,
      persistPlaybackMode,
      persistVideoMuted,
      persistVideoCollapsed,
    ],
  );

  // Handle language filter change
  const handleLanguageFilterChange = useCallback(
    (filter: LanguageFilter) => {
      setLanguageFilter(filter);
      persistLanguageFilter(filter);
    },
    [persistLanguageFilter],
  );

  // Handle video collapsed toggle
  const handleVideoCollapsedToggle = useCallback(() => {
    const newCollapsed = !isVideoCollapsed;
    setIsVideoCollapsed(newCollapsed);
    persistVideoCollapsed(newCollapsed);
  }, [isVideoCollapsed, persistVideoCollapsed]);

  // Handle video mute change
  const handleVideoMuteChange = useCallback(
    (muted: boolean) => {
      setIsVideoMuted(muted);
      persistVideoMuted(muted);
    },
    [persistVideoMuted],
  );

  // Handle video error
  const handleVideoError = useCallback((error: string) => {
    setVideoError(error);
    if (import.meta.env.DEV) console.warn("Local video error:", error);
  }, []);

  // Handle video state change
  const handleVideoStateChange = useCallback(
    (state: "playing" | "paused" | "ended") => {
      setIsVideoPlaying(state === "playing");
    },
    [],
  );

  // Toggle pause/play
  const togglePlayPause = useCallback(() => {
    if (isVideoPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
  }, [isVideoPlaying]);

  // Record a line as completed in this session
  const recordLineCompletion = useCallback(
    (lineNumber: number) => {
      if (!sessionCompletedLines.has(lineNumber)) {
        if (isAuthenticated && songId) {
          recordLineCompletionMutation({
            songId: songId as Id<"songs">,
            lineNumber,
          });
        }
        setSessionCompletedLines((prev) => new Set(prev).add(lineNumber));
      }
    },
    [
      sessionCompletedLines,
      isAuthenticated,
      songId,
      recordLineCompletionMutation,
    ],
  );

  // Click animation
  const triggerClickAnimation = useCallback((lineIndex: number) => {
    setClickedLineIndex(lineIndex);
    setTimeout(() => setClickedLineIndex(undefined), 300);
  }, []);

  // Helper to seek with guard
  const seekTo = useCallback((time: number) => {
    isSeekingRef.current = true;
    playerRef.current?.seekTo(time);
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 200);
  }, []);

  // Handle line click — seek video to line
  const handleLineClick = useCallback(
    (startTime: number, lineIndex: number) => {
      // Record completion of previous line in Loop mode
      if (currentLineIndex !== undefined && currentLineIndex !== lineIndex) {
        const previousLineNumber = sortedLyrics[currentLineIndex]?.lineNumber;
        if (previousLineNumber !== undefined) {
          recordLineCompletion(previousLineNumber);
        }
      }

      triggerClickAnimation(lineIndex);
      setActiveLineIndex(lineIndex);
      setCurrentLineIndex(lineIndex);

      // Reset loop guard when clicking a new line
      isLoopingRef.current = false;

      // Mobile: expand video if collapsed so user can see playback
      if (isMobile && isVideoCollapsed) {
        setIsVideoCollapsed(false);
        persistVideoCollapsed(false);
      }

      // Seek and play video with guard
      isSeekingRef.current = true;
      playerRef.current?.seekTo(startTime);
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 200);
      playerRef.current?.play();

      // If in Fluid mode and video was muted, unmute it
      if (playbackMode === "fluid" && isVideoMuted) {
        setIsVideoMuted(false);
        persistVideoMuted(false);
      }
    },
    [
      triggerClickAnimation,
      sortedLyrics,
      playbackMode,
      isVideoMuted,
      persistVideoMuted,
      isMobile,
      isVideoCollapsed,
      persistVideoCollapsed,
      currentLineIndex,
      recordLineCompletion,
    ],
  );

  // Handle time update — update active line based on video time
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (isSeekingRef.current) return;

      // In Loop/Single mode, lock activeLineIndex to currentLineIndex
      if (playbackMode !== "fluid" && currentLineIndex !== undefined) {
        if (activeLineIndex !== currentLineIndex) {
          setActiveLineIndex(currentLineIndex);
        }

        const currentLine = sortedLyrics[currentLineIndex];
        if (currentLine) {
          if (
            currentTime >= currentLine.endTime - 0.05 &&
            !isLoopingRef.current
          ) {
            if (playbackMode === "loop") {
              isLoopingRef.current = true;
              seekTo(currentLine.startTime);
              setTimeout(() => {
                isLoopingRef.current = false;
              }, 300);

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
              if (!sessionCompletedLines.has(currentLine.lineNumber)) {
                recordLineCompletion(currentLine.lineNumber);
              }
            }
          }
        }
      } else {
        // Fluid mode: highlight follows video time
        const lineIndex = sortedLyrics.findIndex(
          (line) => currentTime >= line.startTime && currentTime < line.endTime,
        );

        if (lineIndex !== -1 && lineIndex !== activeLineIndex) {
          setActiveLineIndex(lineIndex);
        }
      }
    },
    [
      sortedLyrics,
      activeLineIndex,
      playbackMode,
      currentLineIndex,
      isAuthenticated,
      sessionCompletedLines,
      logPracticeMutation,
      recordLineCompletion,
      seekTo,
    ],
  );

  // Handle opening word info modal
  const handleLineInfoClick = useCallback(
    (line: LyricLine) => {
      playerRef.current?.pause();

      const fullLyricData = sortedLyrics.find(
        (l) => l.lineNumber === line.lineNumber,
      );

      setSelectedLine({
        lineNumber: line.lineNumber,
        original: line.original,
        transliteration: line.transliteration,
        hebrew: line.hebrew,
        english: line.english,
        audioSnippetUrl: fullLyricData?.audioSnippetUrl,
      });
      setWordModalOpen(true);
    },
    [sortedLyrics],
  );

  // Handle closing word info modal
  const handleWordModalClose = useCallback(() => {
    setWordModalOpen(false);

    if (selectedLine) {
      const lineIndex = sortedLyrics.findIndex(
        (l) => l.lineNumber === selectedLine.lineNumber,
      );
      if (lineIndex !== -1) {
        setCurrentLineIndex(lineIndex);
        setActiveLineIndex(lineIndex);
        isSeekingRef.current = true;
        playerRef.current?.seekTo(sortedLyrics[lineIndex].startTime);
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 200);
        playerRef.current?.play();
      }
    }
  }, [selectedLine, sortedLyrics]);

  // Spacebar for pause/play
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && event.target === document.body) {
        event.preventDefault();
        togglePlayPause();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause]);

  // On desktop, prevent page scroll — only lyrics should scroll
  useEffect(() => {
    if (!isMobile) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isMobile]);

  return {
    mode: playbackMode,
    isPlaying: isVideoPlaying,
    activeLineIndex,
    currentLineIndex,
    clickedLineIndex,
    playbackSpeed,
    isMuted: isVideoMuted,
    isCollapsed: isVideoCollapsed,
    isMobile,
    preferencesApplied,
    videoError,
    showSpaceHint,
    languageFilter,
    wordModalOpen,
    selectedLine,
    handlePlaybackModeChange,
    togglePlayPause,
    handleSpeedChange,
    handleVideoMuteChange,
    handleVideoCollapsedToggle,
    handleLineClick,
    handleTimeUpdate,
    handleVideoStateChange,
    handleVideoError,
    handleLanguageFilterChange,
    handleLineInfoClick,
    handleWordModalClose,
    playerRef,
  };
}
