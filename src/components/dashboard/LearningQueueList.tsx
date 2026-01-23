import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { QueueCardDesktop, type WishlistItem } from "./QueueCardDesktop";
import { QueueCardMobile } from "./QueueCardMobile";

export type LearningQueueListProps = {
  items: WishlistItem[];
  onReorder: (songIds: Id<"songs">[]) => void;
  onRemove: (songId: Id<"songs">) => void;
};

/**
 * Learning Queue List Component with reordering.
 * Renders a grid view on desktop and a list view with drag handles on mobile.
 */
export function LearningQueueList({
  items,
  onReorder,
  onRemove,
}: LearningQueueListProps) {
  // Track drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Create new order
      const newItems = [...items];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(dragOverIndex, 0, draggedItem);

      // Get new song IDs in order
      const newSongIds = newItems.map((item) => item.songId);
      onReorder(newSongIds);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle move up (via button)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onReorder(newItems.map((item) => item.songId));
  };

  // Handle move down (via button)
  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onReorder(newItems.map((item) => item.songId));
  };

  return (
    <div className="space-y-2">
      {/* Desktop: Grid view */}
      <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item, index) => (
          item.song && (
            <QueueCardDesktop
              key={item._id}
              item={item}
              index={index}
              totalItems={items.length}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onRemove={() => onRemove(item.songId)}
            />
          )
        ))}
      </div>

      {/* Mobile: List view with drag handles */}
      <div className="lg:hidden space-y-2">
        {items.map((item, index) => (
          item.song && (
            <QueueCardMobile
              key={item._id}
              item={item}
              index={index}
              totalItems={items.length}
              isDragging={draggedIndex === index}
              isDragOver={dragOverIndex === index}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onRemove={() => onRemove(item.songId)}
            />
          )
        ))}
      </div>
    </div>
  );
}
