import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Button } from "../ui/button";

type LeaderboardType = "streak" | "progress";

export function LeaderboardMiniSection() {
  const [selectedType, setSelectedType] = useState<LeaderboardType>("streak");

  // Get top 5 users for streak leaderboard
  const { data: streakData = [] } = useQuery(
    convexQuery(api.leaderboard.getStreakLeaderboard, { limit: 5 })
  );

  // Get top 5 users for progress leaderboard
  const { data: progressData = [] } = useQuery(
    convexQuery(api.leaderboard.getProgressLeaderboard, { limit: 5 })
  );

  // Get current user's rank
  const { data: userRank } = useQuery(
    convexQuery(api.leaderboard.getUserRank, {
      type: selectedType,
    })
  );

  // Get user info to check display name
  const { data: userInfo } = useQuery(
    convexQuery(api.leaderboard.getUserInfo, {})
  );

  const hasDisplayName = userInfo?.displayName !== null;
  const leaderboardData = selectedType === "streak" ? streakData : progressData;

  // Medal icons for top 3
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <ToggleGroup
          type="single"
          value={selectedType}
          onValueChange={(value) => value && setSelectedType(value as LeaderboardType)}
          className="w-fit"
        >
          <ToggleGroupItem value="streak" variant="outline" size="sm">
            Streak
          </ToggleGroupItem>
          <ToggleGroupItem value="progress" variant="outline" size="sm">
            Progress
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent>
        {!hasDisplayName ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-3">
              Set display name to join
            </p>
            <Button asChild size="sm">
              <Link to="/settings">Set Display Name</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboardData.map((user) => {
              const isCurrentUser = hasDisplayName && userRank && user.rank === userRank.rank;
              const medal = getMedalIcon(user.rank);
              
              return (
                <div
                  key={`${user.displayName}-${user.rank}`}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-6">
                      {medal || `#${user.rank}`}
                    </span>
                    <span className="text-sm font-medium">{user.displayName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedType === "streak" 
                      ? `${(user as any).streak || 0} days`
                      : `${(user as any).score || 0} pts`
                    }
                  </div>
                </div>
              );
            })}

            {/* Show current user's rank if not in top 5 but in top 50 */}
            {hasDisplayName && userRank && userRank.rank > 5 && userRank.rank <= 50 && (
              <>
                <div className="border-t pt-2 mt-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-6">#{userRank.rank}</span>
                      <span className="text-sm font-medium">{userInfo?.displayName}</span>
                      <span className="text-xs text-muted-foreground">(You)</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedType === "streak" 
                        ? `${userRank.score} days`
                        : `${userRank.score} pts`
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild variant="link" size="sm" className="w-full">
          <Link to="/leaderboard">View full leaderboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
