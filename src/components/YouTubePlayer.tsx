import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'

// YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

declare namespace YT {
  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions)
    playVideo(): void
    pauseVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
    getCurrentTime(): number
    getPlayerState(): number
    setPlaybackRate(suggestedRate: number): void
    destroy(): void
  }

  interface PlayerOptions {
    videoId: string
    width?: string | number
    height?: string | number
    playerVars?: PlayerVars
    events?: {
      onReady?: (event: PlayerEvent) => void
      onStateChange?: (event: OnStateChangeEvent) => void
      onError?: (event: OnErrorEvent) => void
    }
  }

  interface PlayerVars {
    autoplay?: 0 | 1
    controls?: 0 | 1
    enablejsapi?: 0 | 1
    modestbranding?: 0 | 1
    rel?: 0 | 1
    origin?: string
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent {
    target: Player
    data: number
  }

  interface OnErrorEvent {
    target: Player
    data: number
  }

  const PlayerState: {
    UNSTARTED: -1
    ENDED: 0
    PLAYING: 1
    PAUSED: 2
    BUFFERING: 3
    CUED: 5
  }
}

export interface YouTubePlayerHandle {
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  getCurrentTime: () => number
  setPlaybackRate: (rate: number) => void
}

interface YouTubePlayerProps {
  videoId: string
  onTimeUpdate?: (currentTime: number) => void
  onReady?: () => void
  onStateChange?: (state: number) => void
}

let apiLoadPromise: Promise<void> | null = null

function loadYouTubeAPI(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise

  if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
    return Promise.resolve()
  }

  apiLoadPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const existingScript = document.getElementById('youtube-iframe-api')
    if (existingScript) {
      if (window.YT && window.YT.Player) {
        resolve()
      } else {
        const originalCallback = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          originalCallback?.()
          resolve()
        }
      }
      return
    }

    window.onYouTubeIframeAPIReady = () => {
      resolve()
    }

    const script = document.createElement('script')
    script.id = 'youtube-iframe-api'
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    document.body.appendChild(script)
  })

  return apiLoadPromise
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer({ videoId, onTimeUpdate, onReady, onStateChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<YT.Player | null>(null)
    const timeUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const play = useCallback(() => {
      playerRef.current?.playVideo()
    }, [])

    const pause = useCallback(() => {
      playerRef.current?.pauseVideo()
    }, [])

    const seekTo = useCallback((seconds: number) => {
      playerRef.current?.seekTo(seconds, true)
    }, [])

    const getCurrentTime = useCallback(() => {
      return playerRef.current?.getCurrentTime() ?? 0
    }, [])

    const setPlaybackRate = useCallback((rate: number) => {
      playerRef.current?.setPlaybackRate(rate)
    }, [])

    useImperativeHandle(ref, () => ({
      play,
      pause,
      seekTo,
      getCurrentTime,
      setPlaybackRate,
    }), [play, pause, seekTo, getCurrentTime, setPlaybackRate])

    useEffect(() => {
      if (typeof window === 'undefined') return

      let isMounted = true
      const containerId = `youtube-player-${videoId}`

      const initPlayer = async () => {
        try {
          await loadYouTubeAPI()

          if (!isMounted || !containerRef.current) return

          // Create a div for the player inside our container
          const playerDiv = document.createElement('div')
          playerDiv.id = containerId
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(playerDiv)

          playerRef.current = new window.YT.Player(containerId, {
            videoId,
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
              controls: 1,
              enablejsapi: 1,
              modestbranding: 1,
              rel: 0,
            },
            events: {
              onReady: () => {
                if (!isMounted) return
                setIsLoading(false)
                onReady?.()
              },
              onStateChange: (event) => {
                if (!isMounted) return
                onStateChange?.(event.data)

                // Start/stop time tracking based on player state
                if (event.data === 1) { // Playing
                  if (onTimeUpdate && !timeUpdateIntervalRef.current) {
                    timeUpdateIntervalRef.current = setInterval(() => {
                      if (playerRef.current) {
                        const time = playerRef.current.getCurrentTime()
                        onTimeUpdate(time)
                      }
                    }, 100)
                  }
                } else {
                  // Clear interval when not playing
                  if (timeUpdateIntervalRef.current) {
                    clearInterval(timeUpdateIntervalRef.current)
                    timeUpdateIntervalRef.current = null
                  }
                }
              },
              onError: (event) => {
                if (!isMounted) return
                setError(`YouTube player error: ${event.data}`)
                setIsLoading(false)
              },
            },
          })
        } catch (err) {
          if (isMounted) {
            setError('Failed to load YouTube player')
            setIsLoading(false)
          }
        }
      }

      initPlayer()

      return () => {
        isMounted = false
        if (timeUpdateIntervalRef.current) {
          clearInterval(timeUpdateIntervalRef.current)
          timeUpdateIntervalRef.current = null
        }
        if (playerRef.current) {
          playerRef.current.destroy()
          playerRef.current = null
        }
      }
    }, [videoId, onReady, onStateChange, onTimeUpdate])

    if (error) {
      return (
        <div className="flex aspect-video w-full items-center justify-center bg-muted text-destructive">
          {error}
        </div>
      )
    }

    return (
      <div className="relative aspect-video w-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading player...</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    )
  }
)

export default YouTubePlayer
