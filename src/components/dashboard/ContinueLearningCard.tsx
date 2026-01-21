import { Link } from "@tanstack/react-router";
import type { Id } from "@convex/_generated/dataModel";
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

export type RecentSong = {
  _id: Id<"userSongProgress">;
  songId: Id<"songs">;
  lastPracticed: number;
  lastLineIndex: number;
  lastLinePreview: string;
  song: {
    _id: Id<"songs">;
    title: string;
    artist: string;
    sourceLanguage: string;
    youtubeId: string;
    videoUrl?: string;
    createdAt: number;
  };
  totalLines: number;
  progressPercent: number;
};

export interface ContinueLearningCardProps {
  item: RecentSong;
  className?: string;
}

export function ContinueLearningCard({
  item,
  className = "",
}: ContinueLearningCardProps) {
  return (
    <Link
      to="/song/$songId"
      params={{ songId: item.songId }}
      search={{ line: item.lastLineIndex }}
      className={`block bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 active:scale-[0.98] ${className}`}
    >
      {/* Thumbnail with gradient overlay for text readability */}
      <div className="aspect-video w-full bg-gray-800 relative">
        <img
          src={`https://i.ytimg.com/vi_webp/${item.song.youtubeId}/maxresdefault.webp`}
          alt={`${item.song.title} thumbnail`}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to YouTube thumbnail if webp fails
            e.currentTarget.src = `https://img.youtube.com/vi/${item.song.youtubeId}/mqdefault.jpg`;
          }}
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Progress badge */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
          {item.progressPercent}%
        </div>

        {/* Language flag - uses Twemoji Sun & Lion for Persian */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-sm flex items-center justify-center">
          <LanguageFlag language={item.song.sourceLanguage} size="1.1em" />
        </div>

        {/* Content overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-lg mb-0.5 truncate drop-shadow-lg">
            {item.song.title}
          </h3>
          <p className="text-gray-300 text-sm mb-2 truncate drop-shadow">{item.song.artist}</p>

          {/* Last line preview */}
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="opacity-70">Last line:</span>
            <span className="truncate italic opacity-90" dir="rtl">
              {item.lastLinePreview || "Line 1"}
            </span>
          </div>
        </div>
      </div>

      {/* Resume CTA - prominent button */}
      <div className="p-3 bg-gray-900/90 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(item.lastPracticed)}
          </span>
          <span className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors min-h-[40px]">
            Resume
          </span>
        </div>
      </div>
    </Link>
  );
}
