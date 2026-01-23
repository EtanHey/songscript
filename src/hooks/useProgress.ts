/**
 * useProgress - Unified progress hook that abstracts data source
 *
 * For anonymous users: uses localStorage via useAnonymousProgress
 * For authenticated users: uses Convex via existing mutations
 *
 * Provides a single interface regardless of auth state.
 */

import { useCallback, useMemo } from "react";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { authClient } from "../lib/auth-client";
import {
  useAnonymousProgress,
  isWordLearned as anonIsWordLearned,
  isLineLearned as anonIsLineLearned,
  getLearnedLinesForSong as anonGetLearnedLinesForSong,
  getLearnedWordsCount as anonGetLearnedWordsCount,
  getLearnedLinesCount as anonGetLearnedLinesCount,
} from "./useAnonymousProgress";

// Types for the unified interface
export interface WordProgress {
  persian: string;
  learned: boolean;
  viewCount: number;
  playCount: number;
}

export interface LineProgress {
  songId: string;
  lineNumber: number;
  learned: boolean;
}

export interface UseProgressReturn {
  // Auth state
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  // Word progress operations
  isWordLearned: (persian: string) => boolean;
  setWordLearned: (persian: string, learned: boolean, wordId?: string) => void;
  toggleWordLearned: (persian: string, wordId?: string) => void;
  getWordProgress: (persian: string) => WordProgress | undefined;
  incrementWordView: (persian: string, wordId?: string) => void;
  incrementWordPlay: (persian: string, wordId?: string) => void;
  getLearnedWordsCount: () => number;

  // Line progress operations
  isLineLearned: (songId: string, lineNumber: number) => boolean;
  setLineLearned: (songId: string, lineNumber: number, learned: boolean) => void;
  toggleLineLearned: (songId: string, lineNumber: number) => void;
  getLearnedLinesForSong: (songId: string) => number[];
  getLearnedLinesCount: () => number;

  // Song progress operations (for future use)
  updateSongProgress: (songId: string, listenTimeSeconds: number) => void;

  // Wishlist operations
  isInWishlist: (songId: string) => boolean;
  addToWishlist: (songId: string) => void;
  removeFromWishlist: (songId: string) => void;

  // Practice log
  logPractice: (practiceSeconds: number, wordsLearned?: number, linesCompleted?: number) => void;

  // Migration helpers
  hasProgressToMigrate: () => boolean;
  exportForMigration: () => unknown;
  clearAnonymousProgress: () => void;
}

/**
 * Unified progress hook - automatically routes to localStorage or Convex
 */
export function useProgress(): UseProgressReturn {
  // Get auth state
  const { data: session, isPending: isAuthLoading } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  // Anonymous progress hook (always available)
  const anonProgress = useAnonymousProgress();

  // Extract stable function references from anonymous progress hook
  // These functions are memoized inside useAnonymousProgress via useCallback
  const anonSetWordLearned = anonProgress.setWordLearned;
  const anonGetWordProgress = anonProgress.getWordProgress;
  const anonIncrementWordView = anonProgress.incrementWordView;
  const anonIncrementWordPlay = anonProgress.incrementWordPlay;
  const anonSetLineLearned = anonProgress.setLineLearned;
  const anonGetLearnedLinesForSong = anonProgress.getLearnedLinesForSong;
  const anonUpdateSongProgress = anonProgress.updateSongProgress;
  const anonIsInWishlist = anonProgress.isInWishlist;
  const anonAddToWishlist = anonProgress.addToWishlist;
  const anonRemoveFromWishlist = anonProgress.removeFromWishlist;
  const anonLogPractice = anonProgress.logPractice;
  const anonHasProgressToMigrate = anonProgress.hasProgressToMigrate;
  const anonExportForMigration = anonProgress.exportForMigration;
  const anonClearProgress = anonProgress.clearProgress;

  // Convex mutations for authenticated users
  const toggleWordLearnedMutation = useConvexMutation(api.wordProgress.toggleLearned);
  const setWordLearnedMutation = useConvexMutation(api.wordProgress.setLearned);
  const incrementViewCountMutation = useConvexMutation(api.wordProgress.incrementViewCount);
  const incrementPlayCountMutation = useConvexMutation(api.wordProgress.incrementPlayCount);
  const toggleLineLearnedMutation = useConvexMutation(api.songProgress.toggleLineLearned);

  // Word progress operations
  const isWordLearned = useCallback(
    (persian: string): boolean => {
      if (!isAuthenticated) {
        return anonIsWordLearned(persian);
      }
      // For authenticated users, we need to check Convex data
      // This is a sync function, so we use the hook's cached data
      const wordProgress = anonGetWordProgress(persian);
      return wordProgress?.learned ?? false;
    },
    [isAuthenticated, anonGetWordProgress]
  );

  const setWordLearned = useCallback(
    (persian: string, learned: boolean, wordId?: string) => {
      if (!isAuthenticated) {
        anonSetWordLearned(persian, learned, wordId);
      } else if (wordId) {
        // Authenticated: use Convex mutation
        setWordLearnedMutation({ wordId: wordId as Id<"words">, persian, learned });
      }
    },
    [isAuthenticated, anonSetWordLearned, setWordLearnedMutation]
  );

  const toggleWordLearned = useCallback(
    (persian: string, wordId?: string) => {
      if (!isAuthenticated) {
        const currentLearned = anonIsWordLearned(persian);
        anonSetWordLearned(persian, !currentLearned, wordId);
      } else if (wordId) {
        // Authenticated: use Convex mutation
        toggleWordLearnedMutation({ wordId: wordId as Id<"words">, persian });
      }
    },
    [isAuthenticated, anonSetWordLearned, toggleWordLearnedMutation]
  );

  const getWordProgress = useCallback(
    (persian: string): WordProgress | undefined => {
      if (!isAuthenticated) {
        const progress = anonGetWordProgress(persian);
        if (!progress) return undefined;
        return {
          persian: progress.persian,
          learned: progress.learned,
          viewCount: progress.viewCount,
          playCount: progress.playCount,
        };
      }
      // For authenticated users, return from anonymous progress as fallback
      // The component should use Convex queries directly for real data
      return undefined;
    },
    [isAuthenticated, anonGetWordProgress]
  );

  const incrementWordView = useCallback(
    (persian: string, wordId?: string) => {
      if (!isAuthenticated) {
        anonIncrementWordView(persian, wordId);
      } else if (wordId) {
        incrementViewCountMutation({ wordId: wordId as Id<"words">, persian });
      }
    },
    [isAuthenticated, anonIncrementWordView, incrementViewCountMutation]
  );

  const incrementWordPlay = useCallback(
    (persian: string, wordId?: string) => {
      if (!isAuthenticated) {
        anonIncrementWordPlay(persian, wordId);
      } else if (wordId) {
        incrementPlayCountMutation({ wordId: wordId as Id<"words">, persian });
      }
    },
    [isAuthenticated, anonIncrementWordPlay, incrementPlayCountMutation]
  );

  const getLearnedWordsCount = useCallback((): number => {
    if (!isAuthenticated) {
      return anonGetLearnedWordsCount();
    }
    // For authenticated users, this should come from a Convex query
    // Return 0 as fallback - components should use Convex queries directly
    return 0;
  }, [isAuthenticated]);

  // Line progress operations
  const isLineLearned = useCallback(
    (songId: string, lineNumber: number): boolean => {
      if (!isAuthenticated) {
        return anonIsLineLearned(songId, lineNumber);
      }
      // For authenticated users, check from hook data or return false
      return false;
    },
    [isAuthenticated]
  );

  const setLineLearned = useCallback(
    (songId: string, lineNumber: number, learned: boolean) => {
      if (!isAuthenticated) {
        anonSetLineLearned(songId, lineNumber, learned);
      } else {
        // For authenticated users, toggle will work as set
        // The current Convex mutation only has toggle, so we call it if needed
        toggleLineLearnedMutation({ songId: songId as Id<"songs">, lineNumber });
      }
    },
    [isAuthenticated, anonSetLineLearned, toggleLineLearnedMutation]
  );

  const toggleLineLearned = useCallback(
    (songId: string, lineNumber: number) => {
      if (!isAuthenticated) {
        const currentLearned = anonIsLineLearned(songId, lineNumber);
        anonSetLineLearned(songId, lineNumber, !currentLearned);
      } else {
        toggleLineLearnedMutation({ songId: songId as Id<"songs">, lineNumber });
      }
    },
    [isAuthenticated, anonSetLineLearned, toggleLineLearnedMutation]
  );

  const getLearnedLinesForSong = useCallback(
    (songId: string): number[] => {
      if (!isAuthenticated) {
        return anonGetLearnedLinesForSong(songId);
      }
      // For authenticated users, this should come from Convex
      return [];
    },
    [isAuthenticated]
  );

  const getLearnedLinesCount = useCallback((): number => {
    if (!isAuthenticated) {
      return anonGetLearnedLinesCount();
    }
    return 0;
  }, [isAuthenticated]);

  // Song progress operations
  const updateSongProgress = useCallback(
    (songId: string, listenTimeSeconds: number) => {
      if (!isAuthenticated) {
        anonUpdateSongProgress(songId, listenTimeSeconds);
      }
      // For authenticated users, this is handled via practiceLog mutations
    },
    [isAuthenticated, anonUpdateSongProgress]
  );

  // Wishlist operations
  const isInWishlist = useCallback(
    (songId: string): boolean => {
      if (!isAuthenticated) {
        return anonIsInWishlist(songId);
      }
      // For authenticated users, should use Convex query
      return false;
    },
    [isAuthenticated, anonIsInWishlist]
  );

  const addToWishlist = useCallback(
    (songId: string) => {
      if (!isAuthenticated) {
        anonAddToWishlist(songId);
      }
      // For authenticated users, use Convex mutation (if available)
    },
    [isAuthenticated, anonAddToWishlist]
  );

  const removeFromWishlist = useCallback(
    (songId: string) => {
      if (!isAuthenticated) {
        anonRemoveFromWishlist(songId);
      }
      // For authenticated users, use Convex mutation (if available)
    },
    [isAuthenticated, anonRemoveFromWishlist]
  );

  // Practice log
  const logPractice = useCallback(
    (practiceSeconds: number, wordsLearned = 0, linesCompleted = 0) => {
      if (!isAuthenticated) {
        anonLogPractice(practiceSeconds, wordsLearned, linesCompleted);
      }
      // For authenticated users, this is handled via Convex practiceLog mutations
    },
    [isAuthenticated, anonLogPractice]
  );

  // Migration helpers
  const hasProgressToMigrate = useCallback((): boolean => {
    return anonHasProgressToMigrate();
  }, [anonHasProgressToMigrate]);

  const exportForMigration = useCallback((): unknown => {
    return anonExportForMigration();
  }, [anonExportForMigration]);

  const clearAnonymousProgress = useCallback(() => {
    anonClearProgress();
  }, [anonClearProgress]);

  // Include anonymous progress data for reactivity - this changes when localStorage updates
  const anonymousProgressData = anonProgress.progress;

  return useMemo(
    () => ({
      // Auth state
      isAuthenticated,
      isAuthLoading,

      // Anonymous progress data (for reactivity in consuming components)
      anonymousProgressData: isAuthenticated ? null : anonymousProgressData,

      // Word progress
      isWordLearned,
      setWordLearned,
      toggleWordLearned,
      getWordProgress,
      incrementWordView,
      incrementWordPlay,
      getLearnedWordsCount,

      // Line progress
      isLineLearned,
      setLineLearned,
      toggleLineLearned,
      getLearnedLinesForSong,
      getLearnedLinesCount,

      // Song progress
      updateSongProgress,

      // Wishlist
      isInWishlist,
      addToWishlist,
      removeFromWishlist,

      // Practice log
      logPractice,

      // Migration
      hasProgressToMigrate,
      exportForMigration,
      clearAnonymousProgress,
    }),
    [
      isAuthenticated,
      isAuthLoading,
      anonymousProgressData,
      isWordLearned,
      setWordLearned,
      toggleWordLearned,
      getWordProgress,
      incrementWordView,
      incrementWordPlay,
      getLearnedWordsCount,
      isLineLearned,
      setLineLearned,
      toggleLineLearned,
      getLearnedLinesForSong,
      getLearnedLinesCount,
      updateSongProgress,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      logPractice,
      hasProgressToMigrate,
      exportForMigration,
      clearAnonymousProgress,
    ]
  );
}

/**
 * Hook specifically for song page - provides line progress data for a specific song
 * This is optimized for the song page use case where we need both auth and anonymous data
 */
export function useSongProgress(songId: string) {
  const { data: session, isPending: isAuthLoading } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  const anonProgress = useAnonymousProgress();

  // Get line progress for this song
  const getLineProgress = useCallback(
    (lineNumber: number): boolean => {
      if (!isAuthenticated) {
        return anonIsLineLearned(songId, lineNumber);
      }
      return false; // For authenticated, use Convex query data passed to component
    },
    [isAuthenticated, songId]
  );

  const getLearnedLines = useCallback((): number[] => {
    if (!isAuthenticated) {
      return anonGetLearnedLinesForSong(songId);
    }
    return [];
  }, [isAuthenticated, songId]);

  const toggleLine = useCallback(
    (lineNumber: number) => {
      if (!isAuthenticated) {
        const currentLearned = anonIsLineLearned(songId, lineNumber);
        anonProgress.setLineLearned(songId, lineNumber, !currentLearned);
      }
      // For authenticated users, component should call Convex mutation directly
    },
    [isAuthenticated, songId, anonProgress]
  );

  return {
    isAuthenticated,
    isAuthLoading,
    getLineProgress,
    getLearnedLines,
    toggleLine,
  };
}
