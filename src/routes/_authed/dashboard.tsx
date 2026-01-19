import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { useVisitorId } from "../../hooks/useVisitorId";
import { authClient } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import WordDetailsModal from "../../components/WordDetailsModal";

export const Route = createFileRoute("/_authed/dashboard")({
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

// Skeleton Loading Card Component
function SkeletonCard({ height = "h-32" }: { height?: string }) {
  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 ${height} animate-pulse`}>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
        <div className="h-4 bg-gray-800 rounded w-2/3" />
      </div>
    </div>
  );
}

// Collapsible Section Component - Mobile-friendly accordion
function CollapsibleSection({
  title,
  badge,
  filterIndicator,
  defaultExpanded,
  children,
}: {
  title: string;
  badge?: number;
  filterIndicator?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded ?? true);

  return (
    <section className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header - Clickable to expand/collapse on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors md:cursor-default"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {badge !== undefined && badge > 0 && (
            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded-full">
              {badge}
            </span>
          )}
          {filterIndicator && (
            <span className="text-sm text-gray-400">{filterIndicator}</span>
          )}
        </div>
        {/* Chevron - visible on mobile, hidden on md+ */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 md:hidden ${
            isExpanded ? "rotate-180" : ""
          }`}
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

      {/* Content - Collapsible on mobile, always visible on md+ */}
      <div
        className={`transition-all duration-300 ease-in-out md:max-h-none md:opacity-100 ${
          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </section>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const visitorId = useVisitorId();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionPending && !session?.user) {
      navigate({ to: "/login" });
    }
  }, [session, sessionPending, navigate]);

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

  // Get aggregated stats
  const { data: userStats, isLoading: statsLoading } = useQuery(
    convexQuery(api.userStats.getAggregatedStats, {
      visitorId: visitorId || "",
    })
  );

  // Get goals with progress
  const { data: goalsWithProgress, isLoading: goalsLoading, refetch: refetchGoals } = useQuery(
    convexQuery(api.goals.getGoalsWithProgress, {
      visitorId: visitorId || "",
    })
  );

  // Get language progress
  const { data: languageProgress, isLoading: languageLoading } = useQuery(
    convexQuery(api.userStats.getLanguageProgress, {
      visitorId: visitorId || "",
    })
  );

  // Language filter state
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // Word details modal state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);

  // Mobile detection (simple approach)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle word click to open details modal
  const handleWordClick = useCallback((persian: string) => {
    setSelectedWord(persian);
    setIsWordModalOpen(true);
  }, []);

  // Filter data by selected language
  const filteredSongProgress = useMemo(() => {
    if (!songProgress) return [];
    if (!selectedLanguage) return songProgress;
    return songProgress.filter(
      (p) => p.song.sourceLanguage.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [songProgress, selectedLanguage]);

  const filteredVocabulary = useMemo(() => {
    if (!vocabulary) return [];
    if (!selectedLanguage) return vocabulary;
    return vocabulary.filter(
      (v) => v.language.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [vocabulary, selectedLanguage]);

  const filteredWishlist = useMemo(() => {
    if (!wishlist) return [];
    if (!selectedLanguage) return wishlist;
    return wishlist.filter(
      (w) => w.song?.sourceLanguage.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [wishlist, selectedLanguage]);

  const filteredRecentSongs = useMemo(() => {
    if (!recentSongs) return [];
    if (!selectedLanguage) return recentSongs;
    return recentSongs.filter(
      (s) => s.song.sourceLanguage.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [recentSongs, selectedLanguage]);

  // Initialize default goals mutation
  const { mutate: initializeGoals } = useMutation({
    mutationFn: useConvexMutation(api.goals.initializeDefaultGoals),
    onSuccess: () => {
      refetchGoals();
    },
  });

  // Set goal mutation
  const { mutate: setGoal } = useMutation({
    mutationFn: useConvexMutation(api.goals.setGoal),
    onSuccess: () => {
      refetchGoals();
    },
  });

  // Update goal mutation
  const { mutate: updateGoal } = useMutation({
    mutationFn: useConvexMutation(api.goals.updateGoal),
    onSuccess: () => {
      refetchGoals();
    },
  });

  // Initialize goals on first visit (if no goals exist)
  useEffect(() => {
    if (visitorId && goalsWithProgress !== undefined && goalsWithProgress.length === 0) {
      initializeGoals({ visitorId });
    }
  }, [visitorId, goalsWithProgress, initializeGoals]);

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
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Welcome back, {session.user.email}
          </p>
        </div>

        {/* === TOP SECTION: Continue Learning (Most Important) === */}
        {!recentLoading && filteredRecentSongs && filteredRecentSongs.length > 0 && (
          <section className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Continue Learning
              {selectedLanguage && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({getLanguageFlag(selectedLanguage)} filtered)
                </span>
              )}
            </h2>
            <ContinueLearningCarousel items={filteredRecentSongs} />
          </section>
        )}

        {/* === GOALS + STREAK: Side by Side on md+ === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* My Goals Section */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-4">My Goals</h2>
            {goalsLoading || !visitorId ? (
              <SkeletonCard height="h-48" />
            ) : goalsWithProgress && goalsWithProgress.length > 0 ? (
              <MyGoalsSection
                goals={goalsWithProgress}
                onUpdateGoal={(goalId, targetValue) => updateGoal({ goalId, targetValue })}
                onSetGoal={(goalType, period, targetValue) => {
                  if (visitorId) {
                    setGoal({ visitorId, goalType, period, targetValue });
                  }
                }}
              />
            ) : (
              <GoalsEmptyState
                onInitialize={() => visitorId && initializeGoals({ visitorId })}
              />
            )}
          </section>

          {/* Practice Streak Section */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Practice Streak</h2>
            {practiceLoading || !visitorId ? (
              <SkeletonCard height="h-48" />
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
        </div>

        {/* === STATS: Full Width === */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Stats</h2>
          {statsLoading || !visitorId ? (
            <SkeletonCard height="h-32" />
          ) : userStats ? (
            <UserStatsSection stats={userStats} />
          ) : (
            <StatsEmptyState />
          )}
        </section>

        {/* === LANGUAGES: Full Width === */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">My Languages</h2>
          {languageLoading || !visitorId ? (
            <SkeletonCard height="h-24" />
          ) : languageProgress && languageProgress.length > 0 ? (
            <MyLanguagesSection
              languages={languageProgress}
              selectedLanguage={selectedLanguage}
              onSelectLanguage={(lang) =>
                setSelectedLanguage(selectedLanguage === lang ? null : lang)
              }
            />
          ) : (
            <LanguagesEmptyState />
          )}
        </section>

        {/* === MAIN CONTENT: Songs + Vocabulary + Queue === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Songs + Vocabulary (takes 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Songs Section - Collapsible on mobile */}
            <CollapsibleSection
              title="My Songs"
              badge={filteredSongProgress?.length || 0}
              filterIndicator={selectedLanguage ? `(${getLanguageFlag(selectedLanguage)} filtered)` : undefined}
              defaultExpanded={true}
            >
              {progressLoading || !visitorId ? (
                <SkeletonCard height="h-48" />
              ) : filteredSongProgress && filteredSongProgress.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {filteredSongProgress.map((progress) => (
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
              ) : selectedLanguage && songProgress && songProgress.length > 0 ? (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center">
                  <p className="text-gray-400">
                    No songs in {selectedLanguage}. <button onClick={() => setSelectedLanguage(null)} className="text-emerald-400 hover:text-emerald-300 underline">Show all songs</button>
                  </p>
                </div>
              ) : (
                <EmptyState />
              )}
            </CollapsibleSection>

            {/* My Vocabulary Section - Collapsible on mobile */}
            <CollapsibleSection
              title="My Vocabulary"
              badge={vocabulary?.reduce((sum, v) => sum + v.totalWords, 0) || 0}
              filterIndicator={selectedLanguage ? `(${getLanguageFlag(selectedLanguage)} filtered)` : undefined}
              defaultExpanded={false}
            >
              {vocabLoading || !visitorId ? (
                <SkeletonCard height="h-32" />
              ) : filteredVocabulary && filteredVocabulary.length > 0 ? (
                <div className="space-y-4">
                  {filteredVocabulary.map((langGroup) => (
                    <LanguageVocabularySection
                      key={langGroup.language}
                      language={langGroup.language}
                      totalWords={langGroup.totalWords}
                      newCount={langGroup.newCount}
                      learningCount={langGroup.learningCount}
                      masteredCount={langGroup.masteredCount}
                      words={langGroup.words}
                      onWordClick={handleWordClick}
                    />
                  ))}
                </div>
              ) : selectedLanguage && vocabulary && vocabulary.length > 0 ? (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center">
                  <p className="text-gray-400">
                    No vocabulary in {selectedLanguage}. <button onClick={() => setSelectedLanguage(null)} className="text-emerald-400 hover:text-emerald-300 underline">Show all</button>
                  </p>
                </div>
              ) : (
                <VocabularyEmptyState />
              )}
            </CollapsibleSection>
          </div>

          {/* Right Column / Bottom on Mobile: Learning Queue */}
          <div className="lg:col-span-1">
            <CollapsibleSection
              title="Learning Queue"
              badge={filteredWishlist?.length || 0}
              filterIndicator={selectedLanguage ? `(${getLanguageFlag(selectedLanguage)} filtered)` : undefined}
              defaultExpanded={true}
            >
              {wishlistLoading || !visitorId ? (
                <SkeletonCard height="h-32" />
              ) : filteredWishlist && filteredWishlist.length > 0 ? (
                <LearningQueueList
                  items={filteredWishlist}
                  onReorder={handleReorder}
                  onRemove={handleRemoveFromWishlist}
                />
              ) : selectedLanguage && wishlist && wishlist.length > 0 ? (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center">
                  <p className="text-gray-400">
                    No songs in your queue for {selectedLanguage}. <button onClick={() => setSelectedLanguage(null)} className="text-emerald-400 hover:text-emerald-300 underline">Show all</button>
                  </p>
                </div>
              ) : (
                <WishlistEmptyState />
              )}
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* Word Details Modal */}
      <WordDetailsModal
        isOpen={isWordModalOpen}
        onClose={() => setIsWordModalOpen(false)}
        persian={selectedWord}
        isMobile={isMobile}
      />
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
  onWordClick,
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
  onWordClick: (persian: string) => void;
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
              onWordClick={onWordClick}
            />
          )}

          {/* Learning words */}
          {words.learning.length > 0 && (
            <MasteryLevelSection
              level="learning"
              label="Learning"
              count={learningCount}
              words={words.learning}
              onWordClick={onWordClick}
            />
          )}

          {/* New words */}
          {words.new.length > 0 && (
            <MasteryLevelSection
              level="new"
              label="New"
              count={newCount}
              words={words.new}
              onWordClick={onWordClick}
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
  onWordClick,
}: {
  level: "new" | "learning" | "mastered";
  label: string;
  count: number;
  words: VocabWord[];
  onWordClick: (persian: string) => void;
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
              onClick={() => onWordClick(word.persian)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Word Chip Component - clickable to open word details modal
function WordChip({
  word,
  colorSet,
  onClick,
}: {
  word: VocabWord;
  colorSet: {
    chipBg: string;
    chipText: string;
  };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full ${colorSet.chipBg} ${colorSet.chipText} text-sm font-medium hover:opacity-80 hover:scale-105 active:scale-95 transition-all min-h-[36px] flex items-center`}
      title={`${word.transliteration} - ${word.english}`}
    >
      {word.persian}
    </button>
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

// User Stats types
type UserStatsData = {
  totalUniqueWords: number;
  totalLinesPracticed: number;
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
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

// Animated count-up hook
function useCountUp(target: number, duration: number = 1000): number {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOut * target);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [target, duration]);

  return count;
}

// Single Stat Card Component
function StatCard({
  icon,
  label,
  value,
  displayValue,
  subLabel,
  colorClass,
}: {
  icon: string;
  label: string;
  value: number;
  displayValue?: string;
  subLabel?: string;
  colorClass: string;
}) {
  const animatedValue = useCountUp(value);
  const displayVal = displayValue || animatedValue.toLocaleString();

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 p-4 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl sm:text-2xl">{icon}</span>
        <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
        {displayVal}
      </div>
      {subLabel && (
        <div className="text-xs text-gray-500">{subLabel}</div>
      )}
    </div>
  );
}

// User Stats Section Component
function UserStatsSection({ stats }: { stats: UserStatsData }) {
  const hasAnyData =
    stats.totalUniqueWords > 0 ||
    stats.totalLinesPracticed > 0 ||
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
          value={stats.totalLinesPracticed}
          subLabel="lyrics practiced"
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
                const flag = getLanguageFlag(lang.language);
                const percentage =
                  stats.totalUniqueWords > 0
                    ? Math.round((lang.wordCount / stats.totalUniqueWords) * 100)
                    : 0;

                return (
                  <div key={lang.language} className="flex items-center gap-3">
                    <span className="text-lg w-6 flex-shrink-0">{flag}</span>
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
                  <span className="text-2xl sm:text-3xl">
                    {getLanguageFlag(stats.mostPracticedSong.sourceLanguage)}
                  </span>
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

// Stats Empty State Component
function StatsEmptyState() {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
      <div className="text-4xl mb-4">📊</div>
      <h3 className="text-lg font-semibold mb-2">No stats yet</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
        Start practicing songs to see your learning stats! Click on lyrics and words to track your progress.
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

// Goal type with progress
type GoalWithProgress = {
  _id: Id<"userGoals">;
  visitorId: string;
  goalType: string;
  period: string;
  targetValue: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  currentValue: number;
  progress: number;
  isCompleted: boolean;
};

// Goal display config
const GOAL_CONFIG: Record<string, { icon: string; label: string; unit: string; color: string }> = {
  words: { icon: "📚", label: "Words", unit: "words", color: "from-blue-500 to-cyan-500" },
  time: { icon: "⏱️", label: "Practice Time", unit: "min", color: "from-purple-500 to-pink-500" },
  lines: { icon: "🎵", label: "Lines", unit: "lines", color: "from-emerald-500 to-teal-500" },
};

// Circular Progress Ring Component
function CircularProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  colorClass,
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  colorClass: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-gray-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={`transition-all duration-700 ease-out ${colorClass}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="url(#gradient)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" />
            <stop offset="100%" stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Single Goal Card Component
function GoalCard({
  goal,
  onEdit,
}: {
  goal: GoalWithProgress;
  onEdit: (targetValue: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal.targetValue.toString());
  const [showCelebration, setShowCelebration] = useState(false);
  const wasCompletedRef = useRef(goal.isCompleted);

  const config = GOAL_CONFIG[goal.goalType] || GOAL_CONFIG.words;

  // Show celebration when goal is newly completed
  useEffect(() => {
    if (goal.isCompleted && !wasCompletedRef.current) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
    wasCompletedRef.current = goal.isCompleted;
  }, [goal.isCompleted]);

  const handleSave = () => {
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue) && newValue > 0) {
      onEdit(newValue);
    }
    setIsEditing(false);
  };

  const periodLabel = goal.period === "daily" ? "Today" : "This Week";

  return (
    <div
      className={`bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${
        goal.isCompleted ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10" : ""
      }`}
    >
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 animate-pulse flex items-center justify-center z-10">
          <div className="text-4xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Header with period badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">{config.label}</h3>
            <span className="text-xs text-gray-400 capitalize">{periodLabel}</span>
          </div>
        </div>
        {goal.isCompleted && (
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
            Complete!
          </span>
        )}
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center mb-4">
        <CircularProgressRing
          progress={goal.progress}
          size={120}
          strokeWidth={10}
          colorClass={goal.isCompleted ? "text-emerald-500" : "text-blue-500"}
        >
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {goal.progress}%
            </div>
          </div>
        </CircularProgressRing>
      </div>

      {/* Progress text */}
      <div className="text-center mb-4">
        <span className="text-lg font-semibold text-white">
          {goal.currentValue}
        </span>
        <span className="text-gray-400 mx-1">/</span>
        {isEditing ? (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-emerald-500"
            autoFocus
            min={1}
          />
        ) : (
          <button
            onClick={() => {
              setEditValue(goal.targetValue.toString());
              setIsEditing(true);
            }}
            className="text-lg font-semibold text-gray-400 hover:text-emerald-400 transition-colors underline decoration-dashed underline-offset-4"
          >
            {goal.targetValue}
          </button>
        )}
        <span className="text-gray-400 ml-1">{config.unit}</span>
      </div>

      {/* Tap to edit hint */}
      <div className="text-center text-xs text-gray-500">
        Tap target to edit
      </div>
    </div>
  );
}

// My Goals Section Component
function MyGoalsSection({
  goals,
  onUpdateGoal,
  onSetGoal: _onSetGoal, // Prefixed with underscore - reserved for future "add new goal" feature
}: {
  goals: GoalWithProgress[];
  onUpdateGoal: (goalId: Id<"userGoals">, targetValue: number) => void;
  onSetGoal: (goalType: string, period: string, targetValue: number) => void;
}) {
  // Separate daily and weekly goals
  const dailyGoals = goals.filter((g) => g.period === "daily");
  const weeklyGoals = goals.filter((g) => g.period === "weekly");

  return (
    <div className="space-y-6">
      {/* Daily Goals */}
      {dailyGoals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
            Daily Goals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onEdit={(targetValue) => onUpdateGoal(goal._id, targetValue)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Goals */}
      {weeklyGoals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
            Weekly Goals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onEdit={(targetValue) => onUpdateGoal(goal._id, targetValue)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Goals Empty State Component
function GoalsEmptyState({ onInitialize }: { onInitialize: () => void }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
      <div className="text-4xl mb-4">🎯</div>
      <h3 className="text-lg font-semibold mb-2">Set your learning goals</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
        Track your daily and weekly progress with customizable learning goals!
      </p>
      <button
        onClick={onInitialize}
        className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors min-h-[44px]"
      >
        Create Default Goals
      </button>
    </div>
  );
}

// Language progress type for My Languages section
type LanguageProgressData = {
  language: string;
  wordsLearned: number;
  totalWordsAvailable: number;
  wordProgress: number;
  songsPracticed: number;
  linesPracticed: number;
  totalLinesAvailable: number;
  linesProgress: number;
  lastPracticed: number;
};

// Get language display name (capitalize and expand abbreviations)
function getLanguageDisplayName(lang: string): string {
  const names: Record<string, string> = {
    fa: "Persian",
    persian: "Persian",
    farsi: "Farsi",
    ko: "Korean",
    korean: "Korean",
    ar: "Arabic",
    arabic: "Arabic",
    he: "Hebrew",
    hebrew: "Hebrew",
    ja: "Japanese",
    japanese: "Japanese",
    zh: "Chinese",
    chinese: "Chinese",
  };
  return names[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

// My Languages Section Component - Mobile: horizontal scroll, Desktop: grid
function MyLanguagesSection({
  languages,
  selectedLanguage,
  onSelectLanguage,
}: {
  languages: LanguageProgressData[];
  selectedLanguage: string | null;
  onSelectLanguage: (lang: string) => void;
}) {
  return (
    <div>
      {/* Mobile: Horizontal scrolling chips/cards */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4">
          {languages.map((lang) => (
            <LanguageChip
              key={lang.language}
              language={lang}
              isSelected={selectedLanguage === lang.language}
              onSelect={() => onSelectLanguage(lang.language)}
            />
          ))}
          {/* Add a language chip */}
          <AddLanguageChip />
        </div>

        {/* Filter active indicator */}
        {selectedLanguage && (
          <div className="flex items-center justify-between bg-emerald-900/20 rounded-lg px-4 py-2 border border-emerald-500/30">
            <span className="text-sm text-emerald-400">
              Filtering by {getLanguageFlag(selectedLanguage)} {getLanguageDisplayName(selectedLanguage)}
            </span>
            <button
              onClick={() => onSelectLanguage(selectedLanguage)}
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Grid of language cards */}
      <div className="hidden md:block">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {languages.map((lang) => (
            <LanguageCard
              key={lang.language}
              language={lang}
              isSelected={selectedLanguage === lang.language}
              onSelect={() => onSelectLanguage(lang.language)}
            />
          ))}
          {/* Add a language card */}
          <AddLanguageCard />
        </div>

        {/* Filter active indicator for desktop */}
        {selectedLanguage && (
          <div className="mt-4 flex items-center justify-between bg-emerald-900/20 rounded-lg px-4 py-3 border border-emerald-500/30">
            <span className="text-sm text-emerald-400">
              <span className="text-lg mr-2">{getLanguageFlag(selectedLanguage)}</span>
              Dashboard filtered to show only {getLanguageDisplayName(selectedLanguage)} content
            </span>
            <button
              onClick={() => onSelectLanguage(selectedLanguage)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile: Language chip (compact, horizontal scroll item)
function LanguageChip({
  language,
  isSelected,
  onSelect,
}: {
  language: LanguageProgressData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const flag = getLanguageFlag(language.language);
  const displayName = getLanguageDisplayName(language.language);

  return (
    <button
      onClick={onSelect}
      className={`flex-shrink-0 snap-start flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 min-w-[200px] active:scale-[0.98] ${
        isSelected
          ? "bg-emerald-900/30 border-emerald-500 shadow-lg shadow-emerald-500/10"
          : "bg-gray-900 border-gray-800 hover:border-gray-700"
      }`}
    >
      {/* Flag and name */}
      <span className="text-2xl">{flag}</span>
      <div className="flex-1 text-left">
        <div className="font-semibold text-white text-sm">{displayName}</div>
        <div className="text-xs text-gray-400">
          {language.wordsLearned} words · {language.songsPracticed} song{language.songsPracticed !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Progress ring */}
      <div className="w-10 h-10 relative">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
          <circle
            className="text-gray-800"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="20"
            cy="20"
          />
          <circle
            className={isSelected ? "text-emerald-500" : "text-blue-500"}
            strokeWidth="4"
            strokeDasharray={100.53}
            strokeDashoffset={100.53 - (language.wordProgress / 100) * 100.53}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="20"
            cy="20"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{language.wordProgress}%</span>
        </div>
      </div>
    </button>
  );
}

// Desktop: Language card (full details)
function LanguageCard({
  language,
  isSelected,
  onSelect,
}: {
  language: LanguageProgressData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const flag = getLanguageFlag(language.language);
  const displayName = getLanguageDisplayName(language.language);

  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
        isSelected
          ? "bg-emerald-900/30 border-emerald-500 shadow-lg shadow-emerald-500/10"
          : "bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg"
      }`}
    >
      {/* Header with flag, name, and selection indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{flag}</span>
          <div>
            <h3 className="font-bold text-white">{displayName}</h3>
            <p className="text-xs text-gray-400">
              Last practiced {formatRelativeTime(language.lastPracticed)}
            </p>
          </div>
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-lg font-bold text-white">{language.wordsLearned}</div>
          <div className="text-xs text-gray-400">words learned</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-lg font-bold text-white">{language.songsPracticed}</div>
          <div className="text-xs text-gray-400">songs practiced</div>
        </div>
      </div>

      {/* Progress bar with gradient */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Word progress</span>
          <span className="text-white font-medium">{language.wordProgress}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isSelected
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-blue-500 to-purple-500"
            }`}
            style={{ width: `${language.wordProgress}%` }}
          />
        </div>
      </div>

      {/* Tap to filter hint */}
      <div className="text-center text-xs text-gray-500 mt-3">
        {isSelected ? "Tap to clear filter" : "Tap to filter dashboard"}
      </div>
    </button>
  );
}

// Add Language Chip (Mobile) - CTA to browse more songs
function AddLanguageChip() {
  return (
    <Link
      to="/"
      className="flex-shrink-0 snap-start flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-700 hover:border-gray-600 bg-gray-900/50 min-w-[160px] transition-colors"
    >
      <span className="text-2xl text-gray-500">🌍</span>
      <div className="text-left">
        <div className="font-medium text-gray-400 text-sm">Add a language</div>
        <div className="text-xs text-gray-500">Browse songs</div>
      </div>
    </Link>
  );
}

// Add Language Card (Desktop) - CTA to browse more songs
function AddLanguageCard() {
  return (
    <Link
      to="/"
      className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-gray-700 hover:border-gray-600 bg-gray-900/50 transition-all duration-200 hover:shadow-lg min-h-[200px]"
    >
      <span className="text-4xl mb-3 opacity-50">🌍</span>
      <h3 className="font-medium text-gray-400 mb-1">Add a language</h3>
      <p className="text-xs text-gray-500 text-center">
        Browse songs to start learning a new language
      </p>
    </Link>
  );
}

// Languages Empty State Component
function LanguagesEmptyState() {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
      <div className="text-4xl mb-4">🌍</div>
      <h3 className="text-lg font-semibold mb-2">Start learning a language</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
        Practice songs in different languages to see your progress here!
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
