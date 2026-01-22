import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X, Sparkles } from "lucide-react";
import { useProgress } from "../hooks/useProgress";
import { hasProgressToMigrate } from "../hooks/useAnonymousProgress";

const DISMISS_KEY = "songscript_banner_dismissed";

/**
 * AnonymousProgressBanner - Shows a CTA for anonymous users with progress
 *
 * Only appears when:
 * 1. User is not authenticated
 * 2. User has some progress (words/lines learned)
 * 3. Banner has not been dismissed
 */
export function AnonymousProgressBanner() {
  const { isAuthenticated, isAuthLoading } = useProgress();
  const [isDismissed, setIsDismissed] = useState(true); // Default to dismissed to prevent flash
  const [progressCount, setProgressCount] = useState(0);

  // Check dismiss state and progress on mount
  useEffect(() => {
    // Check localStorage for dismiss state
    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
    setIsDismissed(dismissed);

    // Get progress count from localStorage directly
    // We use the exported function rather than the hook to get immediate value
    if (hasProgressToMigrate()) {
      const progress = JSON.parse(
        localStorage.getItem("songscript_anonymous_progress") || "{}"
      );
      const wordsLearned = progress.wordProgress?.filter(
        (w: { learned: boolean }) => w.learned
      ).length || 0;
      const linesLearned = progress.lineProgress?.filter(
        (l: { learned: boolean }) => l.learned
      ).length || 0;
      setProgressCount(wordsLearned + linesLearned);
    }
  }, []);

  // Don't show if loading, authenticated, dismissed, or no progress
  if (isAuthLoading || isAuthenticated || isDismissed || progressCount === 0) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900/80 to-emerald-800/80 border border-emerald-700/50 rounded-lg p-3 mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-emerald-100">
            <span className="font-semibold">
              You've learned {progressCount} {progressCount === 1 ? "item" : "items"}!
            </span>
          </p>
          <p className="text-xs text-emerald-300/80 mt-0.5">
            Sign up to save your progress across devices
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          to="/signup"
          className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
        >
          Sign up free
        </Link>
        <button
          onClick={handleDismiss}
          className="text-emerald-400 hover:text-emerald-300 p-1 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
