export interface GoalsEmptyStateProps {
  onInitialize: () => void;
}

export function GoalsEmptyState({ onInitialize }: GoalsEmptyStateProps) {
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
