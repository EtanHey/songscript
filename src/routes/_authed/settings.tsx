import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { authClient } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authed/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  
  const [displayName, setDisplayName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionPending && !session?.user) {
      navigate({ to: "/login" });
    }
  }, [session, sessionPending, navigate]);

  // Get user info
  const { data: userInfo, isPending: userInfoPending } = useQuery(
    convexQuery(api.leaderboard.getUserInfo, {})
  );

  // Update display name when user info loads
  useEffect(() => {
    if (userInfo?.displayName) {
      setDisplayName(userInfo.displayName);
    }
  }, [userInfo]);

  // Set display name mutation
  const { mutate: setDisplayNameMutate, isPending: setDisplayNamePending } = useMutation({
    mutationFn: useConvexMutation(api.leaderboard.setDisplayName),
  });

  const handleSave = async () => {
    try {
      setFeedback(null);
      setDisplayNameMutate(
        {
          displayName: displayName.trim(),
        },
        {
          onSuccess: (result) => {
            if (result.success) {
              setFeedback({ type: "success", message: "Display name updated successfully!" });
            } else {
              setFeedback({ type: "error", message: result.error || "Failed to update display name" });
            }
          },
          onError: () => {
            setFeedback({ type: "error", message: "An error occurred while saving" });
          },
        }
      );
    } catch (error) {
      setFeedback({ type: "error", message: "An error occurred while saving" });
    }
  };

  if (sessionPending || userInfoPending) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-10 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-10 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <div className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="mt-1 bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Display Name (editable) */}
            <div>
              <Label htmlFor="displayName" className="text-sm font-medium text-gray-300">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="mt-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters, letters, numbers, and spaces only
              </p>
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`p-3 rounded-md text-sm ${
                  feedback.type === "success"
                    ? "bg-green-900/50 text-green-300 border border-green-800"
                    : "bg-red-900/50 text-red-300 border border-red-800"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={setDisplayNamePending || !displayName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              {setDisplayNamePending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
