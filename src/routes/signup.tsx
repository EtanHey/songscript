import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  hasProgressToMigrate,
  readProgress,
} from "../hooks/useAnonymousProgress";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const convex = useConvex();
  const { data: session, isPending } = authClient.useSession();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hasAnonymousProgress, setHasAnonymousProgress] = useState(false);
  const [progressCount, setProgressCount] = useState({ words: 0, lines: 0 });

  // After a short timeout, show the form regardless of session state
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowForm(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Check for anonymous progress on mount
  useEffect(() => {
    if (hasProgressToMigrate()) {
      setHasAnonymousProgress(true);
      const progress = readProgress();
      setProgressCount({
        words: progress.wordProgress.filter((w) => w.learned).length,
        lines: progress.lineProgress.filter((l) => l.learned).length,
      });
    }
  }, []);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (session?.user) {
      navigate({ to: "/dashboard" });
    }
  }, [session, navigate]);

  // Show loading only briefly
  if (isPending && !showForm) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailExists(false);
    setSuccess(null);

    // Validation
    if (displayName.length < 3 || displayName.length > 20) {
      setError("Display name must be between 3 and 20 characters.");
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists in the app
      const exists = await convex.query(api.users.checkEmailExists, { email });
      if (exists) {
        setEmailExists(true);
        setLoading(false);
        return;
      }

      // Store display name in localStorage for the verify flow
      localStorage.setItem("songscript_signup_display_name", displayName);

      const callbackURL = `${window.location.origin}/dashboard`;
      const result = await authClient.signUp.email({
        email,
        password: Math.random().toString(36).slice(-12), // Placeholder password since we use magic links
        name: displayName,
        callbackURL,
      });

      if (result.error) {
        // If user already exists, better-auth might return an error here
        // But for magic link flow, we can also just try signIn.magicLink
        // However, story says "Send Magic Link button triggers magic link"
        // Let's use magicLink directly as it handles both signup and signin if configured,
        // or just follow the login pattern but with extra metadata.
        // Re-reading PRD: "Send Magic Link button triggers magic link + stores migration preference"
        // The migration actually happens in verify.tsx (next stories).
        // So here we just need to send the magic link and store the metadata.
      }

      // Actually, signIn.magicLink is what we want because it sends the email.
      // signUp.email expects a password and might not send a magic link depending on config.
      // better-auth magic link works for both new and existing users.

      const magicResult = await authClient.signIn.magicLink({
        email,
        callbackURL,
      });

      if (magicResult.error) {
        setError(magicResult.error.message || "Failed to send magic link");
      } else {
        setSuccess(
          "Magic link sent! Check your email to complete your account creation.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white text-center">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Join SongScript to save your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-gray-300">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                required
                minLength={3}
                maxLength={20}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </div>

            {/* Reassuring note about anonymous progress */}
            {hasAnonymousProgress && (
              <div className="flex items-start gap-3 p-3 rounded-md bg-gray-800/50 border border-gray-700">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p>
                    Your learning progress is saved on this device
                    {(progressCount.words > 0 || progressCount.lines > 0) && (
                      <span className="text-gray-400">
                        {" "}
                        ({progressCount.words}{" "}
                        {progressCount.words === 1 ? "word" : "words"},{" "}
                        {progressCount.lines}{" "}
                        {progressCount.lines === 1 ? "line" : "lines"})
                      </span>
                    )}
                    .
                  </p>
                  <p className="text-gray-400 mt-1">
                    After signing up, you'll have the option to import it to
                    your account.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-900/50">
                {error}
              </div>
            )}

            {emailExists && (
              <div className="text-amber-400 text-sm bg-amber-900/20 p-4 rounded-md border border-amber-900/50">
                <p className="font-medium">This email is already registered.</p>
                <p className="mt-2">
                  Please{" "}
                  <Link
                    to="/login"
                    className="text-emerald-400 hover:text-emerald-300 underline font-medium"
                  >
                    sign in instead
                  </Link>
                  .
                </p>
              </div>
            )}

            {success ? (
              <div className="text-emerald-400 text-sm bg-emerald-900/20 p-4 rounded-md border border-emerald-900/50 text-center">
                {success}
              </div>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </Button>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-gray-800 pt-6">
          <p className="text-gray-400 text-sm text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-emerald-500 hover:text-emerald-400 font-medium"
            >
              Log in
            </Link>
          </p>
          <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">
            A magic link will be sent to your email.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
