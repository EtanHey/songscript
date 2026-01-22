/**
 * Unit tests for useProgress hook
 */

import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProgress, useSongProgress } from "./useProgress";
import * as authClient from "../lib/auth-client";
import * as anonymousProgress from "./useAnonymousProgress";

// Mock the auth client
vi.mock("../lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

// Track mutation calls
const mutationCalls: { args: unknown }[] = [];

// Mock Convex mutations - track calls to mutations
vi.mock("@convex-dev/react-query", () => ({
  useConvexMutation: vi.fn(() => {
    // Return a function that tracks calls
    return (args: unknown) => {
      mutationCalls.push({ args });
      return Promise.resolve();
    };
  }),
}));

// Mock useAnonymousProgress
vi.mock("./useAnonymousProgress", () => ({
  useAnonymousProgress: vi.fn(),
  isWordLearned: vi.fn(),
  isLineLearned: vi.fn(),
  getLearnedLinesForSong: vi.fn(),
  getLearnedWordsCount: vi.fn(),
  getLearnedLinesCount: vi.fn(),
}));

// Mock anonymous progress functions
const mockAnonProgress = {
  progress: { visitorId: "test-visitor", wordProgress: [], lineProgress: [] },
  visitorId: "test-visitor",
  isWordLearned: vi.fn(),
  setWordLearned: vi.fn(),
  getWordProgress: vi.fn(),
  incrementWordView: vi.fn(),
  incrementWordPlay: vi.fn(),
  getLearnedWordsCount: vi.fn(),
  isLineLearned: vi.fn(),
  setLineLearned: vi.fn(),
  getLineProgress: vi.fn(),
  getLearnedLinesForSong: vi.fn(),
  getLearnedLinesCount: vi.fn(),
  getSongProgress: vi.fn(),
  updateSongProgress: vi.fn(),
  logPractice: vi.fn(),
  getPracticeLog: vi.fn(),
  isInWishlist: vi.fn(),
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
  getWishlist: vi.fn(),
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  exportForMigration: vi.fn(),
  hasProgressToMigrate: vi.fn(),
  clearProgress: vi.fn(),
};

describe("useProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationCalls.length = 0;
    (anonymousProgress.useAnonymousProgress as Mock).mockReturnValue(mockAnonProgress);
    (anonymousProgress.isWordLearned as Mock).mockReturnValue(false);
    (anonymousProgress.isLineLearned as Mock).mockReturnValue(false);
    (anonymousProgress.getLearnedLinesForSong as Mock).mockReturnValue([]);
    (anonymousProgress.getLearnedWordsCount as Mock).mockReturnValue(0);
    (anonymousProgress.getLearnedLinesCount as Mock).mockReturnValue(0);
  });

  describe("auth state detection", () => {
    it("returns isAuthenticated=false when no session", () => {
      (authClient.authClient.useSession as Mock).mockReturnValue({
        data: null,
        isPending: false,
      });

      const { result } = renderHook(() => useProgress());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAuthLoading).toBe(false);
    });

    it("returns isAuthenticated=true when session exists", () => {
      (authClient.authClient.useSession as Mock).mockReturnValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        isPending: false,
      });

      const { result } = renderHook(() => useProgress());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAuthLoading).toBe(false);
    });

    it("returns isAuthLoading=true while session is pending", () => {
      (authClient.authClient.useSession as Mock).mockReturnValue({
        data: null,
        isPending: true,
      });

      const { result } = renderHook(() => useProgress());

      expect(result.current.isAuthLoading).toBe(true);
    });
  });

  describe("anonymous user - word progress operations", () => {
    beforeEach(() => {
      (authClient.authClient.useSession as Mock).mockReturnValue({
        data: null,
        isPending: false,
      });
    });

    it("routes isWordLearned to localStorage", () => {
      (anonymousProgress.isWordLearned as Mock).mockReturnValue(true);

      const { result } = renderHook(() => useProgress());
      const isLearned = result.current.isWordLearned("سلام");

      expect(isLearned).toBe(true);
      expect(anonymousProgress.isWordLearned).toHaveBeenCalledWith("سلام");
    });

    it("routes setWordLearned to localStorage", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.setWordLearned("سلام", true, "word-123");
      });

      expect(mockAnonProgress.setWordLearned).toHaveBeenCalledWith("سلام", true, "word-123");
      // Should NOT call any mutations
      expect(mutationCalls.length).toBe(0);
    });

    it("routes toggleWordLearned to localStorage", () => {
      (anonymousProgress.isWordLearned as Mock).mockReturnValue(false);

      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.toggleWordLearned("سلام", "word-123");
      });

      expect(mockAnonProgress.setWordLearned).toHaveBeenCalledWith("سلام", true, "word-123");
      // Should NOT call any mutations
      expect(mutationCalls.length).toBe(0);
    });

    it("routes incrementWordView to localStorage", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.incrementWordView("سلام", "word-123");
      });

      expect(mockAnonProgress.incrementWordView).toHaveBeenCalledWith("سلام", "word-123");
      expect(mutationCalls.length).toBe(0);
    });

    it("routes incrementWordPlay to localStorage", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.incrementWordPlay("سلام", "word-123");
      });

      expect(mockAnonProgress.incrementWordPlay).toHaveBeenCalledWith("سلام", "word-123");
      expect(mutationCalls.length).toBe(0);
    });

    it("routes getLearnedWordsCount to localStorage", () => {
      (anonymousProgress.getLearnedWordsCount as Mock).mockReturnValue(5);

      const { result } = renderHook(() => useProgress());
      const count = result.current.getLearnedWordsCount();

      expect(count).toBe(5);
    });
  });

  describe("anonymous user - line progress operations", () => {
    beforeEach(() => {
      (authClient.authClient.useSession as Mock).mockReturnValue({
        data: null,
        isPending: false,
      });
    });

    it("routes isLineLearned to localStorage", () => {
      (anonymousProgress.isLineLearned as Mock).mockReturnValue(true);

      const { result } = renderHook(() => useProgress());
      const isLearned = result.current.isLineLearned("song-123", 5);

      expect(isLearned).toBe(true);
      expect(anonymousProgress.isLineLearned).toHaveBeenCalledWith("song-123", 5);
    });

    it("routes toggleLineLearned to localStorage", () => {
      (anonymousProgress.isLineLearned as Mock).mockReturnValue(false);

      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.toggleLineLearned("song-123", 5);
      });

      expect(mockAnonProgress.setLineLearned).toHaveBeenCalledWith("song-123", 5, true);
      expect(mutationCalls.length).toBe(0);
    });

    it("routes getLearnedLinesForSong to localStorage", () => {
      (anonymousProgress.getLearnedLinesForSong as Mock).mockReturnValue([1, 3, 5]);

      const { result } = renderHook(() => useProgress());
      const lines = result.current.getLearnedLinesForSong("song-123");

      expect(lines).toEqual([1, 3, 5]);
    });

    it("routes getLearnedLinesCount to localStorage", () => {
      (anonymousProgress.getLearnedLinesCount as Mock).mockReturnValue(10);

      const { result } = renderHook(() => useProgress());
      const count = result.current.getLearnedLinesCount();

      expect(count).toBe(10);
    });
  });

  describe("anonymous user - other operations", () => {
    beforeEach(() => {
      (authClient.authClient.useSession as Mock).mockReturnValue({
        data: null,
        isPending: false,
      });
    });

    it("routes updateSongProgress to localStorage", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.updateSongProgress("song-123", 60);
      });

      expect(mockAnonProgress.updateSongProgress).toHaveBeenCalledWith("song-123", 60);
    });

    it("routes wishlist operations to localStorage", () => {
      mockAnonProgress.isInWishlist.mockReturnValue(true);

      const { result } = renderHook(() => useProgress());

      expect(result.current.isInWishlist("song-123")).toBe(true);

      act(() => {
        result.current.addToWishlist("song-456");
      });
      expect(mockAnonProgress.addToWishlist).toHaveBeenCalledWith("song-456");

      act(() => {
        result.current.removeFromWishlist("song-789");
      });
      expect(mockAnonProgress.removeFromWishlist).toHaveBeenCalledWith("song-789");
    });

    it("routes logPractice to localStorage", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.logPractice(120, 3, 2);
      });

      expect(mockAnonProgress.logPractice).toHaveBeenCalledWith(120, 3, 2);
    });

    it("routes migration helpers to localStorage", () => {
      mockAnonProgress.hasProgressToMigrate.mockReturnValue(true);
      mockAnonProgress.exportForMigration.mockReturnValue({ visitorId: "test" });

      const { result } = renderHook(() => useProgress());

      expect(result.current.hasProgressToMigrate()).toBe(true);
      expect(result.current.exportForMigration()).toEqual({ visitorId: "test" });

      act(() => {
        result.current.clearAnonymousProgress();
      });
      expect(mockAnonProgress.clearProgress).toHaveBeenCalled();
    });
  });

  describe("authenticated user - word progress operations", () => {
    beforeEach(() => {
      (authClient.authClient.useSession as Mock).mockReturnValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        isPending: false,
      });
    });

    it("routes setWordLearned to Convex mutation when authenticated", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.setWordLearned("سلام", true, "word-123");
      });

      // Should call a mutation (not localStorage)
      expect(mutationCalls.length).toBe(1);
      expect(mutationCalls[0].args).toMatchObject({
        wordId: "word-123",
        persian: "سلام",
        learned: true,
      });
      expect(mockAnonProgress.setWordLearned).not.toHaveBeenCalled();
    });

    it("routes toggleWordLearned to Convex mutation when authenticated", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.toggleWordLearned("سلام", "word-123");
      });

      // Should call a mutation (not localStorage)
      expect(mutationCalls.length).toBe(1);
      expect(mutationCalls[0].args).toMatchObject({
        wordId: "word-123",
        persian: "سلام",
      });
      expect(mockAnonProgress.setWordLearned).not.toHaveBeenCalled();
    });

    it("routes incrementWordView to Convex mutation when authenticated", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.incrementWordView("سلام", "word-123");
      });

      // Should call a mutation (not localStorage)
      expect(mutationCalls.length).toBe(1);
      expect(mutationCalls[0].args).toMatchObject({
        wordId: "word-123",
        persian: "سلام",
      });
      expect(mockAnonProgress.incrementWordView).not.toHaveBeenCalled();
    });

    it("routes incrementWordPlay to Convex mutation when authenticated", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.incrementWordPlay("سلام", "word-123");
      });

      // Should call a mutation (not localStorage)
      expect(mutationCalls.length).toBe(1);
      expect(mutationCalls[0].args).toMatchObject({
        wordId: "word-123",
        persian: "سلام",
      });
      expect(mockAnonProgress.incrementWordPlay).not.toHaveBeenCalled();
    });

    it("does not call mutation without wordId", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.setWordLearned("سلام", true);
      });

      expect(mutationCalls.length).toBe(0);
    });
  });

  describe("authenticated user - line progress operations", () => {
    beforeEach(() => {
      (authClient.authClient.useSession as Mock).mockReturnValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        isPending: false,
      });
    });

    it("routes toggleLineLearned to Convex mutation when authenticated", () => {
      const { result } = renderHook(() => useProgress());

      act(() => {
        result.current.toggleLineLearned("song-123", 5);
      });

      // Should call a mutation (not localStorage)
      expect(mutationCalls.length).toBe(1);
      expect(mutationCalls[0].args).toMatchObject({
        songId: "song-123",
        lineNumber: 5,
      });
      expect(mockAnonProgress.setLineLearned).not.toHaveBeenCalled();
    });
  });
});

describe("useSongProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationCalls.length = 0;
    (anonymousProgress.useAnonymousProgress as Mock).mockReturnValue(mockAnonProgress);
    (anonymousProgress.isLineLearned as Mock).mockReturnValue(false);
    (anonymousProgress.getLearnedLinesForSong as Mock).mockReturnValue([]);
  });

  it("returns auth state", () => {
    (authClient.authClient.useSession as Mock).mockReturnValue({
      data: null,
      isPending: true,
    });

    const { result } = renderHook(() => useSongProgress("song-123"));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAuthLoading).toBe(true);
  });

  it("routes getLineProgress to localStorage for anonymous users", () => {
    (authClient.authClient.useSession as Mock).mockReturnValue({
      data: null,
      isPending: false,
    });
    (anonymousProgress.isLineLearned as Mock).mockReturnValue(true);

    const { result } = renderHook(() => useSongProgress("song-123"));
    const isLearned = result.current.getLineProgress(5);

    expect(isLearned).toBe(true);
    expect(anonymousProgress.isLineLearned).toHaveBeenCalledWith("song-123", 5);
  });

  it("routes getLearnedLines to localStorage for anonymous users", () => {
    (authClient.authClient.useSession as Mock).mockReturnValue({
      data: null,
      isPending: false,
    });
    (anonymousProgress.getLearnedLinesForSong as Mock).mockReturnValue([1, 3, 5]);

    const { result } = renderHook(() => useSongProgress("song-123"));
    const lines = result.current.getLearnedLines();

    expect(lines).toEqual([1, 3, 5]);
    expect(anonymousProgress.getLearnedLinesForSong).toHaveBeenCalledWith("song-123");
  });

  it("routes toggleLine to localStorage for anonymous users", () => {
    (authClient.authClient.useSession as Mock).mockReturnValue({
      data: null,
      isPending: false,
    });
    (anonymousProgress.isLineLearned as Mock).mockReturnValue(false);

    const { result } = renderHook(() => useSongProgress("song-123"));

    act(() => {
      result.current.toggleLine(5);
    });

    expect(mockAnonProgress.setLineLearned).toHaveBeenCalledWith("song-123", 5, true);
  });
});
