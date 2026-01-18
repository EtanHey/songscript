import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense, useRef, useState, useCallback } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import YouTubePlayer, { YouTubePlayerHandle } from "../components/YouTubePlayer";
import LyricsDisplay from "../components/LyricsDisplay";

export const Route = createFileRoute("/song/$songId")({
  component: SongPage,
});

function SongPage() {
  const { songId } = Route.useParams();

  return (
    <Suspense fallback={<SongPageLoading />}>
      <SongPageContent songId={songId as Id<"songs">} />
    </Suspense>
  );
}

function SongPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading song...</span>
      </div>
    </div>
  );
}

interface SongPageContentProps {
  songId: Id<"songs">;
}

function SongPageContent({ songId }: SongPageContentProps) {
  const { data: song } = useSuspenseQuery(
    convexQuery(api.songs.getById, { id: songId })
  );

  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number | undefined>(
    undefined
  );
  const [clickedLineIndex, setClickedLineIndex] = useState<number | undefined>(
    undefined
  );

  // Clear click animation after 300ms
  const triggerClickAnimation = useCallback((lineIndex: number) => {
    setClickedLineIndex(lineIndex);
    setTimeout(() => {
      setClickedLineIndex(undefined);
    }, 300);
  }, []);

  const handleLineClick = useCallback(
    (startTime: number, lineIndex: number) => {
      // Seek to the timestamp
      playerRef.current?.seekTo(startTime);
      // Start playing after seek
      playerRef.current?.play();
      // Trigger visual feedback
      triggerClickAnimation(lineIndex);
      // Set as active line
      setActiveLineIndex(lineIndex);
    },
    [triggerClickAnimation]
  );

  const handleTimeUpdate = useCallback((_currentTime: number) => {
    // Time update tracking (will be used in US-013 for active line highlighting)
    // For now, this is a placeholder for future use
  }, []);

  if (!song) {
    throw notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <h1 className="text-2xl font-bold">{song.title}</h1>
        <p className="text-gray-400">{song.artist}</p>
      </header>

      {/* Main content */}
      <main className="flex flex-col gap-4 p-4 lg:flex-row">
        {/* YouTube Player */}
        <div className="w-full lg:w-1/2">
          <div className="sticky top-4">
            <YouTubePlayer
              ref={playerRef}
              videoId={song.youtubeId}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        </div>

        {/* Lyrics */}
        <div className="w-full lg:w-1/2">
          <LyricsDisplay
            songId={songId}
            onLineClick={handleLineClick}
            activeLineIndex={activeLineIndex}
            clickedLineIndex={clickedLineIndex}
          />
        </div>
      </main>
    </div>
  );
}
