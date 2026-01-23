import { useState, useEffect, useRef } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { CircularProgressRing } from "./CircularProgressRing";

// Goal type with progress
export type GoalWithProgress = {
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
export const GOAL_CONFIG: Record<string, { icon: string; label: string; unit: string; color: string }> = {
  words: { icon: "📚", label: "Words", unit: "words", color: "from-blue-500 to-cyan-500" },
  time: { icon: "⏱️", label: "Practice Time", unit: "min", color: "from-purple-500 to-pink-500" },
  lines: { icon: "🎵", label: "Lines", unit: "lines", color: "from-emerald-500 to-teal-500" },
};

export interface GoalCardProps {
  goal: GoalWithProgress;
  onEdit: (targetValue: number) => void;
}

export function GoalCard({
  goal,
  onEdit,
}: GoalCardProps) {
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
