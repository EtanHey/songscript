import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/test-dashboard")({
  component: TestDashboard,
});

function TestDashboard() {
  const visitorId = "test-visitor-123";

  // Get practice history for heat map
  const { data: practiceHistory, isLoading: practiceLoading } = useQuery(
    convexQuery(api.practiceLog.getPracticeHistory, {
      visitorId,
      days: 90,
    })
  );

  // Get song progress for My Songs
  const { data: songProgress, isLoading: progressLoading } = useQuery(
    convexQuery(api.songProgress.getWithSongDetails, {
      visitorId,
    })
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test Dashboard</h1>
      
      {/* Practice History Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Practice History (Heat Map Data)</h2>
        {practiceLoading ? (
          <div>Loading practice history...</div>
        ) : practiceHistory ? (
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="mb-4">
              <p>Current Streak: {practiceHistory.currentStreak} days</p>
              <p>Longest Streak: {practiceHistory.longestStreak} days</p>
              <p>Total Sessions: {practiceHistory.totalSessions}</p>
              <p>Total Time: {Math.floor(practiceHistory.totalTimeSeconds / 60)} minutes</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Practice Data:</h3>
              {practiceHistory.practiceData.length > 0 ? (
                <div className="space-y-2">
                  {practiceHistory.practiceData.map((day) => (
                    <div key={day.date} className="flex justify-between">
                      <span>{day.date}</span>
                      <span>{day.practiceCount} sessions, {Math.floor(day.totalSeconds / 60)}min</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No practice data found</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-red-400">Failed to load practice history</div>
        )}
      </div>

      {/* Song Progress Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">My Songs</h2>
        {progressLoading ? (
          <div>Loading song progress...</div>
        ) : songProgress ? (
          <div className="bg-gray-900 p-4 rounded-lg">
            {songProgress.length > 0 ? (
              <div className="space-y-4">
                {songProgress.map((progress) => (
                  <div key={progress._id} className="border border-gray-700 p-4 rounded">
                    <h3 className="font-semibold">{progress.song.title}</h3>
                    <p className="text-gray-400">{progress.song.artist}</p>
                    <p>Progress: {progress.progressPercent}%</p>
                    <p>Lines completed: {progress.linesCompleted.length}/{progress.totalLines}</p>
                    <p>Last practiced: {new Date(progress.lastPracticed).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No songs in progress</p>
            )}
          </div>
        ) : (
          <div className="text-red-400">Failed to load song progress</div>
        )}
      </div>
    </div>
  );
}
