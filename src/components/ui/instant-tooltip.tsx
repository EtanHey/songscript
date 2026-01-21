import { useState, useRef, useCallback, type ReactNode } from "react";

interface InstantTooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/**
 * Instant tooltip - shows immediately on hover with no delay
 */
export function InstantTooltip({
  content,
  children,
  position = "top",
  className = "",
}: InstantTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Use viewport coordinates directly since tooltip is position: fixed
      let x = rect.left + rect.width / 2;
      let y = rect.top;

      switch (position) {
        case "bottom":
          y = rect.bottom + 8;
          break;
        case "left":
          x = rect.left - 8;
          y = rect.top + rect.height / 2;
          break;
        case "right":
          x = rect.right + 8;
          y = rect.top + rect.height / 2;
          break;
        default: // top
          y = rect.top - 8;
      }

      setCoords({ x, y });
    }
    setIsVisible(true);
  }, [position]);

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
  }, []);

  const positionClasses = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
    left: "-translate-x-full -translate-y-1/2",
    right: "-translate-y-1/2",
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className="inline-block"
    >
      {children}
      {isVisible && (
        <div
          className={`
            fixed z-50 px-3 py-2 text-sm
            bg-gray-800 text-white rounded-lg shadow-lg
            border border-gray-700
            whitespace-pre-line
            pointer-events-none
            ${positionClasses[position]}
            ${className}
          `}
          style={{
            left: coords.x,
            top: coords.y,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
