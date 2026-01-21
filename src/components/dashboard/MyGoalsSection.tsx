import type { Id } from "@convex/_generated/dataModel";
import { GoalCard } from "./GoalCard";
import type { GoalWithProgress } from "./GoalCard";

export interface MyGoalsSectionProps {
  goals: GoalWithProgress[];
  onUpdateGoal: (goalId: Id<"userGoals">, targetValue: number) => void;
  onSetGoal: (goalType: string, period: string, targetValue: number) => void;
}

export function MyGoalsSection({
  goals,
  onUpdateGoal,
  onSetGoal: _onSetGoal, // Prefixed with underscore - reserved for future "add new goal" feature
}: MyGoalsSectionProps) {
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
          <div className={`grid gap-4 ${
            dailyGoals.length === 1 ? "grid-cols-1" :
            dailyGoals.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}>
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
          <div className={`grid gap-4 ${
            weeklyGoals.length === 1 ? "grid-cols-1" :
            weeklyGoals.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}>
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

// Re-export GoalWithProgress type for convenience
export type { GoalWithProgress };
