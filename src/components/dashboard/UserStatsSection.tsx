import { Link } from "@tanstack/react-router";
import { LanguageFlag } from "../LanguageFlag";
import { StatCard } from "./StatCard";
import { StatsEmptyState } from "./StatsEmptyState";

// User Stats types
export type UserStatsData = {
  totalUniqueWords: number;
  totalLinesLearned: number;
  totalPracticeTimeSeconds: number;
  languageBreakdown: { language: string; wordCount: number }[];
  mostPracticedSong: {
    _id: string;
    title: string;
    artist: string;
    sourceLanguage: string;
    practiceCount: number;
  } | null;
  songsInProgress: number;
};

// Format time nicely (e.g., "2h 45m", "30m", "45s")
function formatPracticeTime(seconds: number): string {
  // Round to nearest second for display
  const roundedSeconds = Math.round(seconds);

  // Under 1 minute: show seconds (e.g., "45s")
  if (roundedSeconds < 60) {
    return `${roundedSeconds}s`;
  }

  const totalMinutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  // Between 1-59 minutes: show minutes and seconds (e.g., "5m 30s")
  if (totalMinutes < 60) {
    if (remainingSeconds === 0) {
      return `${totalMinutes}m`;
    }
    return `${totalMinutes}m ${remainingSeconds}s`;
  }

  // 1 hour and above: show hours and minutes (e.g., "1h 15m")
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export interface UserStatsSectionProps {
  stats: UserStatsData;
}

export function UserStatsSection({ stats }: UserStatsSectionProps) {
  const hasAnyData =
    stats.totalUniqueWords > 0 ||
    stats.totalLinesLearned > 0 ||
    stats.totalPracticeTimeSeconds > 0;

  if (!hasAnyData) {
    return <StatsEmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Main stat cards - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon="📚"
          label="Words"
          value={stats.totalUniqueWords}
          subLabel="unique words learned"
          colorClass="hover:border-blue-500/50"
        />
        <StatCard
          icon="🎵"
          label="Lines"
          value={stats.totalLinesLearned}
          subLabel="lines learned"
          colorClass="hover:border-purple-500/50"
        />
        <StatCard
          icon="⏱️"
          label="Time"
          value={stats.totalPracticeTimeSeconds}
          displayValue={formatPracticeTime(stats.totalPracticeTimeSeconds)}
          subLabel="total practice"
          colorClass="hover:border-emerald-500/50"
        />
        <StatCard
          icon="🎯"
          label="Songs"
          value={stats.songsInProgress}
          subLabel="in progress"
          colorClass="hover:border-amber-500/50"
        />
      </div>

      {/* Language breakdown and most practiced song row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Language breakdown */}
        {stats.languageBreakdown.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🌍</span>
              <span className="text-sm font-medium text-white">Words by Language</span>
            </div>
            <div className="space-y-2">
              {stats.languageBreakdown.map((lang) => {
                const percentage =
                  stats.totalUniqueWords > 0
                    ? Math.round((lang.wordCount / stats.totalUniqueWords) * 100)
                    : 0;

                return (
                  <div key={lang.language} className="flex items-center gap-3">
                    <span className="text-lg w-6 flex-shrink-0">
                      <LanguageFlag language={lang.language} size="1.125em" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300 capitalize truncate">
                          {lang.language}
                        </span>
                        <span className="text-sm text-gray-400 flex-shrink-0">
                          {lang.wordCount} words
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Most practiced song */}
        {stats.mostPracticedSong && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏆</span>
              <span className="text-sm font-medium text-white">Most Practiced Song</span>
            </div>
            <Link
              to="/song/$songId"
              params={{ songId: stats.mostPracticedSong._id }}
              className="block group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/30 transition-colors">
                  <LanguageFlag language={stats.mostPracticedSong.sourceLanguage} size="2rem" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                    {stats.mostPracticedSong.title}
                  </h4>
                  <p className="text-sm text-gray-400 truncate">
                    {stats.mostPracticedSong.artist}
                  </p>
                  <p className="text-xs text-amber-400 mt-1">
                    {stats.mostPracticedSong.practiceCount} lines practiced
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
