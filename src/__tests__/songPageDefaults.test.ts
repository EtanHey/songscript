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

  it('initializes playback mode from user preferences with "fluid" fallback', () => {
    // Check that useState for playbackMode uses userPreferences with "fluid" fallback
    const playbackModeRegex = /useState<PlaybackMode>\s*\(\s*\(userPreferences\?\.playbackMode as PlaybackMode\)\s*\|\|\s*["']fluid["']\s*\)/
    expect(songPageContent).toMatch(playbackModeRegex)
  })

  it('initializes video muted state from user preferences with true fallback', () => {
    // Check that isVideoMuted is initialized from userPreferences with true fallback
    // (browsers block autoplay with sound, so true is the safe default)
    const videoMutedRegex = /const\s+\[isVideoMuted,\s*setIsVideoMuted\]\s*=\s*useState\s*\(\s*userPreferences\?\.videoMuted\s*\?\?\s*true\s*\)/
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
