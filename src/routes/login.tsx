import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});



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

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (session?.user) {
      navigate({ to: "/dashboard" });
    }
  }, [session, navigate]);

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

    try {
      // Use absolute URL so redirect goes back to same origin (localhost or production)
      const callbackURL = `${window.location.origin}/dashboard`;
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL,
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
          Welcome Back
        </h1>
        <p className="text-gray-400 text-center mb-6 text-sm">
          Sign in to your existing account
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
              placeholder="your@email.com"
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

        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
          <p className="text-gray-500 text-sm mb-4">OR</p>
          <Link to="/signup">
            <Button
              variant="outline"
              className="w-full border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white"
            >
              Create New Account →
              <span className="block text-xs mt-1 opacity-80">
                Keep your learning progress
              </span>
            </Button>
          </Link>
        </div>

        <div className="mt-4">
          <p className="text-gray-500 text-xs text-center">
            A magic link will be sent to your email. Click it to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
