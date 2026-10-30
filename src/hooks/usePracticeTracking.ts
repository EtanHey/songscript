import { useRef, useMemo, useEffect } from "react";

type PlaybackMode = "single" | "loop" | "fluid";

const IDLE_THRESHOLD_MS = 5000; // 5 seconds of no activity = idle

interface UsePracticeTrackingParams {
  isVideoPlaying: boolean;
  playbackMode: PlaybackMode;
  isVideoMuted: boolean;
  isUsingYouTube: boolean;
  wordModalOpen: boolean;
  isAuthenticated: boolean;
  logPracticeMutation: (args: {
    eventType: "word_learned" | "line_loop" | "audio_time" | "silent_time";
    value: number;
  }) => Promise<unknown>;
  logPracticeFn: (seconds: number) => void;
}

export function usePracticeTracking({
  isVideoPlaying,
  playbackMode,
  isVideoMuted,
  isUsingYouTube,
  wordModalOpen,
  isAuthenticated,
  logPracticeMutation,
  logPracticeFn,
}: UsePracticeTrackingParams): void {
  // Activity tracking for practice time
  const lastActivityRef = useRef<number>(Date.now());
  const practiceSecondsRef = useRef(0);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("mousedown", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("touchstart", updateActivity);
    window.addEventListener("scroll", updateActivity, true);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("mousedown", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
      window.removeEventListener("scroll", updateActivity, true);
    };
  }, []);

  // Determine if we should count practice time
  const effectiveIsMuted = isUsingYouTube ? false : isVideoMuted;
  const shouldCountTime = useMemo(() => {
    const isFluidMuted = playbackMode === "fluid" && effectiveIsMuted;
    const isActivelyPracticing = isVideoPlaying && !isFluidMuted;
    const isInModal = wordModalOpen;
    return isActivelyPracticing || isInModal;
  }, [playbackMode, effectiveIsMuted, isVideoPlaying, wordModalOpen]);

  // Practice time tracking — count and log every second, but only when active
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const isActive = timeSinceActivity < IDLE_THRESHOLD_MS;

      if (shouldCountTime && isActive) {
        practiceSecondsRef.current += 1;

        if (isAuthenticated) {
          logPracticeMutation({ eventType: "audio_time", value: 1 });
        } else {
          logPracticeFn(1);
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      practiceSecondsRef.current = 0;
    };
  }, [shouldCountTime, isAuthenticated, logPracticeMutation, logPracticeFn]);
}
