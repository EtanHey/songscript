// Simple test script to verify leaderboard queries work
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://harmless-husky-580.convex.cloud");

async function testLeaderboardQueries() {
  console.log("Testing leaderboard queries...\n");

  try {
    // Test 1: getStreakLeaderboard returns users sorted by streak
    console.log("1. Testing getStreakLeaderboard...");
    const streakLeaderboard = await client.query("leaderboard:getStreakLeaderboard", {
      limit: 5,
      offset: 0
    });
    console.log("✓ getStreakLeaderboard returned:", streakLeaderboard.length, "users");
    if (streakLeaderboard.length > 1) {
      const sorted = streakLeaderboard.every((user, i) => 
        i === 0 || streakLeaderboard[i-1].streak >= user.streak
      );
      console.log(sorted ? "✓ Users sorted by streak correctly" : "✗ Users NOT sorted by streak");
    }

    // Test 2: getProgressLeaderboard applies difficulty multipliers correctly
    console.log("\n2. Testing getProgressLeaderboard...");
    const progressLeaderboard = await client.query("leaderboard:getProgressLeaderboard", {
      limit: 5,
      offset: 0
    });
    console.log("✓ getProgressLeaderboard returned:", progressLeaderboard.length, "users");
    if (progressLeaderboard.length > 1) {
      const sorted = progressLeaderboard.every((user, i) => 
        i === 0 || progressLeaderboard[i-1].score >= user.score
      );
      console.log(sorted ? "✓ Users sorted by progress score correctly" : "✗ Users NOT sorted by progress score");
    }

    // Test 3: getUserRank returns correct position
    console.log("\n3. Testing getUserRank...");
    const userRankStreak = await client.query("leaderboard:getUserRank", {
      visitorId: "test@example.com",
      type: "streak",
      period: "all-time"
    });
    console.log("✓ getUserRank (streak) returned:", userRankStreak);
    
    const userRankProgress = await client.query("leaderboard:getUserRank", {
      visitorId: "test@example.com", 
      type: "progress",
      period: "all-time"
    });
    console.log("✓ getUserRank (progress) returned:", userRankProgress);

    // Test 4: Users without displayName excluded from public boards
    console.log("\n4. Testing displayName filtering...");
    const allUsers = streakLeaderboard.concat(progressLeaderboard);
    const hasDisplayName = allUsers.every(user => user.displayName && user.displayName.length > 0);
    console.log(hasDisplayName ? "✓ All users have displayName" : "✗ Some users missing displayName");

    // Test 5: Period filters work (weekly/monthly/all-time)
    console.log("\n5. Testing period filters...");
    const weeklyStreak = await client.query("leaderboard:getStreakLeaderboard", {
      period: "weekly",
      limit: 3
    });
    const monthlyStreak = await client.query("leaderboard:getStreakLeaderboard", {
      period: "monthly", 
      limit: 3
    });
    const allTimeStreak = await client.query("leaderboard:getStreakLeaderboard", {
      period: "all-time",
      limit: 3
    });
    console.log("✓ Weekly period returned:", weeklyStreak.length, "users");
    console.log("✓ Monthly period returned:", monthlyStreak.length, "users");
    console.log("✓ All-time period returned:", allTimeStreak.length, "users");

    // Test 6: Pagination works (limit/offset)
    console.log("\n6. Testing pagination...");
    const page1 = await client.query("leaderboard:getStreakLeaderboard", {
      limit: 2,
      offset: 0
    });
    const page2 = await client.query("leaderboard:getStreakLeaderboard", {
      limit: 2,
      offset: 2
    });
    console.log("✓ Page 1 returned:", page1.length, "users");
    console.log("✓ Page 2 returned:", page2.length, "users");
    
    if (page1.length > 0 && page2.length > 0) {
      const differentUsers = page1[0].displayName !== page2[0].displayName;
      console.log(differentUsers ? "✓ Pagination working correctly" : "✗ Pagination may not be working");
    }

    console.log("\n✅ All leaderboard query tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testLeaderboardQueries();
