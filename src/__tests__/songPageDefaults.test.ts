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

  it('passes autoplay prop to LocalVideoPlayer when in fluid mode', () => {
    // Auto-play logic has been moved to LocalVideoPlayer component
    // Song page passes autoplay={playbackMode === "fluid"} to LocalVideoPlayer
    expect(songPageContent).toContain('autoplay={playbackMode === "fluid"}')
  })

  it('has three playback modes: single, loop, and fluid', () => {
    // Verify the PlaybackMode type includes all three modes
    expect(songPageContent).toContain('type PlaybackMode = "single" | "loop" | "fluid"')
  })
})

describe('LocalVideoPlayer Auto-Play', () => {
  const localVideoPlayerPath = path.join(__dirname, '..', 'components', 'LocalVideoPlayer.tsx')
  const localVideoPlayerContent = fs.readFileSync(localVideoPlayerPath, 'utf-8')

  it('supports autoplay prop', () => {
    // Check that autoplay is in the props interface
    expect(localVideoPlayerContent).toContain('autoplay?: boolean')
  })

  it('uses a ref to prevent multiple auto-play triggers', () => {
    // Verify hasAttemptedAutoplayRef is used to prevent duplicate auto-plays
    expect(localVideoPlayerContent).toContain('hasAttemptedAutoplayRef')
    expect(localVideoPlayerContent).toContain('hasAttemptedAutoplayRef.current = true')
  })

  it('shows play button overlay when autoplay is blocked', () => {
    // Verify the fallback play button exists for when browser blocks autoplay
    expect(localVideoPlayerContent).toContain('showPlayButton')
    expect(localVideoPlayerContent).toContain('Click to play')
  })

  it('handles autoplay attempt in canplay event', () => {
    // Verify autoplay is attempted when video is ready
    expect(localVideoPlayerContent).toContain('autoplay && !hasAttemptedAutoplayRef.current')
  })
})
