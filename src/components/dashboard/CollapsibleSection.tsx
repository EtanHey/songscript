import { useState } from "react";
import type { ReactNode } from "react";

export interface CollapsibleSectionProps {
  title: string;
  badge?: number;
  filterIndicator?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  badge,
  filterIndicator,
  defaultExpanded,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded ?? true);

  return (
    <section className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header - Clickable to expand/collapse on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors md:cursor-default"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {badge !== undefined && badge > 0 && (
            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded-full">
              {badge}
            </span>
          )}
          {filterIndicator && (
            <span className="text-sm text-gray-400">{filterIndicator}</span>
          )}
        </div>
        {/* Chevron - visible on mobile, hidden on md+ */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 md:hidden ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content - Collapsible on mobile, always visible on md+ */}
      <div
        className={`transition-all duration-300 ease-in-out md:max-h-none md:opacity-100 ${
          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </section>
  );
}
