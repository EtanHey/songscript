import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { useMemo } from "react";
import { WishlistButton } from "../components/WishlistButton";
import { LanguageFlag } from "../components/LanguageFlag";
import { getLanguageDisplayName } from "../components/dashboard/LanguageChip";
import { authClient } from "../lib/auth-client";
import type { Doc } from "../../convex/_generated/dataModel";

// Type for song document from Convex
type Song = Doc<"songs">;

// Server function to fetch songs at request time (SSR)
const getSongs = createServerFn({ method: "GET" }).handler(async () => {
  const convexUrl = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
  if (!convexUrl) {
    console.error("CONVEX_URL not configured for SSR");
    return [] as Song[];
  }

  const client = new ConvexHttpClient(convexUrl);
  const songs = await client.query(api.songs.list, {});
  return songs;
});

export const Route = createFileRoute("/")({
  loader: async () => {
    // Fetch songs on the server for SSR
    const songs = await getSongs();
    return { songs };
  },
  component: HomePage,
});

function HomePage() {
  // Get SSR-provided data from loader
  const loaderData = Route.useLoaderData();

  // Use TanStack Query for real-time updates, initialized with loader data
  const { data: songs, isLoading } = useQuery({
    ...convexQuery(api.songs.list, {}),
    initialData: loaderData.songs,
  });

  // Check auth for progress bars
  const { data: session } = authClient.useSession();

  // Fetch song progress for authenticated users
  const { data: songProgressData } = useQuery({
    ...convexQuery(api.songProgress.getWithSongDetails, {}),
    enabled: !!session?.user,
  });

  // Build progress map: songId -> progressPercent
  const progressMap = useMemo(() => {
    const map = new Map<string, number>();
    if (songProgressData) {
      for (const p of songProgressData) {
        map.set(p.songId, p.progressPercent);
      }
    }
    return map;
  }, [songProgressData]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1
          className="text-4xl font-bold mb-2 brand-gradient"
          style={{ textWrap: "balance" }}
        >
          SongScript
        </h1>
        <p className="text-gray-400 mb-8">
          Learn to read and pronounce songs in any language
        </p>

        <h2 className="text-2xl font-semibold mb-4">Songs</h2>

        {isLoading ? (
          <div className="text-gray-400" aria-live="polite">
            Loading songs\u2026
          </div>
        ) : songs && songs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {songs.map((song: (typeof songs)[0]) => (
              <Link
                key={song._id}
                to="/song/$songId"
                params={{ songId: song._id }}
                className="block overflow-hidden bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none transition-all duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100 hover:shadow-lg"
              >
                <div className="aspect-video w-full bg-gray-800 relative">
                  <img
                    src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
                    alt={`${song.title} thumbnail`}
                    width={320}
                    height={180}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <WishlistButton songId={song._id} size="sm" />
                  </div>
                </div>
                <div className="p-4 min-w-0">
                  <h3 className="text-xl font-semibold text-white mb-1 truncate">
                    {song.title}
                  </h3>
                  <p className="text-gray-400 truncate">{song.artist}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                    <LanguageFlag language={song.sourceLanguage} size="1em" />
                    <span>{getLanguageDisplayName(song.sourceLanguage)}</span>
                  </div>
                </div>
                {/* Progress bar for authenticated users */}
                {(progressMap.get(song._id) ?? 0) > 0 && (
                  <div
                    className="h-1 bg-gray-800"
                    role="progressbar"
                    aria-valuenow={progressMap.get(song._id)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressMap.get(song._id)}%` }}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">No songs yet</p>
            <p className="text-sm text-gray-500">
              Songs will appear here once they\u2019re added
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
