import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePracticeTracking } from "./usePracticeTracking";

function createDefaultParams(overrides = {}) {
  return {
    isVideoPlaying: false,
    playbackMode: "fluid" as const,
    isVideoMuted: true,
    isUsingYouTube: false,
    wordModalOpen: false,
    isAuthenticated: true,
    logPracticeMutation: vi.fn().mockResolvedValue(undefined),
    logPracticeFn: vi.fn(),
    ...overrides,
  };
}

describe("usePracticeTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not log practice time when video is not playing", () => {
    const logPracticeMutation = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      usePracticeTracking(
        createDefaultParams({
          isVideoPlaying: false,
          logPracticeMutation,
        }),
      ),
    );

    vi.advanceTimersByTime(3000);
    expect(logPracticeMutation).not.toHaveBeenCalled();
  });

  it("logs practice time when video is playing in non-fluid-muted mode", () => {
    const logPracticeMutation = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      usePracticeTracking(
        createDefaultParams({
          isVideoPlaying: true,
          playbackMode: "loop",
          isVideoMuted: true,
          logPracticeMutation,
        }),
      ),
    );

    // Simulate user activity
    window.dispatchEvent(new Event("mousemove"));

    vi.advanceTimersByTime(2000);
    expect(logPracticeMutation).toHaveBeenCalledWith({
      eventType: "audio_time",
      value: 1,
    });
  });

  it("does not log when fluid mode and muted (just watching silently)", () => {
    const logPracticeMutation = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      usePracticeTracking(
        createDefaultParams({
          isVideoPlaying: true,
          playbackMode: "fluid",
          isVideoMuted: true,
          logPracticeMutation,
        }),
      ),
    );

    window.dispatchEvent(new Event("mousemove"));
    vi.advanceTimersByTime(2000);
    expect(logPracticeMutation).not.toHaveBeenCalled();
  });

  it("logs when word modal is open (studying words counts as practice)", () => {
    const logPracticeMutation = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      usePracticeTracking(
        createDefaultParams({
          isVideoPlaying: false,
          wordModalOpen: true,
          logPracticeMutation,
        }),
      ),
    );

    window.dispatchEvent(new Event("mousemove"));
    vi.advanceTimersByTime(2000);
    expect(logPracticeMutation).toHaveBeenCalled();
  });

  it("uses logPracticeFn for anonymous users", () => {
    const logPracticeFn = vi.fn();

    renderHook(() =>
      usePracticeTracking(
        createDefaultParams({
          isVideoPlaying: true,
          playbackMode: "loop",
          isAuthenticated: false,
          logPracticeFn,
        }),
      ),
    );

    window.dispatchEvent(new Event("mousemove"));
    vi.advanceTimersByTime(2000);
    expect(logPracticeFn).toHaveBeenCalledWith(1);
  });

  it("treats YouTube as unmuted for practice tracking", () => {
    const logPracticeMutation = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      usePracticeTracking(
        createDefaultParams({
          isVideoPlaying: true,
          playbackMode: "fluid",
          isVideoMuted: true,
          isUsingYouTube: true,
          logPracticeMutation,
        }),
      ),
    );

    window.dispatchEvent(new Event("mousemove"));
    vi.advanceTimersByTime(2000);
    // YouTube mute state is treated as unmuted, so fluid+muted should still log
    expect(logPracticeMutation).toHaveBeenCalled();
  });
});
