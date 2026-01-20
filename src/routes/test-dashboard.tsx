import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/test-dashboard")({
  component: TestDashboard,
});

function TestDashboard() {
  const visitorId = "test-visitor-123";

  // Get practice history for heat map
  const { data: practiceHistory, isLoading: practiceLoading, error: practiceError } = useQuery(
    convexQuery(api.practiceLog.getPracticeHistory, {
      visitorId,
      days: 90,
    })
  );

  // Get song progress for My Songs
  const { data: songProgress, isLoading: progressLoading, error: progressError } = useQuery(
    convexQuery(api.songProgress.getWithSongDetails, {
      visitorId,
    })
  );

  // Get aggregated stats
  const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery(
    convexQuery(api.userStats.getAggregatedStats, {
      visitorId,
    })
  );

  // Debug query to check database
  const { data: debugData, isLoading: debugLoading } = useQuery(
    convexQuery(api.debug.checkPracticeData, {
      visitorId,
    })
  );

  // Create test data mutation
  const { mutate: createTestData, isPending: creatingTestData } = useMutation({
    mutationFn: useConvexMutation(api.debug.createTestPracticeData),
    onSuccess: () => {
      // Refetch all data after creating test data
      window.location.reload();
    },
  });

  console.log("TestDashboard data:", { practiceHistory, songProgress, userStats, debugData });
  console.log("TestDashboard errors:", { practiceError, progressError, statsError });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test Dashboard</h1>
      
      {/* Debug Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Debug Data</h2>
        {debugLoading ? (
          <div>Loading debug data...</div>
        ) : debugData ? (
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="mb-4">
              <p>Total Practice Logs in DB: {debugData.totalPracticeLogs}</p>
              <p>Total Song Progress in DB: {debugData.totalSongProgress}</p>
              <p>Total Word Progress in DB: {debugData.totalWordProgress}</p>
              <p>Visitor Practice Logs: {debugData.visitorPracticeLogs}</p>
              <p>Visitor Song Progress: {debugData.visitorSongProgress}</p>
              <p>Visitor Word Progress: {debugData.visitorWordProgress}</p>
              <button 
                onClick={() => createTestData({ visitorId })}
                disabled={creatingTestData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingTestData ? "Creating..." : "Create Test Data"}
              </button>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sample Data:</h3>
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify({ 
                  samplePracticeLogs: debugData.samplePracticeLogs,
                  sampleSongProgress: debugData.sampleSongProgress,
                  sampleWordProgress: debugData.sampleWordProgress
                }, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-red-400">Failed to load debug data</div>
        )}
      </div>
      
      {/* User Stats Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">User Stats</h2>
        {statsLoading ? (
          <div>Loading user stats...</div>
        ) : userStats ? (
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="mb-4">
              <p>Total Unique Words: {userStats.totalUniqueWords}</p>
              <p>Total Lines Learned: {userStats.totalLinesLearned}</p>
              <p>Total Practice Time: {Math.floor(userStats.totalPracticeTimeSeconds / 60)} minutes</p>
              <p>Songs In Progress: {userStats.songsInProgress}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Language Breakdown:</h3>
              {userStats.languageBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {userStats.languageBreakdown.map((lang) => (
                    <div key={lang.language} className="flex justify-between">
                      <span>{lang.language}</span>
                      <span>{lang.wordCount} words</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No language data found</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-red-400">Failed to load user stats: {statsError?.message}</div>
        )}
      </div>

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
