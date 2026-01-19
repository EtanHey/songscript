import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useVisitorId } from "../hooks/useVisitorId";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";
import { useState } from "react";

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

  // Get vocabulary grouped by language
  const { data: vocabulary, isLoading: vocabLoading } = useQuery(
    convexQuery(api.wordProgress.getVocabularyByLanguage, {
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
        <section className="mb-8">
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

        {/* My Vocabulary Section */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">My Vocabulary</h2>

          {vocabLoading || !visitorId ? (
            <div className="text-gray-400">Loading vocabulary...</div>
          ) : vocabulary && vocabulary.length > 0 ? (
            <div className="space-y-4">
              {vocabulary.map((langGroup) => (
                <LanguageVocabularySection
                  key={langGroup.language}
                  language={langGroup.language}
                  totalWords={langGroup.totalWords}
                  newCount={langGroup.newCount}
                  learningCount={langGroup.learningCount}
                  masteredCount={langGroup.masteredCount}
                  words={langGroup.words}
                />
              ))}
            </div>
          ) : (
            <VocabularyEmptyState />
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

// Vocabulary Empty State Component
function VocabularyEmptyState() {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
      <div className="text-4xl mb-4">📚</div>
      <h3 className="text-lg font-semibold mb-2">No words yet</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
        Click on words while practicing songs to add them to your vocabulary!
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

// Word type for vocabulary
type VocabWord = {
  persian: string;
  transliteration: string;
  english: string;
  hebrew: string;
  practiceCount: number;
  lastSeen: number;
  learned: boolean;
  masteryLevel: "new" | "learning" | "mastered";
  sourceLanguage: string;
};

// Language Vocabulary Section - Collapsible accordion
function LanguageVocabularySection({
  language,
  totalWords,
  newCount,
  learningCount,
  masteredCount,
  words,
}: {
  language: string;
  totalWords: number;
  newCount: number;
  learningCount: number;
  masteredCount: number;
  words: {
    new: VocabWord[];
    learning: VocabWord[];
    mastered: VocabWord[];
  };
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const flag = getLanguageFlag(language);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Header - always visible, clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors min-h-[56px]"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{flag}</span>
          <div>
            <h3 className="font-semibold text-white capitalize">{language}</h3>
            <p className="text-sm text-gray-400">{totalWords} words</p>
          </div>
        </div>

        {/* Mastery summary badges */}
        <div className="flex items-center gap-2">
          {masteredCount > 0 && (
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              {masteredCount}
            </span>
          )}
          {learningCount > 0 && (
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
              {learningCount}
            </span>
          )}
          {newCount > 0 && (
            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
              {newCount}
            </span>
          )}
          {/* Expand/collapse icon */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-4 pt-0 space-y-4">
          {/* Mastered words */}
          {words.mastered.length > 0 && (
            <MasteryLevelSection
              level="mastered"
              label="Mastered"
              count={masteredCount}
              words={words.mastered}
            />
          )}

          {/* Learning words */}
          {words.learning.length > 0 && (
            <MasteryLevelSection
              level="learning"
              label="Learning"
              count={learningCount}
              words={words.learning}
            />
          )}

          {/* New words */}
          {words.new.length > 0 && (
            <MasteryLevelSection
              level="new"
              label="New"
              count={newCount}
              words={words.new}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Mastery Level Section - expandable list of words
function MasteryLevelSection({
  level,
  label,
  count,
  words,
}: {
  level: "new" | "learning" | "mastered";
  label: string;
  count: number;
  words: VocabWord[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Colors based on mastery level
  const colors = {
    new: {
      bg: "bg-gray-700/50",
      text: "text-gray-300",
      badge: "bg-gray-500/20 text-gray-400",
      chipBg: "bg-gray-700",
      chipText: "text-gray-200",
    },
    learning: {
      bg: "bg-amber-900/20",
      text: "text-amber-300",
      badge: "bg-amber-500/20 text-amber-400",
      chipBg: "bg-amber-900/40",
      chipText: "text-amber-200",
    },
    mastered: {
      bg: "bg-emerald-900/20",
      text: "text-emerald-300",
      badge: "bg-emerald-500/20 text-emerald-400",
      chipBg: "bg-emerald-900/40",
      chipText: "text-emerald-200",
    },
  };

  const colorSet = colors[level];

  return (
    <div className={`rounded-lg ${colorSet.bg} overflow-hidden`}>
      {/* Level header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-black/10 transition-colors min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <span className={`font-medium ${colorSet.text}`}>{label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${colorSet.badge}`}>
            {count} words
          </span>
        </div>
        <svg
          className={`w-4 h-4 ${colorSet.text} transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Word chips */}
      <div
        className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          {words.map((word) => (
            <WordChip
              key={word.persian}
              word={word}
              colorSet={colorSet}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Word Chip Component with tooltip
function WordChip({
  word,
  colorSet,
}: {
  word: VocabWord;
  colorSet: {
    chipBg: string;
    chipText: string;
  };
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onBlur={() => setShowTooltip(false)}
        className={`px-3 py-1.5 rounded-full ${colorSet.chipBg} ${colorSet.chipText} text-sm font-medium hover:opacity-80 transition-opacity min-h-[36px] flex items-center`}
      >
        {word.persian}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[180px] text-sm">
            <div className="text-white font-semibold mb-1">{word.persian}</div>
            <div className="text-gray-400 text-xs mb-2">{word.transliteration}</div>
            <div className="text-gray-300 mb-2">{word.english}</div>
            <div className="border-t border-gray-700 pt-2 space-y-1 text-xs text-gray-400">
              <div>Practice count: {word.practiceCount}</div>
              <div>Last practiced: {formatRelativeTime(word.lastSeen)}</div>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-gray-700" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
