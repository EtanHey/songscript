import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Unit test to verify that the song page initializes with the correct default values
 * for playback modes and uses video as single audio source.
 */
describe("Song Page Default State", () => {
  const songPagePath = path.join(__dirname, "..", "routes", "song.$songId.tsx");
  const songPageContent = fs.readFileSync(songPagePath, "utf-8");

  it('initializes playback mode to "fluid" always (better UX on page load)', () => {
    expect(songPageContent).toContain('useState<PlaybackMode>("fluid")');
  });

  it("initializes video muted state from user preferences with true fallback", () => {
    const videoMutedRegex =
      /const\s+\[isVideoMuted,\s*setIsVideoMuted\]\s*=\s*useState\s*\(\s*\n?\s*userPreferences\?\.videoMuted\s*\?\?\s*true\s*,?\s*\n?\s*\)/;
    expect(songPageContent).toMatch(videoMutedRegex);
  });

  it("passes autoplay prop to LocalVideoPlayer when in fluid mode and preferences are applied", () => {
    expect(songPageContent).toContain(
      'autoplay={preferencesApplied && playbackMode === "fluid"}',
    );
  });

  it("has three playback modes: single, loop, and fluid", () => {
    expect(songPageContent).toContain(
      'type PlaybackMode = "single" | "loop" | "fluid"',
    );
  });

  it("uses video as single audio source (no useAudioPreloader on main page)", () => {
    // The simplified architecture should NOT use useAudioPreloader on the main page
    expect(songPageContent).not.toContain("useAudioPreloader(audioSnippets");
  });

  it("handles loop mode by seeking video back to line start", () => {
    // Uses seekTo helper which calls playerRef.current?.seekTo
    expect(songPageContent).toContain("seekTo(currentLine.startTime)");
  });

  it("handles single mode by pausing video at line end", () => {
    expect(songPageContent).toContain("playerRef.current?.pause()");
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
