import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Clock, LayoutDashboard, LogOut, Settings } from "lucide-react";

// Format seconds into human-readable time (always show seconds)
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Get initials from name or email
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export default function Header() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isLoggedIn = !!session?.user;

  // Get user stats for practice time
  const { data: userStats } = useQuery({
    ...convexQuery(api.userStats.getAggregatedStats, {}),
    enabled: isLoggedIn,
  });

  // Get user info for display name
  const { data: userInfo } = useQuery({
    ...convexQuery(api.leaderboard.getUserInfo, {}),
    enabled: isLoggedIn,
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900">
      <nav className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="text-xl font-bold brand-gradient sm:text-2xl">
          SongScript
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {isPending ? (
            <span className="text-sm text-gray-500">...</span>
          ) : isLoggedIn ? (
            <>
              {/* Practice Time Badge */}
              {userStats && userStats.totalPracticeTimeSeconds > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800 text-gray-300 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(userStats.totalPracticeTimeSeconds)}</span>
                </div>
              )}

              {/* Dashboard Link */}
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:text-base"
              >
                Dashboard
              </Link>

              {/* User Avatar with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-gray-600">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                      <AvatarImage
                        src={user?.image || undefined}
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback className="bg-gray-700 text-gray-200 text-sm">
                        {getInitials(user?.name, user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-gray-900 border-gray-700"
                >
                  <DropdownMenuLabel className="text-gray-200">
                    <div className="flex flex-col space-y-1">
                      {userInfo?.displayName ? (
                        <p className="text-sm font-medium">
                          {userInfo.displayName}
                        </p>
                      ) : (
                        <button
                          onClick={() => navigate({ to: "/settings" })}
                          className="text-sm font-medium text-gray-400 hover:text-gray-200 text-left"
                        >
                          Set display name
                        </button>
                      )}
                      {user?.email && (
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />

                  {/* Practice time in dropdown for mobile */}
                  {userStats && userStats.totalPracticeTimeSeconds > 0 && (
                    <>
                      <DropdownMenuItem
                        disabled
                        className="text-gray-400 sm:hidden"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        <span>
                          Total:{" "}
                          {formatTime(userStats.totalPracticeTimeSeconds)}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-700 sm:hidden" />
                    </>
                  )}

                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/dashboard" })}
                    className="text-gray-200 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/settings" })}
                    className="text-gray-200 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-400 cursor-pointer hover:bg-gray-800 focus:bg-gray-800 focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:text-base"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
