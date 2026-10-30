import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { Button } from "../../components/ui/button";

export const Route = createFileRoute("/_authed/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setDisplayNameMutation = useConvexMutation(
    api.leaderboard.setDisplayName,
  );

  // Check if user already has a display name
  const { data: userInfo } = useQuery(
    convexQuery(api.leaderboard.getUserInfo, {}),
  );

  // If user already has displayName, redirect to dashboard
  useEffect(() => {
    if (userInfo?.displayName) {
      localStorage.setItem("songscript_welcome_shown", "true");
      navigate({ to: "/dashboard" });
    }
  }, [userInfo, navigate]);

  const handleContinue = async () => {
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await setDisplayNameMutation({
        displayName: displayName.trim(),
      });

      if (!result.success) {
        setError(result.error || "Failed to save display name");
        setLoading(false);
        return;
      }

      // Mark that user has seen the welcome prompt
      localStorage.setItem("songscript_welcome_shown", "true");
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark that user has seen the welcome prompt
    localStorage.setItem("songscript_welcome_shown", "true");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to SongScript! 🎵
          </h1>
          <p className="text-gray-400">
            What should we call you on the leaderboard?
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Your name"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              3-20 characters, letters and spaces only
            </p>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleContinue}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Saving..." : "Continue"}
            </Button>

            <button
              onClick={handleSkip}
              disabled={loading}
              className="w-full text-gray-400 hover:text-gray-300 text-sm underline"
            >
              Skip for now
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-gray-500 text-xs text-center">
            You can always set your display name later in Settings
          </p>
        </div>
      </div>
    </div>
  );
}
