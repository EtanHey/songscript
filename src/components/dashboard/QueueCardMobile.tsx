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

export type QueueCardMobileProps = {
  item: WishlistItem;
  index: number;
  totalItems: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
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

function GripVerticalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

/**
 * Mobile Queue Card - List style with visible drag handles.
 * Used in the Learning Queue section on mobile devices.
 */
export function QueueCardMobile({
  item,
  index,
  totalItems,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: QueueCardMobileProps) {
  const song = item.song!;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-gray-900 rounded-lg border overflow-hidden transition-all duration-200
        ${isDragging ? "opacity-50 border-primary" : "border-gray-800"}
        ${isDragOver ? "border-emerald-500 border-2" : ""}`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none">
          <GripVerticalIcon className="w-5 h-5 text-gray-500" />
        </div>

        {/* Order number */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-gray-800">
          <img
            src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
            alt={`${song.title} thumbnail`}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <LanguageFlag language={song.sourceLanguage} size="1em" />
            <h4 className="font-medium text-white truncate text-sm">{song.title}</h4>
          </div>
          <p className="text-gray-400 text-xs truncate">{song.artist}</p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {/* Move buttons */}
          <div className="flex flex-col">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
              aria-label="Move up"
            >
              <ChevronUpIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalItems - 1}
              className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
              aria-label="Move down"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Start button */}
          <Link
            to="/song/$songId"
            params={{ songId: song._id }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors min-h-[36px] flex items-center"
          >
            Start
          </Link>

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-900/50 rounded transition-colors"
            aria-label="Remove from queue"
          >
            <XIcon className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
