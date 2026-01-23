import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "../../lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/auth/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  const setDisplayName = useMutation(api.leaderboard.setDisplayName);
  const ensureAppUser = useMutation(api.users.ensureAppUser);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No verification token provided");
      return;
    }

    const verify = async () => {
      try {
        const result = await authClient.magicLink.verify({ query: { token } });

        if (result.error) {
          setStatus("error");
          setError(result.error.message || "Verification failed");
          return;
        }

        // Ensure app user record exists with retry logic
        let retryCount = 0;
        const maxRetries = 5;
        while (retryCount < maxRetries) {
          try {
            await ensureAppUser();
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw error; // Re-throw after max retries
            }
            // Exponential backoff: 500ms, 1s, 2s, 4s
            const delay = 500 * Math.pow(2, retryCount - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        // Get display name from signup form (if provided)
        const displayName = localStorage.getItem('songscript_signup_display_name');

        // Set display name if provided
        if (displayName) {
          try {
            await setDisplayName({ displayName });
          } catch (displayNameError) {
            console.error('Setting display name failed:', displayNameError);
            // Continue with login even if display name setting fails
          }
        }

        // Clear signup-related localStorage keys
        // Note: anonymous progress is preserved - migration happens via modal on dashboard
        localStorage.removeItem('songscript_signup_display_name');

        setStatus("success");
        // Brief delay to show success state
        setTimeout(() => {
          // Check if this is first login and user hasn't seen welcome prompt
          const hasSeenWelcome = localStorage.getItem("songscript_welcome_shown");
          if (!hasSeenWelcome) {
            navigate({ to: "/welcome" });
          } else {
            navigate({ to: "/dashboard" });
          }
        }, 1000);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        {status === "verifying" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white">Signing you in...</h1>
            <p className="text-gray-400 mt-2">Verifying your magic link</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-emerald-500 text-5xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-white">Success!</h1>
            <p className="text-gray-400 mt-2">Redirecting to dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-red-500 text-5xl mb-4">✕</div>
            <h1 className="text-xl font-semibold text-white">Verification Failed</h1>
            <p className="text-red-400 mt-2">{error}</p>
            <button
              onClick={() => navigate({ to: "/login" })}
              className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
