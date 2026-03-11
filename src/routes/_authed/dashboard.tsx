import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { authClient } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Id } from "@convex/_generated/dataModel";
import WordDetailsModal from "../../components/WordDetailsModal";
import { getLanguageFlagString } from "../../components/LanguageFlag";
import { MigrationConfirmModal, shouldShowMigrationModal } from "../../components/MigrationConfirmModal";

// Import dashboard components
import {
  SkeletonCard,
  CollapsibleSection,
  ContinueLearningCarousel,
  SongProgressCard,
  EmptyState,
  VocabularyEmptyState,
  LanguageVocabularySection,
  WishlistEmptyState,
  LearningQueueList,
  PracticeStreakSection,
  StreakEmptyState,
  UserStatsSection,
  StatsEmptyState,
  MyGoalsSection,
  GoalsEmptyState,
  MyLanguagesSection,
  LanguagesEmptyState,
  LeaderboardMiniSection,
} from "../../components/dashboard";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionPending && !session?.user) {
      navigate({ to: "/login" });
    }
  }, [session, sessionPending, navigate]);

  // Ensure app user exists (fallback for race condition)
  const ensureAppUser = useConvexMutation(api.users.ensureAppUser);
  
  // Check if session exists but app user is missing, trigger ensureAppUser
  useEffect(() => {
    if (session?.user && !sessionPending) {
      // Try to ensure app user exists as a fallback
      ensureAppUser({}).catch((error) => {
        console.warn('Dashboard ensureAppUser fallback failed:', error);
        // Don't throw - this is a fallback mechanism
      });
    }
  }, [session, sessionPending, ensureAppUser]);

  // Get song progress with details
  const { data: songProgress, isLoading: progressLoading } = useQuery(
    convexQuery(api.songProgress.getWithSongDetails, {})
  );

  // Get vocabulary grouped by language
  const { data: vocabulary, isLoading: vocabLoading } = useQuery(
    convexQuery(api.wordProgress.getVocabularyByLanguage, {})
  );

  // Get wishlist / learning queue
  const { data: wishlist, isLoading: wishlistLoading, refetch: refetchWishlist } = useQuery(
    convexQuery(api.wishlist.getWishlist, {})
  );

  // Get practice history for streaks
  const { data: practiceHistory, isLoading: practiceLoading } = useQuery(
    convexQuery(api.practiceLog.getPracticeHistory, {
      days: 90,
    })
  );

  // Get recent songs for "Continue Learning" section
  const { data: recentSongs, isLoading: recentLoading } = useQuery(
    convexQuery(api.songProgress.getRecentForContinue, {})
  );

  // Get aggregated stats
  const { data: userStats, isLoading: statsLoading } = useQuery(
    convexQuery(api.userStats.getAggregatedStats, {})
  );

  // Get goals with progress
  const { data: goalsWithProgress, isLoading: goalsLoading, refetch: refetchGoals } = useQuery(
    convexQuery(api.goals.getGoalsWithProgress, {})
  );

  // Get language progress
  const { data: languageProgress, isLoading: languageLoading } = useQuery(
    convexQuery(api.userStats.getLanguageProgress, {})
  );

  // Language filter state
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // Word details modal state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);

  // Migration modal state
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  // Mobile detection (simple approach)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check if migration modal should be shown (once per session)
  useEffect(() => {
    if (session?.user?.id && !migrationChecked) {
      setMigrationChecked(true);
      if (shouldShowMigrationModal(session.user.id)) {
        // Small delay to let dashboard render first
        const timer = setTimeout(() => {
          setIsMigrationModalOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [session?.user?.id, migrationChecked]);

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
      (p: typeof songProgress[0]) => p.song.sourceLanguage.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [songProgress, selectedLanguage]);

  const filteredVocabulary = useMemo(() => {
    if (!vocabulary) return [];
    if (!selectedLanguage) return vocabulary;
    return vocabulary.filter(
      (v: typeof vocabulary[0]) => v.language.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [vocabulary, selectedLanguage]);

  const filteredWishlist = useMemo(() => {
    if (!wishlist) return [];
    if (!selectedLanguage) return wishlist;
    return wishlist.filter(
      (w: typeof wishlist[0]) => w.song?.sourceLanguage.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [wishlist, selectedLanguage]);

  const filteredRecentSongs = useMemo(() => {
    if (!recentSongs) return [];
    if (!selectedLanguage) return recentSongs;
    return recentSongs.filter(
      (s: typeof recentSongs[0]) => s.song.sourceLanguage.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [recentSongs, selectedLanguage]);

  // Convex mutations (extracted outside useMutation)
  const initializeDefaultGoalsMutation = useConvexMutation(api.goals.initializeDefaultGoals);
  const setGoalMutation = useConvexMutation(api.goals.setGoal);
  const updateGoalMutation = useConvexMutation(api.goals.updateGoal);
  const reorderWishlistMutation = useConvexMutation(api.wishlist.reorderWishlist);
  const removeFromWishlistMutation = useConvexMutation(api.wishlist.removeFromWishlist);

  // Track retry state for goals initialization
  const goalsRetryRef = useRef({ count: 0, timerId: null as ReturnType<typeof setTimeout> | null });

  // Clean up any pending retry on unmount
  useEffect(() => {
    return () => {
      if (goalsRetryRef.current.timerId) {
        clearTimeout(goalsRetryRef.current.timerId);
      }
    };
  }, []);

  // Initialize default goals mutation with error handling and capped retry
  const { mutate: initializeGoals } = useMutation({
    mutationFn: (args: any) => initializeDefaultGoalsMutation(args),
    onSuccess: () => {
      goalsRetryRef.current.count = 0;
      refetchGoals();
    },
    onError: (error) => {
      console.warn('Initialize goals failed:', error);
      // Retry up to 3 times with increasing delay if authentication error
      if (error.message?.includes('Authentication required') && goalsRetryRef.current.count < 3) {
        goalsRetryRef.current.count++;
        const delay = 2000 * goalsRetryRef.current.count;
        goalsRetryRef.current.timerId = setTimeout(() => {
          goalsRetryRef.current.timerId = null;
          initializeGoals({});
        }, delay);
      }
    },
  });

  // Set goal mutation
  const { mutate: setGoal } = useMutation({
    mutationFn: (args: any) => setGoalMutation(args),
    onSuccess: () => {
      refetchGoals();
    },
  });

  // Update goal mutation
  const { mutate: updateGoal } = useMutation({
    mutationFn: (args: any) => updateGoalMutation(args),
    onSuccess: () => {
      refetchGoals();
    },
  });

  // Initialize goals on first visit (if no goals exist) with retry logic
  useEffect(() => {
    if (goalsWithProgress !== undefined && goalsWithProgress.length === 0 && session?.user) {
      // Add a longer delay to ensure session is stable, with retry mechanism
      const timer = setTimeout(() => {
        initializeGoals({});
      }, 2000); // Increased from 1000ms to 2000ms
      return () => clearTimeout(timer);
    }
  }, [goalsWithProgress, initializeGoals, session]);

  // Reorder mutation
  const { mutate: reorderWishlist } = useMutation({
    mutationFn: (args: any) => reorderWishlistMutation(args),
    onSuccess: () => {
      refetchWishlist();
    },
  });

  // Remove from wishlist mutation
  const { mutate: removeFromWishlist } = useMutation({
    mutationFn: (args: any) => removeFromWishlistMutation(args),
    onSuccess: () => {
      refetchWishlist();
    },
  });

  // Handle reorder via drag or buttons
  const handleReorder = useCallback(
    (songIds: Id<"songs">[]) => {
      reorderWishlist({ songIds });
    },
    [reorderWishlist]
  );

  // Handle remove from wishlist
  const handleRemoveFromWishlist = useCallback(
    (songId: Id<"songs">) => {
      removeFromWishlist({ songId });
    },
    [removeFromWishlist]
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
                  ({getLanguageFlagString(selectedLanguage)} filtered)
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
            {goalsLoading ? (
              <SkeletonCard height="h-48" />
            ) : goalsWithProgress && goalsWithProgress.length > 0 ? (
              <MyGoalsSection
                goals={goalsWithProgress}
                onUpdateGoal={(goalId, targetValue) => updateGoal({ goalId, targetValue })}
                onSetGoal={(goalType, period, targetValue) => {
                  setGoal({ goalType, period, targetValue });
                }}
              />
            ) : (
              <GoalsEmptyState
                onInitialize={() => initializeGoals({})}
              />
            )}
          </section>

          {/* Practice Streak Section */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Practice Streak</h2>
            {practiceLoading ? (
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
          {statsLoading ? (
            <SkeletonCard height="h-32" />
          ) : userStats ? (
            <UserStatsSection stats={userStats} />
          ) : (
            <StatsEmptyState />
          )}
        </section>

        {/* === LEADERBOARD: Full Width === */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Leaderboard</h2>
          {!session?.user ? (
            <SkeletonCard height="h-48" />
          ) : (
            <LeaderboardMiniSection />
          )}
        </section>

        {/* === LANGUAGES: Full Width === */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">My Languages</h2>
          {languageLoading ? (
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
              filterIndicator={selectedLanguage ? `(${getLanguageFlagString(selectedLanguage)} filtered)` : undefined}
              defaultExpanded={true}
            >
              {progressLoading ? (
                <SkeletonCard height="h-48" />
              ) : filteredSongProgress && filteredSongProgress.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {filteredSongProgress.map((progress: typeof filteredSongProgress[0]) => (
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
              badge={vocabulary?.reduce((sum: number, v: typeof vocabulary[0]) => sum + v.totalWords, 0) || 0}
              filterIndicator={selectedLanguage ? `(${getLanguageFlagString(selectedLanguage)} filtered)` : undefined}
              defaultExpanded={false}
            >
              {vocabLoading ? (
                <SkeletonCard height="h-32" />
              ) : filteredVocabulary && filteredVocabulary.length > 0 ? (
                <div className="space-y-4">
                  {filteredVocabulary.map((langGroup: typeof filteredVocabulary[0]) => (
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
              filterIndicator={selectedLanguage ? `(${getLanguageFlagString(selectedLanguage)} filtered)` : undefined}
              defaultExpanded={true}
            >
              {wishlistLoading ? (
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

      {/* Migration Confirm Modal */}
      {session?.user?.id && (
        <MigrationConfirmModal
          isOpen={isMigrationModalOpen}
          onClose={() => setIsMigrationModalOpen(false)}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
