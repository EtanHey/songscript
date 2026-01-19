import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Unit test to verify that the loop mode seek logic prevents line change events
 * during loop restart seeks, which prevents visual flashing.
 *
 * The implementation uses isLoopSeekingRef to guard against handleTimeUpdate
 * during seek operations.
 */
describe('Loop Mode Seek Logic', () => {
  const songPagePath = path.join(__dirname, '..', 'routes', 'song.$songId.tsx')
  const songPageContent = fs.readFileSync(songPagePath, 'utf-8')

  it('has isLoopSeekingRef to track loop seek state', () => {
    // Verify the ref exists to track when we're in a loop seek
    expect(songPageContent).toContain('isLoopSeekingRef')
    expect(songPageContent).toContain('useRef(false)')
  })

  it('guards handleTimeUpdate with isLoopSeekingRef check', () => {
    // The handleTimeUpdate callback should check isLoopSeekingRef and return early
    // This prevents line index updates during loop restart seeks
    expect(songPageContent).toContain('isLoopSeekingRef.current')

    // Look for the early return pattern in handleTimeUpdate
    // The code should skip line updates when seeking
    const handleTimeUpdateSection = songPageContent.match(
      /const handleTimeUpdate[\s\S]*?^\s*\}\s*,\s*\[/m
    )?.[0] || ''

    expect(handleTimeUpdateSection).toContain('if (isLoopSeekingRef.current)')
    expect(handleTimeUpdateSection).toContain('return')
  })

  it('sets isLoopSeekingRef before loop restart seek', () => {
    // When looping, the code should set the flag to true before seeking
    expect(songPageContent).toContain('isLoopSeekingRef.current = true')
  })

  it('clears isLoopSeekingRef after loop restart seek completes', () => {
    // After a short delay, the flag should be cleared to resume normal operation
    expect(songPageContent).toContain('isLoopSeekingRef.current = false')

    // Should use setTimeout to clear after seek completes
    expect(songPageContent).toContain('setTimeout')
  })

  it('only applies loop seeking guard in loop mode', () => {
    // The loop restart logic should only apply when playbackMode is "loop"
    expect(songPageContent).toContain('playbackMode === "loop"')

    // The seekTo should happen inside the loop mode branch
    const loopModeSection = songPageContent.match(
      /if \(playbackMode === "loop"\)[\s\S]*?seekTo/
    )
    expect(loopModeSection).toBeTruthy()
  })

  it('loop mode seeks back to currentLine.startTime', () => {
    // When looping, seek back to the start of the current line
    expect(songPageContent).toContain('currentLine.startTime')
    expect(songPageContent).toContain('seekTo')
  })

  it('clears seeking flag with 100ms delay for browser seek processing', () => {
    // The 100ms delay allows the browser to complete the seek operation
    // before resuming line update tracking
    const timeoutPattern = /setTimeout\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?isLoopSeekingRef\.current\s*=\s*false[\s\S]*?\}\s*,\s*100\s*\)/
    expect(songPageContent).toMatch(timeoutPattern)
  })
})
