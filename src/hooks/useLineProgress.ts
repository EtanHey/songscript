import { useState, useMemo, useEffect, useCallback } from "react";
import { Id } from "@convex/_generated/dataModel";

// Simplified line progress type used by UI (subset of Convex data)
export type LineProgressUI = {
  _id: string;
  visitorId: string;
  songId: Id<"songs">;
  lineNumber: number;
  learned: boolean;
};

// Convex line progress shape (what the query returns)
type ConvexLineProgress = {
  _id: string;
  visitorId: string;
  songId: Id<"songs">;
  lineNumber: number;
  learned: boolean;
};

interface UseLineProgressParams {
  songId: Id<"songs">;
  isAuthenticated: boolean;
  progress: {
    getLearnedLinesForSong: (songId: Id<"songs">) => number[];
    toggleLineLearned: (songId: Id<"songs">, lineNumber: number) => void;
    toggleWordLearned: (persian: string, wordId: Id<"words">) => void;
  };
  lineProgressFromConvex: ConvexLineProgress[] | null;
  toggleLineLearnedMutation: (args: {
    songId: Id<"songs">;
    lineNumber: number;
  }) => Promise<unknown>;
  toggleWordLearnedMutation: (args: {
    wordId: Id<"words">;
    persian: string;
  }) => Promise<boolean | undefined>;
  logPracticeMutation: (args: {
    eventType: "word_learned" | "line_loop" | "audio_time" | "silent_time";
    value: number;
  }) => Promise<unknown>;
}

export interface UseLineProgressReturn {
  lineProgress: LineProgressUI[];
  handleLineCheckboxClick: (lineNumber: number) => void;
  handleToggleWordLearned: (wordId: Id<"words">, persian: string) => void;
}

export function useLineProgress({
  songId,
  isAuthenticated,
  progress,
  lineProgressFromConvex,
  toggleLineLearnedMutation,
  toggleWordLearnedMutation,
  logPracticeMutation,
}: UseLineProgressParams): UseLineProgressReturn {
  // Optimistic toggle state for instant UI feedback
  const [optimisticToggles, setOptimisticToggles] = useState<
    Map<number, boolean>
  >(new Map());

  // Build line progress array — combine Convex data (authenticated) with local data (anonymous)
  const lineProgress = useMemo((): LineProgressUI[] => {
    if (isAuthenticated) {
      const convexProgress = lineProgressFromConvex || [];
      const progressMap = new Map<number, LineProgressUI>();

      for (const p of convexProgress) {
        progressMap.set(p.lineNumber, {
          _id: p._id,
          visitorId: p.visitorId,
          songId: p.songId,
          lineNumber: p.lineNumber,
          learned: p.learned,
        });
      }

      // Apply optimistic updates on top
      for (const [lineNumber, learned] of optimisticToggles) {
        const existing = progressMap.get(lineNumber);
        if (existing) {
          progressMap.set(lineNumber, { ...existing, learned });
        } else if (learned) {
          progressMap.set(lineNumber, {
            _id: `optimistic-${songId}-${lineNumber}`,
            visitorId: "authenticated",
            songId: songId as Id<"songs">,
            lineNumber,
            learned: true,
          });
        }
      }

      return Array.from(progressMap.values());
    } else {
      const learnedLines = progress.getLearnedLinesForSong(songId);
      return learnedLines.map((lineNumber) => ({
        _id: `anon-${songId}-${lineNumber}`,
        visitorId: "anonymous",
        songId: songId as Id<"songs">,
        lineNumber,
        learned: true,
      }));
    }
  }, [
    isAuthenticated,
    lineProgressFromConvex,
    progress,
    songId,
    optimisticToggles,
  ]);

  // Clear optimistic state only when server confirms our expected state
  useEffect(() => {
    if (!lineProgressFromConvex || optimisticToggles.size === 0) return;

    const serverStateMap = new Map(
      lineProgressFromConvex.map((p) => [p.lineNumber, p.learned]),
    );

    let hasMatchingEntries = false;
    for (const [lineNumber, optimisticLearned] of optimisticToggles) {
      const serverLearned = serverStateMap.get(lineNumber) ?? false;
      if (serverLearned === optimisticLearned) {
        hasMatchingEntries = true;
        break;
      }
    }

    if (hasMatchingEntries) {
      setOptimisticToggles((prev) => {
        const next = new Map(prev);
        for (const [lineNumber, optimisticLearned] of prev) {
          const serverLearned = serverStateMap.get(lineNumber) ?? false;
          if (serverLearned === optimisticLearned) {
            next.delete(lineNumber);
          }
        }
        return next;
      });
    }
  }, [lineProgressFromConvex, optimisticToggles]);

  // Handle checkbox toggle for line learned state
  const handleLineCheckboxClick = useCallback(
    (lineNumber: number) => {
      if (isAuthenticated) {
        const currentProgress = lineProgressFromConvex?.find(
          (p) => p.lineNumber === lineNumber,
        );
        const currentlyLearned = optimisticToggles.has(lineNumber)
          ? optimisticToggles.get(lineNumber)
          : (currentProgress?.learned ?? false);
        const newLearnedState = !currentlyLearned;

        setOptimisticToggles((prev) => {
          const next = new Map(prev);
          next.set(lineNumber, newLearnedState);
          return next;
        });

        toggleLineLearnedMutation({ songId, lineNumber }).catch(() => {
          // Revert optimistic state on mutation failure
          setOptimisticToggles((prev) => {
            const next = new Map(prev);
            next.delete(lineNumber);
            return next;
          });
        });
      } else {
        progress.toggleLineLearned(songId, lineNumber);
      }
    },
    [
      isAuthenticated,
      toggleLineLearnedMutation,
      songId,
      progress,
      lineProgressFromConvex,
      optimisticToggles,
    ],
  );

  // Handle word learned toggle
  const handleToggleWordLearned = useCallback(
    (wordId: Id<"words">, persian: string) => {
      if (isAuthenticated) {
        toggleWordLearnedMutation({ wordId, persian })
          .then((newLearnedState) => {
            if (newLearnedState) {
              logPracticeMutation({ eventType: "word_learned", value: 1 });
            }
          })
          .catch(() => {
            // Silently handle — word toggle is idempotent, no optimistic state to revert
          });
      } else {
        progress.toggleWordLearned(persian, wordId);
      }
    },
    [isAuthenticated, toggleWordLearnedMutation, logPracticeMutation, progress],
  );

  return {
    lineProgress,
    handleLineCheckboxClick,
    handleToggleWordLearned,
  };
}
