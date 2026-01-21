import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

// Practice data type
export type PracticeDay = {
  date: string;
  practiceCount: number;
  totalSeconds: number;
};

export type PracticeStreakSectionProps = {
  currentStreak: number;
  longestStreak: number;
  practiceData: PracticeDay[];
};

/**
 * Practice Streak Section Component with heatmap.
 * Displays current and longest streak stats, along with a 90-day heatmap of practice activity.
 */
export function PracticeStreakSection({
  currentStreak,
  longestStreak,
  practiceData,
}: PracticeStreakSectionProps) {

  // Number of weeks to show (fills the container better)
  const WEEKS_TO_SHOW = 18; // ~4.5 months, fills more horizontal space

  // Generate days data for the heatmap - complete weeks ending on today
  const heatmapData = useMemo(() => {
    const practiceMap = new Map(practiceData.map((d) => [d.date, d]));
    const days: { date: string; data: PracticeDay | null }[] = [];

    // Today's date
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Calculate total days: full weeks + days in current week up to today
    // We want WEEKS_TO_SHOW complete columns, with today in the last column
    const totalDays = (WEEKS_TO_SHOW - 1) * 7 + todayDayOfWeek + 1;

    // Start from (totalDays - 1) days ago
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        data: practiceMap.get(dateStr) || null,
      });
    }

    return days;
  }, [practiceData]);

  // Calculate max practice count for intensity scaling
  const maxPractice = useMemo(() => {
    if (practiceData.length === 0) return 1;
    return Math.max(...practiceData.map((d) => d.practiceCount), 1);
  }, [practiceData]);

  // Get intensity class based on practice count
  const getIntensityClass = (data: PracticeDay | null) => {
    if (!data || data.practiceCount === 0) return "bg-gray-800";

    const ratio = data.practiceCount / maxPractice;
    if (ratio >= 0.75) return "bg-green-400";
    if (ratio >= 0.5) return "bg-green-500";
    if (ratio >= 0.25) return "bg-green-600";
    return "bg-green-700";
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Streak Stats Row */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          {/* Current Streak */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </div>
              <div className="text-xs text-gray-400">Current streak</div>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-amber-400">
                {longestStreak} {longestStreak === 1 ? "day" : "days"}
              </div>
              <div className="text-xs text-gray-400">Longest streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Container - horizontally scrollable on mobile */}
      <div className="p-4">
        {/* Legend */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">Last {WEEKS_TO_SHOW} weeks</span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-700" />
            <div className="w-3 h-3 rounded-sm bg-green-600" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid - responsive, fills container */}
        <div className="overflow-x-auto pb-2">
          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${WEEKS_TO_SHOW}, 1fr)`,
              gridTemplateRows: "repeat(7, auto)",
              gridAutoFlow: "column",
              gap: "3px",
            }}
          >
            {heatmapData.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        aspect-square rounded-sm transition-all duration-150 cursor-default
                        ${getIntensityClass(day.data)}
                        hover:ring-2 hover:ring-gray-500
                      `}
                      aria-label={`${formatDate(day.date)}: ${day.data?.practiceCount || 0} practice sessions`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-800 text-white border-gray-700">
                    <div className="text-center">
                      <div className="font-medium">{formatDate(day.date)}</div>
                      {day.data ? (
                        <>
                          <div>{day.data.practiceCount} practice {day.data.practiceCount === 1 ? "session" : "sessions"}</div>
                          <div className="text-gray-400">Total time: {formatDuration(day.data.totalSeconds)}</div>
                        </>
                      ) : (
                        <div className="text-gray-400">No practice this day</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
