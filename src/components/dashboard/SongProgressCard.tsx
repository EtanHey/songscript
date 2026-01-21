import { Link } from "@tanstack/react-router";
import { LanguageFlag } from "../LanguageFlag";

// Helper to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export interface SongProgressCardProps {
  title: string;
  artist: string;
  sourceLanguage: string;
  youtubeId: string;
  progressPercent: number;
  linesCompleted: number;
  totalLines: number;
  lastPracticed: number;
  songId: string;
}

export function SongProgressCard({
  title,
  artist,
  sourceLanguage,
  youtubeId,
  progressPercent,
  linesCompleted,
  totalLines,
  lastPracticed,
  songId,
}: SongProgressCardProps) {
  return (
    <Link
      to="/song/$songId"
      params={{ songId }}
      className="block bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full bg-gray-800 relative">
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={`${title} thumbnail`}
          className="h-full w-full object-cover"
        />
        {/* Progress overlay badge */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
          {progressPercent}%
        </div>
        {/* Language flag */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-sm">
          <LanguageFlag language={sourceLanguage} size="1em" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and artist */}
        <h3 className="font-semibold text-white mb-1 truncate">{title}</h3>
        <p className="text-gray-400 text-sm mb-3 truncate">{artist}</p>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {linesCompleted}/{totalLines} lines
          </span>
          <span>Last: {formatRelativeTime(lastPracticed)}</span>
        </div>
      </div>
    </Link>
  );
}
