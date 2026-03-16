import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Unit test to verify that the song page initializes with the correct default values
 * for playback modes and uses video as single audio source.
 *
 * After Phase 1 componentization, playback state lives in usePlaybackState hook.
 * These tests check the hook file for state defaults and the route file for wiring.
 */
describe("Song Page Default State", () => {
  const hooksDir = path.join(__dirname, "..", "hooks");
  const playbackHookContent = fs.readFileSync(
    path.join(hooksDir, "usePlaybackState.ts"),
    "utf-8",
  );
  const songPageContent = fs.readFileSync(
    path.join(__dirname, "..", "routes", "song.$songId.tsx"),
    "utf-8",
  );

  it('initializes playback mode to "fluid" always (better UX on page load)', () => {
    expect(playbackHookContent).toContain('useState<PlaybackMode>("fluid")');
  });

  it("initializes video muted state from user preferences with true fallback", () => {
    const videoMutedRegex =
      /const\s+\[isVideoMuted,\s*setIsVideoMuted\]\s*=\s*useState\s*\(\s*\n?\s*userPreferences\?\.videoMuted\s*\?\?\s*true\s*,?\s*\n?\s*\)/;
    expect(playbackHookContent).toMatch(videoMutedRegex);
  });

  it("passes autoplay prop to LocalVideoPlayer when in fluid mode and preferences are applied", () => {
    // After extraction, the route file uses playback.preferencesApplied and playback.mode
    expect(songPageContent).toContain("playback.preferencesApplied");
    expect(songPageContent).toContain('playback.mode === "fluid"');
  });

  it("has three playback modes: single, loop, and fluid", () => {
    expect(playbackHookContent).toContain(
      'type PlaybackMode = "single" | "loop" | "fluid"',
    );
  });

  it("uses video as single audio source (no useAudioPreloader on main page)", () => {
    expect(songPageContent).not.toContain("useAudioPreloader(audioSnippets");
  });

  it("handles loop mode by seeking video back to line start", () => {
    expect(playbackHookContent).toContain("seekTo(currentLine.startTime)");
  });

  it("handles single mode by pausing video at line end", () => {
    expect(playbackHookContent).toContain("playerRef.current?.pause()");
  });
});

describe("LocalVideoPlayer Auto-Play", () => {
  const localVideoPlayerPath = path.join(
    __dirname,
    "..",
    "components",
    "LocalVideoPlayer.tsx",
  );
  const localVideoPlayerContent = fs.readFileSync(
    localVideoPlayerPath,
    "utf-8",
  );

  it("supports autoplay prop", () => {
    expect(localVideoPlayerContent).toContain("autoplay?: boolean");
  });

  it("triggers autoplay via effect when autoplay prop becomes true", () => {
    expect(localVideoPlayerContent).toContain("if (!autoplay");
    expect(localVideoPlayerContent).toContain("video.play()");
  });

  it("shows play button overlay when autoplay is blocked", () => {
    expect(localVideoPlayerContent).toContain("showPlayButton");
    expect(localVideoPlayerContent).toContain("Click to play");
  });
});
