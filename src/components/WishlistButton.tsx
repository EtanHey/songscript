import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useVisitorId } from "../hooks/useVisitorId";
import { useState, useCallback, useEffect } from "react";
import type { Id } from "../../convex/_generated/dataModel";

interface WishlistButtonProps {
  songId: Id<"songs">;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Heart button to add/remove songs from wishlist
 * Supports optimistic UI updates for smooth UX
 */
export function WishlistButton({
  songId,
  className = "",
  size = "md",
}: WishlistButtonProps) {
  const visitorId = useVisitorId();

  // Query actual wishlist status
  const { data: isInWishlist, isLoading } = useQuery(
    convexQuery(api.wishlist.isInWishlist, {
      visitorId: visitorId || "",
      songId,
    })
  );

  // Local optimistic state
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

  // Sync optimistic state when real data arrives
  useEffect(() => {
    if (isInWishlist !== undefined) {
      setOptimisticState(null); // Clear optimistic state when real data arrives
    }
  }, [isInWishlist]);

  // Mutation with optimistic updates
  const { mutate: toggleWishlist, isPending } = useMutation({
    mutationFn: useConvexMutation(api.wishlist.toggleWishlist),
    onMutate: () => {
      // Optimistically update UI immediately
      const currentState = optimisticState ?? isInWishlist ?? false;
      setOptimisticState(!currentState);
    },
    onError: () => {
      // Revert optimistic update on error
      setOptimisticState(null);
    },
    onSettled: () => {
      // Query will refetch and provide real state
    },
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent navigation if inside a Link
      e.stopPropagation();

      if (!visitorId || isPending) return;

      toggleWishlist({
        visitorId,
        songId,
      });
    },
    [visitorId, songId, isPending, toggleWishlist]
  );

  // Determine display state (optimistic > real > loading)
  const displayState = optimisticState ?? isInWishlist ?? false;

  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8 p-1.5",
    md: "w-10 h-10 p-2",
    lg: "w-12 h-12 p-2.5",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  if (isLoading && optimisticState === null) {
    return (
      <button
        className={`${sizeClasses[size]} rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center ${className}`}
        disabled
      >
        <HeartOutlineIcon className={`${iconSizes[size]} text-gray-400`} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!visitorId || isPending}
      className={`${sizeClasses[size]} rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center
        hover:bg-black/70 transition-all duration-200 active:scale-95
        ${isPending ? "opacity-50" : ""}
        ${className}`}
      aria-label={displayState ? "Remove from wishlist" : "Add to wishlist"}
      title={displayState ? "Remove from wishlist" : "Add to wishlist"}
    >
      {displayState ? (
        <HeartFilledIcon
          className={`${iconSizes[size]} text-red-500 transition-transform duration-200`}
        />
      ) : (
        <HeartOutlineIcon
          className={`${iconSizes[size]} text-white hover:text-red-400 transition-colors duration-200`}
        />
      )}
    </button>
  );
}

// Heart outline icon (not in wishlist)
function HeartOutlineIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

// Heart filled icon (in wishlist)
function HeartFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}
