import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlaybackState } from "./usePlaybackState";
import { Id } from "@convex/_generated/dataModel";

const SONG_ID = "test-song-id" as Id<"songs">;

function createSortedLyrics() {
  return [
    {
      startTime: 0.0,
      endTime: 5.0,
      lineNumber: 0,
      original: "Line one",
    },
    {
      startTime: 5.0,
      endTime: 10.0,
      lineNumber: 1,
      original: "Line two",
    },
    {
      startTime: 10.0,
      endTime: 15.0,
      lineNumber: 2,
      original: "Line three",
    },
  ];
}

function createDefaultParams(overrides = {}) {
  return {
    sortedLyrics: createSortedLyrics(),
    songId: SONG_ID,
    song: {
      videoUrl: "/video/test.mp4",
      sourceLanguage: "persian",
    },
    isAuthenticated: true,
    userPreferences: null,
    updatePreferencesMutation: vi.fn().mockResolvedValue(undefined),
    logPracticeMutation: vi.fn().mockResolvedValue(undefined),
    recordLineCompletionMutation: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("usePlaybackState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("initial state", () => {
    it("starts in fluid mode", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );
      expect(result.current.mode).toBe("fluid");
    });

    it("starts with video muted when no preferences", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );
      expect(result.current.isMuted).toBe(true);
    });

    it("starts not playing", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );
      expect(result.current.isPlaying).toBe(false);
    });

    it("has no active or current line initially", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );
      expect(result.current.activeLineIndex).toBeUndefined();
      expect(result.current.currentLineIndex).toBeUndefined();
    });

    it("starts with default playback speed of 1", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );
      expect(result.current.playbackSpeed).toBe("1");
    });

    it("uses user preferences for initial speed", () => {
      const { result } = renderHook(() =>
        usePlaybackState(
          createDefaultParams({
            userPreferences: { playbackSpeed: 0.75 },
          }),
        ),
      );
      expect(result.current.playbackSpeed).toBe("0.75");
    });
  });

  describe("mode switching", () => {
    it("changes mode when handlePlaybackModeChange is called", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      act(() => {
        result.current.handlePlaybackModeChange("loop");
      });

      expect(result.current.mode).toBe("loop");
    });

    it("persists mode change for authenticated users", () => {
      const updatePrefs = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePlaybackState(
          createDefaultParams({ updatePreferencesMutation: updatePrefs }),
        ),
      );

      act(() => {
        result.current.handlePlaybackModeChange("single");
      });

      expect(updatePrefs).toHaveBeenCalledWith({ playbackMode: "single" });
    });

    it("does not persist for anonymous users", () => {
      const updatePrefs = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePlaybackState(
          createDefaultParams({
            isAuthenticated: false,
            updatePreferencesMutation: updatePrefs,
          }),
        ),
      );

      act(() => {
        result.current.handlePlaybackModeChange("loop");
      });

      expect(updatePrefs).not.toHaveBeenCalled();
    });
  });

  describe("line click", () => {
    it("sets active and current line on click", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      act(() => {
        result.current.handleLineClick(5.0, 1);
      });

      expect(result.current.activeLineIndex).toBe(1);
      expect(result.current.currentLineIndex).toBe(1);
    });
  });

  describe("video state", () => {
    it("updates isPlaying on video state change", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      act(() => {
        result.current.handleVideoStateChange("playing");
      });
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.handleVideoStateChange("paused");
      });
      expect(result.current.isPlaying).toBe(false);
    });

    it("sets video error on error", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      act(() => {
        result.current.handleVideoError("Failed to load");
      });
      expect(result.current.videoError).toBe("Failed to load");
    });
  });

  describe("language filter", () => {
    it("defaults to 'all'", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );
      expect(result.current.languageFilter).toBe("all");
    });

    it("changes on handleLanguageFilterChange", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      act(() => {
        result.current.handleLanguageFilterChange("source");
      });
      expect(result.current.languageFilter).toBe("source");
    });
  });

  describe("speed change", () => {
    it("updates speed and persists for authenticated users", () => {
      const updatePrefs = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePlaybackState(
          createDefaultParams({ updatePreferencesMutation: updatePrefs }),
        ),
      );

      act(() => {
        result.current.handleSpeedChange("0.5");
      });

      expect(result.current.playbackSpeed).toBe("0.5");
      expect(updatePrefs).toHaveBeenCalledWith({ playbackSpeed: 0.5 });
    });
  });

  describe("collapsed toggle", () => {
    it("toggles collapsed state", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      const initialCollapsed = result.current.isCollapsed;

      act(() => {
        result.current.handleVideoCollapsedToggle();
      });

      expect(result.current.isCollapsed).toBe(!initialCollapsed);
    });
  });

  describe("time update — fluid mode", () => {
    it("updates active line based on video time in fluid mode", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      act(() => {
        result.current.handleTimeUpdate(6.0); // Should be line 2 (5.0-10.0)
      });

      expect(result.current.activeLineIndex).toBe(1);
    });
  });

  describe("word modal", () => {
    it("opens modal and pauses on line info click", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      act(() => {
        result.current.handleLineInfoClick({
          _id: "lyric-1" as any,
          songId: SONG_ID,
          lineNumber: 1,
          startTime: 5.0,
          endTime: 10.0,
          original: "Test",
          transliteration: "test",
          english: "Test",
        });
      });

      expect(result.current.wordModalOpen).toBe(true);
      expect(result.current.selectedLine?.lineNumber).toBe(1);
    });

    it("closes modal on handleWordModalClose", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );

      act(() => {
        result.current.handleLineInfoClick({
          _id: "lyric-1" as any,
          songId: SONG_ID,
          lineNumber: 1,
          startTime: 5.0,
          endTime: 10.0,
          original: "Test",
          transliteration: "test",
          english: "Test",
        });
      });

      act(() => {
        result.current.handleWordModalClose();
      });

      expect(result.current.wordModalOpen).toBe(false);
    });
  });

  describe("playerRef", () => {
    it("provides a playerRef", () => {
      const { result } = renderHook(() =>
        usePlaybackState(createDefaultParams()),
      );
      expect(result.current.playerRef).toBeDefined();
      expect(result.current.playerRef.current).toBeNull();
    });
  });
});
