import { useEffect, useState, useRef, useCallback } from 'react'

interface AudioSnippet {
  lineNumber: number
  audioUrl: string
}

interface PreloadState {
  loaded: number
  total: number
  ready: boolean
}

interface UseAudioPreloaderReturn extends PreloadState {
  play: (lineNumber: number) => void
  stop: () => void
  pause: () => void
  resume: () => void
  isPlaying: boolean
  setPlaybackRate: (rate: number) => void
  setLoop: (loop: boolean) => void
}

export function useAudioPreloader(snippets: AudioSnippet[]): UseAudioPreloaderReturn {
  const [state, setState] = useState<PreloadState>({
    loaded: 0,
    total: snippets.length,
    ready: false,
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const audioMapRef = useRef<Map<number, HTMLAudioElement>>(new Map())
  const currentlyPlayingRef = useRef<HTMLAudioElement | null>(null)
  const playbackRateRef = useRef<number>(1)
  const loopRef = useRef<boolean>(false)

  useEffect(() => {
    if (snippets.length === 0) {
      setState({ loaded: 0, total: 0, ready: true })
      return
    }

    let loadedCount = 0
    const total = snippets.length

    // Reset state for new snippets
    setState({ loaded: 0, total, ready: false })
    audioMapRef.current.clear()

    snippets.forEach(({ lineNumber, audioUrl }) => {
      if (!audioUrl) return

      const audio = new Audio()
      audio.preload = 'auto'

      const handleCanPlay = () => {
        loadedCount++
        audioMapRef.current.set(lineNumber, audio)
        setState({
          loaded: loadedCount,
          total,
          ready: loadedCount === total,
        })
      }

      const handleError = () => {
        // Still increment loaded count to not block ready state
        loadedCount++
        console.warn(`Failed to load audio for line ${lineNumber}: ${audioUrl}`)
        setState({
          loaded: loadedCount,
          total,
          ready: loadedCount === total,
        })
      }

      audio.addEventListener('canplaythrough', handleCanPlay, { once: true })
      audio.addEventListener('error', handleError, { once: true })
      audio.src = audioUrl
    })

    return () => {
      // Cleanup all audio elements on unmount
      audioMapRef.current.forEach(audio => {
        audio.pause()
        audio.src = ''
      })
      audioMapRef.current.clear()
      currentlyPlayingRef.current = null
    }
  }, [snippets])

  const play = useCallback((lineNumber: number) => {
    // Stop any currently playing audio
    if (currentlyPlayingRef.current) {
      currentlyPlayingRef.current.pause()
      currentlyPlayingRef.current.currentTime = 0
    }

    const audio = audioMapRef.current.get(lineNumber)
    if (audio) {
      audio.currentTime = 0
      audio.playbackRate = playbackRateRef.current
      audio.loop = loopRef.current
      audio.play().catch((err) => {
        console.warn(`Failed to play audio for line ${lineNumber}:`, err)
        setIsPlaying(false)
      })
      currentlyPlayingRef.current = audio
      setIsPlaying(true)
    }
  }, [])

  const stop = useCallback(() => {
    audioMapRef.current.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
    currentlyPlayingRef.current = null
    setIsPlaying(false)
  }, [])

  const pause = useCallback(() => {
    if (currentlyPlayingRef.current) {
      currentlyPlayingRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const resume = useCallback(() => {
    if (currentlyPlayingRef.current) {
      currentlyPlayingRef.current.play().catch((err) => {
        console.warn('Failed to resume audio:', err)
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate
    // Update rate on currently playing audio immediately
    if (currentlyPlayingRef.current) {
      currentlyPlayingRef.current.playbackRate = rate
    }
  }, [])

  const setLoop = useCallback((loop: boolean) => {
    loopRef.current = loop
    // Update loop on currently playing audio immediately
    if (currentlyPlayingRef.current) {
      currentlyPlayingRef.current.loop = loop
    }
  }, [])

  return { ...state, play, stop, pause, resume, isPlaying, setPlaybackRate, setLoop }
}
