import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { VolumeX, Volume2 } from 'lucide-react'

export interface LocalVideoPlayerHandle {
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  getCurrentTime: () => number
  setPlaybackRate: (rate: number) => void
  mute: () => void
  unmute: () => void
  isMuted: () => boolean
}

interface LocalVideoPlayerProps {
  videoUrl: string
  onTimeUpdate?: (currentTime: number) => void
  onReady?: () => void
  onStateChange?: (state: 'playing' | 'paused' | 'ended') => void
  onError?: (error: string) => void
  muted?: boolean
}

const LocalVideoPlayer = forwardRef<LocalVideoPlayerHandle, LocalVideoPlayerProps>(
  function LocalVideoPlayer({ videoUrl, onTimeUpdate, onReady, onStateChange, onError, muted = true }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isMutedState, setIsMutedState] = useState(muted)

    const play = useCallback(() => {
      videoRef.current?.play()
    }, [])

    const pause = useCallback(() => {
      videoRef.current?.pause()
    }, [])

    const seekTo = useCallback((seconds: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds
      }
    }, [])

    const getCurrentTime = useCallback(() => {
      return videoRef.current?.currentTime ?? 0
    }, [])

    const setPlaybackRate = useCallback((rate: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = rate
      }
    }, [])

    const muteVideo = useCallback(() => {
      if (videoRef.current) {
        videoRef.current.muted = true
        setIsMutedState(true)
      }
    }, [])

    const unmuteVideo = useCallback(() => {
      if (videoRef.current) {
        videoRef.current.muted = false
        setIsMutedState(false)
      }
    }, [])

    const checkIsMuted = useCallback(() => {
      return videoRef.current?.muted ?? true
    }, [])

    useImperativeHandle(ref, () => ({
      play,
      pause,
      seekTo,
      getCurrentTime,
      setPlaybackRate,
      mute: muteVideo,
      unmute: unmuteVideo,
      isMuted: checkIsMuted,
    }), [play, pause, seekTo, getCurrentTime, setPlaybackRate, muteVideo, unmuteVideo, checkIsMuted])

    // Handle video events
    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      const handleCanPlay = () => {
        setIsLoading(false)
        onReady?.()
      }

      const handleTimeUpdate = () => {
        onTimeUpdate?.(video.currentTime)
      }

      const handlePlay = () => {
        onStateChange?.('playing')
      }

      const handlePause = () => {
        onStateChange?.('paused')
      }

      const handleEnded = () => {
        onStateChange?.('ended')
      }

      const handleError = () => {
        const errorMessage = video.error?.message || 'Failed to load video'
        setError(errorMessage)
        setIsLoading(false)
        onError?.(errorMessage)
      }

      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('ended', handleEnded)
      video.addEventListener('error', handleError)

      return () => {
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('ended', handleEnded)
        video.removeEventListener('error', handleError)
      }
    }, [onTimeUpdate, onReady, onStateChange, onError])

    // Sync muted prop to video element
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = muted
        setIsMutedState(muted)
      }
    }, [muted])

    const toggleMute = useCallback(() => {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted
        setIsMutedState(videoRef.current.muted)
      }
    }, [])

    if (error) {
      return (
        <div className="flex aspect-video w-full items-center justify-center bg-gray-800 text-red-400">
          <div className="text-center p-4">
            <p className="font-semibold">Video Error</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      )
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
        {/* Mute/Unmute button overlay */}
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
          title={isMutedState ? 'Unmute video' : 'Mute video'}
        >
          {isMutedState ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
      </div>
    )
  }
)

export default LocalVideoPlayer
