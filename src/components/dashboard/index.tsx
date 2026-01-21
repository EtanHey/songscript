// Dashboard components barrel export

// Icons
export { ChevronUpIcon, ChevronDownIcon, XIcon, GripVerticalIcon } from "./icons";

// Skeleton/Loading
export { SkeletonCard } from "./SkeletonCard";
export type { SkeletonCardProps } from "./SkeletonCard";

// Layout
export { CollapsibleSection } from "./CollapsibleSection";
export type { CollapsibleSectionProps } from "./CollapsibleSection";

// Continue Learning
export { ContinueLearningCarousel, type RecentSong } from "./ContinueLearningCarousel";
export { ContinueLearningCard } from "./ContinueLearningCard";

// Songs
export { SongProgressCard } from "./SongProgressCard";
export { EmptyState } from "./EmptyState";

// Vocabulary
export { VocabularyEmptyState } from "./VocabularyEmptyState";
export { LanguageVocabularySection } from "./LanguageVocabularySection";
export { MasteryLevelSection } from "./MasteryLevelSection";
export { WordChip } from "./WordChip";

// Wishlist / Learning Queue
export { WishlistEmptyState } from "./WishlistEmptyState";
export { LearningQueueList } from "./LearningQueueList";
export { QueueCardDesktop } from "./QueueCardDesktop";
export { QueueCardMobile } from "./QueueCardMobile";

// Practice Streak
export { PracticeStreakSection } from "./PracticeStreakSection";
export type { PracticeDay, PracticeStreakSectionProps } from "./PracticeStreakSection";
export { StreakEmptyState } from "./StreakEmptyState";

// Stats
export { StatCard } from "./StatCard";
export { UserStatsSection } from "./UserStatsSection";
export type { UserStatsData, UserStatsSectionProps } from "./UserStatsSection";
export { StatsEmptyState } from "./StatsEmptyState";

// Goals
export { CircularProgressRing } from "./CircularProgressRing";
export { GoalCard } from "./GoalCard";
export type { GoalWithProgress } from "./GoalCard";
export { MyGoalsSection } from "./MyGoalsSection";
export type { MyGoalsSectionProps } from "./MyGoalsSection";
export { GoalsEmptyState } from "./GoalsEmptyState";

// Languages
export { MyLanguagesSection } from "./MyLanguagesSection";
export type { MyLanguagesSectionProps } from "./MyLanguagesSection";
export { LanguageChip, getLanguageDisplayName } from "./LanguageChip";
export type { LanguageChipProps, LanguageProgressData } from "./LanguageChip";
export { LanguageCard } from "./LanguageCard";
export type { LanguageCardProps } from "./LanguageCard";
export { AddLanguageChip } from "./AddLanguageChip";
export { AddLanguageCard } from "./AddLanguageCard";
export { LanguagesEmptyState } from "./LanguagesEmptyState";
