import { useState, useEffect, useRef } from "react";

// Animated count-up hook
function useCountUp(target: number, duration: number = 1000): number {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOut * target);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [target, duration]);

  return count;
}

export interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  displayValue?: string;
  subLabel?: string;
  colorClass: string;
}

export function StatCard({
  icon,
  label,
  value,
  displayValue,
  subLabel,
  colorClass,
}: StatCardProps) {
  const animatedValue = useCountUp(value);
  const displayVal = displayValue || animatedValue.toLocaleString();

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 p-4 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl sm:text-2xl">{icon}</span>
        <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
        {displayVal}
      </div>
      {subLabel && (
        <div className="text-xs text-gray-500">{subLabel}</div>
      )}
    </div>
  );
}
