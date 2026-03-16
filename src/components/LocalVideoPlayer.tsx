import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { VolumeX, Volume2, Play } from "lucide-react";

export interface LocalVideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setPlaybackRate: (rate: number) => void;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
}

interface LocalVideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: () => void;
  onStateChange?: (state: "playing" | "paused" | "ended") => void;
  onError?: (error: string) => void;
  onMuteChange?: (muted: boolean) => void;
  muted?: boolean;
  autoplay?: boolean;
  showMuteButton?: boolean; // Whether to show the mute/unmute button (default: true)
}

const LocalVideoPlayer = forwardRef<
  LocalVideoPlayerHandle,
  LocalVideoPlayerProps
>(function LocalVideoPlayer(
  {
    videoUrl,
    onTimeUpdate,
    onReady,
    onStateChange,
    onError,
    onMuteChange,
    muted = true,
    autoplay = false,
    showMuteButton = true,
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutedState, setIsMutedState] = useState(muted);
  const [showPlayButton, setShowPlayButton] = useState(false);

  const play = useCallback(() => {
    const playPromise = videoRef.current?.play();
    // Handle autoplay failure - show play button if browser blocks it
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay was blocked, show play button
        setShowPlayButton(true);
      });
    }
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return videoRef.current?.currentTime ?? 0;
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  const muteVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      setIsMutedState(true);
    }
  }, []);

  const unmuteVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMutedState(false);
    }
  }, []);

  const checkIsMuted = useCallback(() => {
    return videoRef.current?.muted ?? true;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      play,
      pause,
      seekTo,
      getCurrentTime,
      setPlaybackRate,
      mute: muteVideo,
      unmute: unmuteVideo,
      isMuted: checkIsMuted,
    }),
    [
      play,
      pause,
      seekTo,
      getCurrentTime,
      setPlaybackRate,
      muteVideo,
      unmuteVideo,
      checkIsMuted,
    ],
  );

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      onReady?.();
    };

    const handleTimeUpdate = () => {
      onTimeUpdate?.(video.currentTime);
    };

    const handlePlay = () => {
      onStateChange?.("playing");
      // Hide play button overlay when video starts playing
      setShowPlayButton(false);
    };

    const handlePause = () => {
      onStateChange?.("paused");
    };

    const handleEnded = () => {
      onStateChange?.("ended");
    };

    const handleError = () => {
      const errorMessage = video.error?.message || "Failed to load video";
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    // Handle case where video is already loaded from cache (on page refresh)
    // readyState >= 3 (HAVE_FUTURE_DATA) means video can play
    if (video.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [onTimeUpdate, onReady, onStateChange, onError, autoplay]);

  // Autoplay when prop becomes true (handles delayed preference loading)
  useEffect(() => {
    const video = videoRef.current;
    if (!autoplay || !video || video.readyState < 3) return;
    if (!video.paused) return; // already playing

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        setShowPlayButton(true);
      });
    }
  }, [autoplay]);

  // Sync muted prop to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      setIsMutedState(muted);
    }
  }, [muted]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMutedState(newMuted);
      onMuteChange?.(newMuted);
    }
  }, [onMuteChange]);

  // Handle click to play (for when autoplay was blocked)
  const handlePlayButtonClick = useCallback(() => {
    setShowPlayButton(false);
    videoRef.current?.play();
  }, []);

  if (error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-gray-800 text-red-400">
        <div className="text-center p-4">
          <p className="font-semibold">Video Error</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-sm text-gray-400">Loading video...</span>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="h-full w-full"
        src={videoUrl}
        muted={muted}
        playsInline
        preload="auto"
      />
      {/* Click to play overlay (shown when autoplay is blocked) */}
      {showPlayButton && (
        <button
          onClick={handlePlayButtonClick}
          className="absolute inset-0 flex items-center justify-center bg-black/50 text-white hover:bg-black/40 transition-colors cursor-pointer"
          aria-label="Click to play"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-white/20 p-4">
              <Play className="h-12 w-12 fill-white" />
            </div>
            <span className="text-sm font-medium">Click to play</span>
          </div>
        </button>
      )}
      {/* Mute/Unmute button overlay - hidden in Single/Loop modes where video is always muted */}
      {showMuteButton && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
          title={isMutedState ? "Unmute video" : "Mute video"}
        >
          {isMutedState ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
});

export default LocalVideoPlayer;
