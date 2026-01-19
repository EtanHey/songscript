import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useVisitorId } from "../hooks/useVisitorId";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";
import { useState, useCallback, useMemo } from "react";
import type { Id } from "../../convex/_generated/dataModel";

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

  // Get wishlist / learning queue
  const { data: wishlist, isLoading: wishlistLoading, refetch: refetchWishlist } = useQuery(
    convexQuery(api.wishlist.getByVisitor, {
      visitorId: visitorId || "",
    })
  );

  // Get practice history for streaks
  const { data: practiceHistory, isLoading: practiceLoading } = useQuery(
    convexQuery(api.practiceLog.getPracticeHistory, {
      visitorId: visitorId || "",
      days: 90,
    })
  );

  // Get recent songs for "Continue Learning" section
  const { data: recentSongs, isLoading: recentLoading } = useQuery(
    convexQuery(api.songProgress.getRecentForContinue, {
      visitorId: visitorId || "",
    })
  );

  // Reorder mutation
  const { mutate: reorderWishlist } = useMutation({
    mutationFn: useConvexMutation(api.wishlist.reorderWishlist),
    onSuccess: () => {
      refetchWishlist();
    },
  });

  // Remove from wishlist mutation
  const { mutate: removeFromWishlist } = useMutation({
    mutationFn: useConvexMutation(api.wishlist.removeFromWishlist),
    onSuccess: () => {
      refetchWishlist();
    },
  });

  // Handle reorder via drag or buttons
  const handleReorder = useCallback(
    (songIds: Id<"songs">[]) => {
      if (!visitorId) return;
      reorderWishlist({ visitorId, songIds });
    },
    [visitorId, reorderWishlist]
  );

  // Handle remove from wishlist
  const handleRemoveFromWishlist = useCallback(
    (songId: Id<"songs">) => {
      if (!visitorId) return;
      removeFromWishlist({ visitorId, songId });
    },
    [visitorId, removeFromWishlist]
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

        {/* Continue Learning Section - Only show if there are recent songs */}
        {!recentLoading && recentSongs && recentSongs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Continue Learning</h2>
            <ContinueLearningCarousel items={recentSongs} />
          </section>
        )}

        {/* Practice Streak Section */}
        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Practice Streak</h2>

          {practiceLoading || !visitorId ? (
            <div className="text-gray-400">Loading your streaks...</div>
          ) : practiceHistory ? (
            <PracticeStreakSection
              currentStreak={practiceHistory.currentStreak}
              longestStreak={practiceHistory.longestStreak}
              practiceData={practiceHistory.practiceData}
            />
          ) : (
            <StreakEmptyState />
          )}
        </section>

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

        {/* Learning Queue Section */}
        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">My Learning Queue</h2>

          {wishlistLoading || !visitorId ? (
            <div className="text-gray-400">Loading your queue...</div>
          ) : wishlist && wishlist.length > 0 ? (
            <LearningQueueList
              items={wishlist}
              onReorder={handleReorder}
              onRemove={handleRemoveFromWishlist}
            />
          ) : (
            <WishlistEmptyState />
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

// Recent song type for Continue Learning
type RecentSong = {
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
    videoUrl?: string;
  };
  totalLines: number;
  progressPercent: number;
};

// Continue Learning Carousel - Mobile: Swipeable, Desktop: Row
function ContinueLearningCarousel({ items }: { items: RecentSong[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  return (
    <div>
      {/* Mobile: Swipeable carousel with snap scrolling */}
      <div className="md:hidden">
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4"
          onScroll={(e) => {
            const container = e.currentTarget;
            const scrollPosition = container.scrollLeft;
            const cardWidth = container.offsetWidth - 32; // Account for padding
            const newIndex = Math.round(scrollPosition / cardWidth);
            setActiveIndex(Math.min(newIndex, items.length - 1));
          }}
        >
          {items.map((item) => (
            <ContinueLearningCard key={item._id} item={item} className="flex-shrink-0 w-[calc(100%-2rem)] snap-center" />
          ))}
        </div>

        {/* Dot indicators - only show if more than 1 card */}
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            {items.map((item, index) => (
              <button
                key={item._id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeIndex ? "bg-emerald-500" : "bg-gray-600"
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Horizontal row */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {items.map((item) => (
          <ContinueLearningCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}

// Continue Learning Card Component
function ContinueLearningCard({
  item,
  className = "",
}: {
  item: RecentSong;
  className?: string;
}) {
  const flag = getLanguageFlag(item.song.sourceLanguage);

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
          src={`https://i.ytimg.com/vi_webp/mVcc0HFnEOo/maxresdefault.webp`}
          alt={`${item.song.title} thumbnail`}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to YouTube thumbnail if custom image fails
            e.currentTarget.src = "https://img.youtube.com/vi/mVcc0HFnEOo/mqdefault.jpg";
          }}
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Progress badge */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
          {item.progressPercent}%
        </div>

        {/* Language flag */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-sm">
          {flag}
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

// Wishlist Empty State Component
function WishlistEmptyState() {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
      <div className="text-4xl mb-4">💜</div>
      <h3 className="text-lg font-semibold mb-2">No songs in your queue</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
        Browse songs and tap the heart icon to add them to your learning queue!
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

// Wishlist item type
type WishlistItem = {
  _id: Id<"userWishlist">;
  songId: Id<"songs">;
  sortOrder: number;
  addedAt: number;
  song: {
    _id: Id<"songs">;
    title: string;
    artist: string;
    youtubeId: string;
    sourceLanguage: string;
  } | null;
};

// Learning Queue List Component with reordering
function LearningQueueList({
  items,
  onReorder,
  onRemove,
}: {
  items: WishlistItem[];
  onReorder: (songIds: Id<"songs">[]) => void;
  onRemove: (songId: Id<"songs">) => void;
}) {
  // Track drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Create new order
      const newItems = [...items];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(dragOverIndex, 0, draggedItem);

      // Get new song IDs in order
      const newSongIds = newItems.map((item) => item.songId);
      onReorder(newSongIds);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle move up (via button)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onReorder(newItems.map((item) => item.songId));
  };

  // Handle move down (via button)
  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onReorder(newItems.map((item) => item.songId));
  };

  return (
    <div className="space-y-2">
      {/* Desktop: Grid view */}
      <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item, index) => (
          item.song && (
            <QueueCardDesktop
              key={item._id}
              item={item}
              index={index}
              totalItems={items.length}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onRemove={() => onRemove(item.songId)}
            />
          )
        ))}
      </div>

      {/* Mobile: List view with drag handles */}
      <div className="lg:hidden space-y-2">
        {items.map((item, index) => (
          item.song && (
            <QueueCardMobile
              key={item._id}
              item={item}
              index={index}
              totalItems={items.length}
              isDragging={draggedIndex === index}
              isDragOver={dragOverIndex === index}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onRemove={() => onRemove(item.songId)}
            />
          )
        ))}
      </div>
    </div>
  );
}

// Desktop Queue Card - Grid style with hover actions
function QueueCardDesktop({
  item,
  index,
  totalItems,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  item: WishlistItem;
  index: number;
  totalItems: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const song = item.song!;
  const flag = getLanguageFlag(song.sourceLanguage);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-emerald-500/50 transition-all duration-200 group">
      {/* Thumbnail with order badge and actions */}
      <div className="aspect-video w-full bg-gray-800 relative">
        <img
          src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
          alt={`${song.title} thumbnail`}
          className="h-full w-full object-cover"
        />

        {/* Order badge */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-semibold">
          #{index + 1}
        </div>

        {/* Language flag */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-sm">
          {flag}
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-30 transition-colors"
            aria-label="Move up"
          >
            <ChevronUpIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalItems - 1}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-30 transition-colors"
            aria-label="Move down"
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 bg-red-900/80 rounded-lg hover:bg-red-800 transition-colors"
            aria-label="Remove from queue"
          >
            <XIcon className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">{song.title}</h3>
        <p className="text-gray-400 text-sm mb-3 truncate">{song.artist}</p>

        {/* Start Learning button */}
        <Link
          to="/song/$songId"
          params={{ songId: song._id }}
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px]"
        >
          Start Learning
        </Link>
      </div>
    </div>
  );
}

// Mobile Queue Card - List style with visible drag handles
function QueueCardMobile({
  item,
  index,
  totalItems,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  item: WishlistItem;
  index: number;
  totalItems: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const song = item.song!;
  const flag = getLanguageFlag(song.sourceLanguage);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-gray-900 rounded-lg border overflow-hidden transition-all duration-200
        ${isDragging ? "opacity-50 border-primary" : "border-gray-800"}
        ${isDragOver ? "border-emerald-500 border-2" : ""}`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none">
          <GripVerticalIcon className="w-5 h-5 text-gray-500" />
        </div>

        {/* Order number */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-gray-800">
          <img
            src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
            alt={`${song.title} thumbnail`}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{flag}</span>
            <h4 className="font-medium text-white truncate text-sm">{song.title}</h4>
          </div>
          <p className="text-gray-400 text-xs truncate">{song.artist}</p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {/* Move buttons */}
          <div className="flex flex-col">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
              aria-label="Move up"
            >
              <ChevronUpIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalItems - 1}
              className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
              aria-label="Move down"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Start button */}
          <Link
            to="/song/$songId"
            params={{ songId: song._id }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors min-h-[36px] flex items-center"
          >
            Start
          </Link>

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-900/50 rounded transition-colors"
            aria-label="Remove from queue"
          >
            <XIcon className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Streak Empty State Component
function StreakEmptyState() {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
      <div className="text-4xl mb-4">🔥</div>
      <h3 className="text-lg font-semibold mb-2">Start your streak!</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
        Practice songs regularly to build your streak and see your progress on the calendar!
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors min-h-[44px]"
      >
        Start Practicing
      </Link>
    </div>
  );
}

// Practice data type
type PracticeDay = {
  date: string;
  practiceCount: number;
  totalSeconds: number;
};

// Practice Streak Section Component with heatmap
// Selected day type for heatmap (includes date even if no data)
type SelectedDayInfo = {
  date: string;
  data: PracticeDay | null;
};

function PracticeStreakSection({
  currentStreak,
  longestStreak,
  practiceData,
}: {
  currentStreak: number;
  longestStreak: number;
  practiceData: PracticeDay[];
}) {
  const [selectedDay, setSelectedDay] = useState<SelectedDayInfo | null>(null);

  // Generate 90 days of data for the heatmap
  const heatmapData = useMemo(() => {
    const practiceMap = new Map(practiceData.map((d) => [d.date, d]));
    const days: { date: string; data: PracticeDay | null }[] = [];

    for (let i = 89; i >= 0; i--) {
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
    if (ratio >= 0.75) return "bg-green-500";
    if (ratio >= 0.5) return "bg-green-600";
    if (ratio >= 0.25) return "bg-green-700";
    return "bg-green-800";
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
          <span className="text-xs text-gray-400">Last 90 days</span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-800" />
            <div className="w-3 h-3 rounded-sm bg-green-700" />
            <div className="w-3 h-3 rounded-sm bg-green-600" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid - scrollable on mobile */}
        <div className="overflow-x-auto md:overflow-x-visible pb-2">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: "repeat(13, minmax(24px, 1fr))",
              gridTemplateRows: "repeat(7, minmax(24px, 1fr))",
              gridAutoFlow: "column",
              minWidth: "340px",
            }}
          >
            {heatmapData.map((day) => {
              const dayOfWeek = new Date(day.date).getDay();

              return (
                <button
                  key={day.date}
                  onClick={() =>
                    setSelectedDay(selectedDay?.date === day.date ? null : day)
                  }
                  className={`
                    w-6 h-6 min-w-[24px] min-h-[24px] rounded-sm transition-all duration-150
                    ${getIntensityClass(day.data)}
                    ${selectedDay?.date === day.date ? "ring-2 ring-white" : ""}
                    hover:ring-2 hover:ring-gray-500
                  `}
                  style={{
                    gridRow: dayOfWeek + 1,
                  }}
                  aria-label={`${formatDate(day.date)}: ${day.data?.practiceCount || 0} practice sessions`}
                />
              );
            })}
          </div>
        </div>

        {/* Selected Day Tooltip */}
        {selectedDay && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div className="font-medium text-white mb-1">
              {formatDate(selectedDay.date)}
            </div>
            {selectedDay.data ? (
              <div className="text-sm text-gray-300 space-y-1">
                <div>
                  {selectedDay.data.practiceCount} practice{" "}
                  {selectedDay.data.practiceCount === 1 ? "session" : "sessions"}
                </div>
                <div>Total time: {formatDuration(selectedDay.data.totalSeconds)}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No practice this day</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple icon components
function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function GripVerticalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}
