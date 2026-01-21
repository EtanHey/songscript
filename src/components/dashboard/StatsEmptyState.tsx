import { Link } from "@tanstack/react-router";

export function StatsEmptyState() {
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
