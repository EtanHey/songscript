import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { createRef } from 'react'
import YouTubePlayer, { YouTubePlayerHandle } from './YouTubePlayer'

// Mock player instance
const mockPlayerInstance = {
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  seekTo: vi.fn(),
  getCurrentTime: vi.fn().mockReturnValue(42),
  getPlayerState: vi.fn().mockReturnValue(1),
  setPlaybackRate: vi.fn(),
  destroy: vi.fn(),
}

// Mock YT.Player constructor - use unknown to avoid type conflicts
const MockYTPlayer = vi.fn((_elementId: unknown, options: unknown) => {
  // Call onReady immediately to simulate player ready
  const opts = options as { events?: { onReady?: () => void }; videoId?: string }
  setTimeout(() => {
    opts.events?.onReady?.()
  }, 0)
  return mockPlayerInstance
})

describe('YouTubePlayer', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup global YT mock - cast to unknown first to avoid type conflicts
    ;(window as unknown as { YT: unknown }).YT = {
      Player: MockYTPlayer,
      PlayerState: {
        UNSTARTED: -1,
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        CUED: 5,
      },
    }
  })

  afterEach(() => {
    // Clean up
    ;(window as unknown as { YT: unknown }).YT = undefined
  })

  it('renders loading state initially', () => {
    render(<YouTubePlayer videoId="test123" />)

    expect(screen.getByText('Loading player...')).toBeInTheDocument()
  })

  it('creates YouTube player with correct video ID', async () => {
    render(<YouTubePlayer videoId="xLvUEF2zpj8" />)

    await waitFor(() => {
      expect(MockYTPlayer).toHaveBeenCalled()
    })

    // Check that the player was created with the correct video ID
    const call = MockYTPlayer.mock.calls[0][1] as { videoId?: string }
    expect(call.videoId).toBe('xLvUEF2zpj8')
  })

  it('exposes seekTo through ref that calls player.seekTo', async () => {
    const ref = createRef<YouTubePlayerHandle>()

    render(<YouTubePlayer ref={ref} videoId="test123" />)

    // Wait for player to be ready
    await waitFor(() => {
      expect(ref.current).not.toBeNull()
    })

    // Call seekTo through ref
    act(() => {
      ref.current?.seekTo(42.5)
    })

    // Verify it calls the underlying player method with allowSeekAhead=true
    expect(mockPlayerInstance.seekTo).toHaveBeenCalledWith(42.5, true)
  })

  it('exposes play through ref that calls player.playVideo', async () => {
    const ref = createRef<YouTubePlayerHandle>()

    render(<YouTubePlayer ref={ref} videoId="test123" />)

    await waitFor(() => {
      expect(ref.current).not.toBeNull()
    })

    act(() => {
      ref.current?.play()
    })

    expect(mockPlayerInstance.playVideo).toHaveBeenCalled()
  })

  it('exposes pause through ref that calls player.pauseVideo', async () => {
    const ref = createRef<YouTubePlayerHandle>()

    render(<YouTubePlayer ref={ref} videoId="test123" />)

    await waitFor(() => {
      expect(ref.current).not.toBeNull()
    })

    act(() => {
      ref.current?.pause()
    })

    expect(mockPlayerInstance.pauseVideo).toHaveBeenCalled()
  })

  it('exposes getCurrentTime through ref', async () => {
    const ref = createRef<YouTubePlayerHandle>()

    render(<YouTubePlayer ref={ref} videoId="test123" />)

    await waitFor(() => {
      expect(ref.current).not.toBeNull()
    })

    const time = ref.current?.getCurrentTime()

    expect(mockPlayerInstance.getCurrentTime).toHaveBeenCalled()
    expect(time).toBe(42)
  })

  it('exposes setPlaybackRate through ref', async () => {
    const ref = createRef<YouTubePlayerHandle>()

    render(<YouTubePlayer ref={ref} videoId="test123" />)

    await waitFor(() => {
      expect(ref.current).not.toBeNull()
    })

    act(() => {
      ref.current?.setPlaybackRate(0.75)
    })

    expect(mockPlayerInstance.setPlaybackRate).toHaveBeenCalledWith(0.75)
  })

  it('calls onReady callback when player is ready', async () => {
    const onReady = vi.fn()

    render(<YouTubePlayer videoId="test123" onReady={onReady} />)

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled()
    })
  })

  it('cleans up player on unmount', async () => {
    const { unmount } = render(<YouTubePlayer videoId="test123" />)

    // Wait for player to initialize
    await waitFor(() => {
      expect(MockYTPlayer).toHaveBeenCalled()
    })

    // Unmount
    unmount()

    // Check destroy was called
    expect(mockPlayerInstance.destroy).toHaveBeenCalled()
  })

  it('shows error when YouTube API script fails to load', async () => {
    // Remove YT so the component tries to load the script
    ;(window as unknown as { YT: unknown }).YT = undefined

    render(<YouTubePlayer videoId="test123" />)

    // The component should have created a script tag - fire error on it
    await waitFor(() => {
      const script = document.getElementById('youtube-iframe-api')
      expect(script).not.toBeNull()
    })

    const script = document.getElementById('youtube-iframe-api')!
    act(() => {
      script.dispatchEvent(new Event('error'))
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to load YouTube player')).toBeInTheDocument()
    })

    // Clean up the script tag for other tests
    script.remove()
  })

  it('allows retry after script load failure', async () => {
    // First: fail the load
    ;(window as unknown as { YT: unknown }).YT = undefined

    const { unmount } = render(<YouTubePlayer videoId="test123" />)

    await waitFor(() => {
      const script = document.getElementById('youtube-iframe-api')
      expect(script).not.toBeNull()
    })

    const script = document.getElementById('youtube-iframe-api')!
    act(() => {
      script.dispatchEvent(new Event('error'))
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to load YouTube player')).toBeInTheDocument()
    })

    unmount()
    script.remove()

    // Second: retry with YT available should succeed
    ;(window as unknown as { YT: unknown }).YT = {
      Player: MockYTPlayer,
      PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
    }

    render(<YouTubePlayer videoId="retry123" />)

    await waitFor(() => {
      expect(MockYTPlayer).toHaveBeenCalled()
    })
  })
})
