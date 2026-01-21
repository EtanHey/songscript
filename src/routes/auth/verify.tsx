import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "../../lib/auth-client";

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
        }, 500);
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
