import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { ContinueLearningCard } from "./ContinueLearningCard";

export type RecentSong = {
  _id: Id<"userSongProgress">;
  songId: Id<"songs">;
  lastPracticed: number;
  lastLineIndex: number;
  lastLinePreview: string;
  song: {
    _id: Id<"songs">;
    title: string;
    artist: string;
    sourceLanguage: string;
    youtubeId: string;
    videoUrl?: string;
    createdAt: number;
  };
  totalLines: number;
  progressPercent: number;
};

export function ContinueLearningCarousel({ items }: { items: RecentSong[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  return (
    <div>
      {/* Mobile: Swipeable carousel with snap scrolling */}
      <div className="md:hidden">
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4"
          onScroll={(e) => {
            const container = e.currentTarget;
            const scrollPosition = container.scrollLeft;
            const cardWidth = container.offsetWidth - 32; // Account for padding
            const newIndex = Math.round(scrollPosition / cardWidth);
            setActiveIndex(Math.min(newIndex, items.length - 1));
          }}
        >
          {items.map((item) => (
            <ContinueLearningCard key={item._id} item={item} className="flex-shrink-0 w-[calc(100%-2rem)] snap-center" />
          ))}
        </div>

        {/* Dot indicators - only show if more than 1 card */}
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            {items.map((item, index) => (
              <button
                key={item._id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeIndex ? "bg-emerald-500" : "bg-gray-600"
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Horizontal row */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {items.map((item) => (
          <ContinueLearningCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}
