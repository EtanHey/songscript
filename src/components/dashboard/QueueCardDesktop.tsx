import { Link } from "@tanstack/react-router";
import type { Id } from "@convex/_generated/dataModel";
import { LanguageFlag } from "../LanguageFlag";

// Wishlist item type
export type WishlistItem = {
  _id: Id<"userWishlist">;
  songId: Id<"songs">;
  sortOrder: number;
  addedAt: number;
  song: {
    _id: Id<"songs">;
    title: string;
    artist: string;
    youtubeId: string;
    sourceLanguage: string;
  } | null;
};

export type QueueCardDesktopProps = {
  item: WishlistItem;
  index: number;
  totalItems: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

// Simple icon components
function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/**
 * Desktop Queue Card - Grid style with hover actions.
 * Used in the Learning Queue section on larger screens.
 */
export function QueueCardDesktop({
  item,
  index,
  totalItems,
  onMoveUp,
  onMoveDown,
  onRemove,
}: QueueCardDesktopProps) {
  const song = item.song!;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-emerald-500/50 transition-all duration-200 group">
      {/* Thumbnail with order badge and actions */}
      <div className="aspect-video w-full bg-gray-800 relative">
        <img
          src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
          alt={`${song.title} thumbnail`}
          className="h-full w-full object-cover"
        />

        {/* Order badge */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-semibold">
          #{index + 1}
        </div>

        {/* Language flag */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-sm">
          <LanguageFlag language={song.sourceLanguage} size="1em" />
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-30 transition-colors"
            aria-label="Move up"
          >
            <ChevronUpIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalItems - 1}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-30 transition-colors"
            aria-label="Move down"
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 bg-red-900/80 rounded-lg hover:bg-red-800 transition-colors"
            aria-label="Remove from queue"
          >
            <XIcon className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">{song.title}</h3>
        <p className="text-gray-400 text-sm mb-3 truncate">{song.artist}</p>

        {/* Start Learning button */}
        <Link
          to="/song/$songId"
          params={{ songId: song._id }}
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px]"
        >
          Start Learning
        </Link>
      </div>
    </div>
  );
}
