import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLineProgress } from "./useLineProgress";
import { Id } from "@convex/_generated/dataModel";

const SONG_ID = "test-song-id" as Id<"songs">;
const WORD_ID = "test-word-id" as Id<"words">;

function createMockProgress() {
  return {
    getLearnedLinesForSong: vi.fn().mockReturnValue([]),
    toggleLineLearned: vi.fn(),
    toggleWordLearned: vi.fn(),
  };
}

function createDefaultParams(overrides = {}) {
  return {
    songId: SONG_ID,
    isAuthenticated: true,
    progress: createMockProgress(),
    lineProgressFromConvex: [] as {
      _id: string;
      visitorId: string;
      songId: Id<"songs">;
      lineNumber: number;
      learned: boolean;
    }[],
    toggleLineLearnedMutation: vi.fn().mockResolvedValue(undefined),
    toggleWordLearnedMutation: vi.fn().mockResolvedValue(false),
    logPracticeMutation: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("useLineProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("lineProgress computation", () => {
    it("returns empty array when no progress data exists", () => {
      const { result } = renderHook(() =>
        useLineProgress(createDefaultParams()),
      );
      expect(result.current.lineProgress).toEqual([]);
    });

    it("returns Convex data for authenticated users", () => {
      const convexData = [
        {
          _id: "p1",
          visitorId: "user1",
          songId: SONG_ID,
          lineNumber: 1,
          learned: true,
        },
        {
          _id: "p2",
          visitorId: "user1",
          songId: SONG_ID,
          lineNumber: 2,
          learned: false,
        },
      ];

      const { result } = renderHook(() =>
        useLineProgress(
          createDefaultParams({ lineProgressFromConvex: convexData }),
        ),
      );

      expect(result.current.lineProgress).toHaveLength(2);
      expect(result.current.lineProgress[0].learned).toBe(true);
      expect(result.current.lineProgress[1].learned).toBe(false);
    });

    it("returns localStorage data for anonymous users", () => {
      const mockProgress = createMockProgress();
      mockProgress.getLearnedLinesForSong.mockReturnValue([1, 3, 5]);

      const { result } = renderHook(() =>
        useLineProgress(
          createDefaultParams({
            isAuthenticated: false,
            progress: mockProgress,
          }),
        ),
      );

      expect(result.current.lineProgress).toHaveLength(3);
      expect(result.current.lineProgress.map((p) => p.lineNumber)).toEqual([
        1, 3, 5,
      ]);
      expect(result.current.lineProgress.every((p) => p.learned)).toBe(true);
    });
  });

  describe("optimistic toggles", () => {
    it("applies optimistic update on checkbox click for authenticated users", () => {
      const convexData = [
        {
          _id: "p1",
          visitorId: "user1",
          songId: SONG_ID,
          lineNumber: 1,
          learned: false,
        },
      ];
      const toggleMutation = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useLineProgress(
          createDefaultParams({
            lineProgressFromConvex: convexData,
            toggleLineLearnedMutation: toggleMutation,
          }),
        ),
      );

      act(() => {
        result.current.handleLineCheckboxClick(1);
      });

      // Optimistic: should now show as learned
      const line1 = result.current.lineProgress.find((p) => p.lineNumber === 1);
      expect(line1?.learned).toBe(true);

      // Mutation should have been called
      expect(toggleMutation).toHaveBeenCalledWith({
        songId: SONG_ID,
        lineNumber: 1,
      });
    });

    it("calls localStorage toggle for anonymous users", () => {
      const mockProgress = createMockProgress();

      const { result } = renderHook(() =>
        useLineProgress(
          createDefaultParams({
            isAuthenticated: false,
            progress: mockProgress,
          }),
        ),
      );

      act(() => {
        result.current.handleLineCheckboxClick(3);
      });

      expect(mockProgress.toggleLineLearned).toHaveBeenCalledWith(SONG_ID, 3);
    });
  });

  describe("word learned toggle", () => {
    it("calls Convex mutation for authenticated users", async () => {
      const toggleWordMutation = vi.fn().mockResolvedValue(true);
      const logPracticeMutation = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useLineProgress(
          createDefaultParams({
            toggleWordLearnedMutation: toggleWordMutation,
            logPracticeMutation,
          }),
        ),
      );

      await act(async () => {
        result.current.handleToggleWordLearned(WORD_ID, "سلام");
      });

      expect(toggleWordMutation).toHaveBeenCalledWith({
        wordId: WORD_ID,
        persian: "سلام",
      });
    });

    it("calls localStorage for anonymous users", () => {
      const mockProgress = createMockProgress();

      const { result } = renderHook(() =>
        useLineProgress(
          createDefaultParams({
            isAuthenticated: false,
            progress: mockProgress,
          }),
        ),
      );

      act(() => {
        result.current.handleToggleWordLearned(WORD_ID, "سلام");
      });

      expect(mockProgress.toggleWordLearned).toHaveBeenCalledWith(
        "سلام",
        WORD_ID,
      );
    });
  });

  describe("server reconciliation", () => {
    it("clears optimistic state when server confirms", () => {
      const initialConvex = [
        {
          _id: "p1",
          visitorId: "user1",
          songId: SONG_ID,
          lineNumber: 1,
          learned: false,
        },
      ];

      const params = createDefaultParams({
        lineProgressFromConvex: initialConvex,
      });

      const { result, rerender } = renderHook(
        (props) => useLineProgress(props),
        { initialProps: params },
      );

      // Trigger optimistic toggle
      act(() => {
        result.current.handleLineCheckboxClick(1);
      });

      // Verify optimistic update took effect
      expect(
        result.current.lineProgress.find((p) => p.lineNumber === 1)?.learned,
      ).toBe(true);

      // Server confirms the change
      const updatedConvex = [
        {
          _id: "p1",
          visitorId: "user1",
          songId: SONG_ID,
          lineNumber: 1,
          learned: true,
        },
      ];

      rerender({ ...params, lineProgressFromConvex: updatedConvex });

      // Should still show as learned (server confirmed)
      expect(
        result.current.lineProgress.find((p) => p.lineNumber === 1)?.learned,
      ).toBe(true);
    });
  });
});
