import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Unit test to verify that the song page initializes with the correct default values
 * for auto-play and fluid mode behavior.
 *
 * Since the song page uses inline useState hooks rather than a separate useSongPlayback hook,
 * we verify the default values by checking the source code for the expected initial state.
 */
describe('Song Page Default State', () => {
  const songPagePath = path.join(__dirname, '..', 'routes', 'song.$songId.tsx')
  const songPageContent = fs.readFileSync(songPagePath, 'utf-8')

  it('initializes playback mode to "fluid" by default', () => {
    // Check that useState for playbackMode has "fluid" as the default value
    const playbackModeRegex = /useState<PlaybackMode>\s*\(\s*["']fluid["']\s*\)/
    expect(songPageContent).toMatch(playbackModeRegex)
  })

  it('initializes video muted state to true (muted) to allow browser autoplay', () => {
    // Check that isVideoMuted is initialized to true (browsers block autoplay with sound)
    // User can unmute via the video overlay button after autoplay starts
    const videoMutedRegex = /const\s+\[isVideoMuted,\s*setIsVideoMuted\]\s*=\s*useState\s*\(\s*true\s*\)/
    expect(songPageContent).toMatch(videoMutedRegex)
  })

  it('has auto-play logic that triggers in fluid mode when audio is ready', () => {
    // Verify the auto-play useEffect exists with the correct conditions
    expect(songPageContent).toContain('hasAutoPlayedRef')
    expect(songPageContent).toContain('audioReady && playbackMode === "fluid"')
    expect(songPageContent).toContain('playerRef.current?.play()')
  })

  it('uses a ref to prevent multiple auto-play triggers', () => {
    // Verify hasAutoPlayedRef is used to prevent duplicate auto-plays
    expect(songPageContent).toContain('const hasAutoPlayedRef = useRef(false)')
    expect(songPageContent).toContain('hasAutoPlayedRef.current = true')
  })

  it('has three playback modes: single, loop, and fluid', () => {
    // Verify the PlaybackMode type includes all three modes
    expect(songPageContent).toContain('type PlaybackMode = "single" | "loop" | "fluid"')
  })
})
