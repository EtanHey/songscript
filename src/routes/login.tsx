import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// Admin email - only this email can sign in
const ADMIN_EMAIL = "etan@heyman.net";

function LoginPage() {
  const navigate = useNavigate();
  // Try to get session, but don't block the UI - auth endpoints may be unreliable
  const { data: session, isPending } = authClient.useSession();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // After a short timeout, show the form regardless of session state
  // This prevents infinite loading if auth endpoints are broken
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowForm(true);
    }, 1500); // Show form after 1.5 seconds max
    return () => clearTimeout(timer);
  }, []);

  // If already logged in, show user info
  if (session?.user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Welcome, Admin!
          </h1>
          <p className="text-gray-300 text-center mb-4">
            Signed in as: {session.user.email}
          </p>
          <Button
            onClick={async () => {
              await authClient.signOut();
              navigate({ to: "/" });
            }}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Show loading only briefly - after timeout, show form anyway
  if (isPending && !showForm) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Check if email is admin email (client-side check)
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError("Only admin email is allowed to sign in");
      setLoading(false);
      return;
    }

    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message || "Failed to send magic link");
      } else {
        setSuccess(
          "Magic link sent! In dev mode, check the Convex dashboard logs at dashboard.convex.dev"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          SongScript Admin
        </h1>
        <p className="text-gray-400 text-center mb-6 text-sm">
          Admin access only (passwordless)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="etan@heyman.net"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-emerald-400 text-sm bg-emerald-900/20 p-3 rounded-md">
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-gray-500 text-xs text-center">
            A magic link will be sent to your email. Click it to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
