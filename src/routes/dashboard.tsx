import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useVisitorId } from "../hooks/useVisitorId";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

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

// Helper to get language flag emoji
function getLanguageFlag(sourceLanguage: string): string {
  switch (sourceLanguage.toLowerCase()) {
    case "fa":
    case "persian":
    case "farsi":
      return "🇮🇷";
    case "ko":
    case "korean":
      return "🇰🇷";
    case "ar":
    case "arabic":
      return "🇸🇦";
    case "he":
    case "hebrew":
      return "🇮🇱";
    case "ja":
    case "japanese":
      return "🇯🇵";
    case "zh":
    case "chinese":
      return "🇨🇳";
    default:
      return "🌍";
  }
}

function DashboardPage() {
  const navigate = useNavigate();
  const visitorId = useVisitorId();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Get song progress with details
  const { data: songProgress, isLoading: progressLoading } = useQuery(
    convexQuery(api.songProgress.getWithSongDetails, {
      visitorId: visitorId || "",
    })
  );

  // Show loading state briefly
  if (sessionPending) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">
              Sign in to access your dashboard and track your progress.
            </p>
            <Button onClick={() => navigate({ to: "/login" })}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Welcome back, {session.user.email}
          </p>
        </div>

        {/* My Songs Section */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">My Songs</h2>

          {progressLoading || !visitorId ? (
            <div className="text-gray-400">Loading your progress...</div>
          ) : songProgress && songProgress.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {songProgress.map((progress) => (
                <SongProgressCard
                  key={progress._id}
                  title={progress.song.title}
                  artist={progress.song.artist}
                  sourceLanguage={progress.song.sourceLanguage}
                  youtubeId={progress.song.youtubeId}
                  progressPercent={progress.progressPercent}
                  linesCompleted={progress.linesCompleted.length}
                  totalLines={progress.totalLines}
                  lastPracticed={progress.lastPracticed}
                  songId={progress.songId}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </div>
  );
}

// Song Progress Card Component
function SongProgressCard({
  title,
  artist,
  sourceLanguage,
  youtubeId,
  progressPercent,
  linesCompleted,
  totalLines,
  lastPracticed,
  songId,
}: {
  title: string;
  artist: string;
  sourceLanguage: string;
  youtubeId: string;
  progressPercent: number;
  linesCompleted: number;
  totalLines: number;
  lastPracticed: number;
  songId: string;
}) {
  const flag = getLanguageFlag(sourceLanguage);

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
          {flag}
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

// Empty State Component
function EmptyState() {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
      <div className="text-4xl mb-4">🎵</div>
      <h3 className="text-lg font-semibold mb-2">No songs yet</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
        Start practicing a song to track your progress! Click on any line to
        mark it as practiced.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors min-h-[44px]"
      >
        Browse Songs
      </Link>
    </div>
  );
}
