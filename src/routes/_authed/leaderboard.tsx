import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Button } from "../../components/ui/button";
import { useVisitorId } from "../../hooks/useVisitorId";
import { getLanguageFlagString } from "../../components/LanguageFlag";

export const Route = createFileRoute("/_authed/leaderboard")({
  component: LeaderboardPage,
});

type LeaderboardType = "streak" | "progress";
type TimePeriod = "weekly" | "monthly" | "all-time";

function LeaderboardPage() {
  const [selectedType, setSelectedType] = useState<LeaderboardType>("streak");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("all-time");
  const [currentPage, setCurrentPage] = useState(0);
  const visitorId = useVisitorId();

  const limit = 50;
  const offset = currentPage * limit;

  // Get leaderboard data
  const { data: streakData = [], isLoading: streakLoading } = useQuery(
    convexQuery(api.leaderboard.getStreakLeaderboard, { 
      limit, 
      offset,
      period: selectedPeriod 
    })
  );

  const { data: progressData = [], isLoading: progressLoading } = useQuery(
    convexQuery(api.leaderboard.getProgressLeaderboard, { 
      limit, 
      offset,
      period: selectedPeriod 
    })
  );

  // Get current user's rank
  const { data: userRank } = useQuery(
    convexQuery(api.leaderboard.getUserRank, {
      visitorId,
      type: selectedType,
      period: selectedPeriod,
    })
  );

  const leaderboardData = selectedType === "streak" ? streakData : progressData;
  const isLoading = selectedType === "streak" ? streakLoading : progressLoading;

  // Medal icons for top 3
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return null;
    }
  };

  // Check if this is the current user's row
  const isCurrentUser = (rank: number) => {
    return userRank?.rank === rank;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you rank against other learners
        </p>
      </div>

      {/* Main tabs: Streak | Progress */}
      <div className="mb-6">
        <ToggleGroup
          type="single"
          value={selectedType}
          onValueChange={(value) => value && setSelectedType(value as LeaderboardType)}
          className="justify-start"
        >
          <ToggleGroupItem value="streak" className="px-6">
            Streak
          </ToggleGroupItem>
          <ToggleGroupItem value="progress" className="px-6">
            Progress
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Sub-tabs: Weekly | Monthly | All-time */}
      <div className="mb-8">
        <ToggleGroup
          type="single"
          value={selectedPeriod}
          onValueChange={(value) => value && setSelectedPeriod(value as TimePeriod)}
          className="justify-start"
        >
          <ToggleGroupItem value="weekly" className="px-4">
            Weekly
          </ToggleGroupItem>
          <ToggleGroupItem value="monthly" className="px-4">
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem value="all-time" className="px-4">
            All-time
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedType === "streak" ? "Practice Streak" : "Learning Progress"} - {
              selectedPeriod === "all-time" ? "All Time" : 
              selectedPeriod === "monthly" ? "This Month" : "This Week"
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="w-6 h-6 bg-muted rounded"></div>
                  <div className="flex-1 h-4 bg-muted rounded"></div>
                  <div className="w-16 h-4 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No users found for this leaderboard yet.</p>
              <p className="text-sm mt-2">Be the first to set a display name and start practicing!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardData.map((user, index) => {
                const rank = offset + index + 1;
                const medal = getMedalIcon(rank);
                const isUser = isCurrentUser(rank);
                
                return (
                  <div
                    key={`${user.displayName}-${rank}`}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                      isUser 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center font-mono text-sm text-muted-foreground">
                      {rank}
                    </div>

                    {/* Medal for top 3 */}
                    <div className="w-6 text-center">
                      {medal && <span className="text-lg">{medal}</span>}
                    </div>

                    {/* User info */}
                    <div className="flex items-center gap-3 flex-1">
                      {/* Language flag */}
                      <span className="text-lg">
                        {getLanguageFlagString(
                          selectedType === "streak" 
                            ? (user as any).language 
                            : (user as any).topLanguage
                        )}
                      </span>
                      
                      {/* Display name with star for current user */}
                      <span className="font-medium">
                        {user.displayName}
                        {isUser && <span className="ml-2 text-primary">⭐</span>}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="font-mono font-medium">
                        {selectedType === "streak" 
                          ? `${(user as any).streak} days`
                          : `${Math.round((user as any).score)} pts`
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {leaderboardData.length === limit && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={leaderboardData.length < limit}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's own rank if not in top 50 */}
      {userRank && userRank.rank > 50 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground mb-4">
              <p>Your rank</p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-8 text-center font-mono text-sm text-muted-foreground">
                {userRank.rank}
              </div>
              <div className="w-6"></div>
              <div className="flex items-center gap-3 flex-1">
                <span className="font-medium">You ⭐</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium">
                  {selectedType === "streak" 
                    ? `${userRank.score} days`
                    : `${Math.round(userRank.score)} pts`
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
