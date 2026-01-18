import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// Admin email - only this email can sign in
const ADMIN_EMAIL = "etan@heyman.net";

function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Check if email is admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError("Only admin email is allowed to sign in");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          email,
          password,
          name: "Admin",
        });

        if (result.error) {
          setError(result.error.message || "Sign up failed");
        } else {
          navigate({ to: "/" });
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message || "Sign in failed");
        } else {
          navigate({ to: "/" });
        }
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
          Admin access only
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
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-emerald-400 hover:text-emerald-300 text-sm"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Need an account? Sign Up"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-gray-500 text-xs text-center">
            This app is restricted to admin users only.
          </p>
        </div>
      </div>
    </div>
  );
}
