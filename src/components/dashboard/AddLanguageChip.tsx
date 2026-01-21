import { Link } from "@tanstack/react-router";

// Add Language Chip (Mobile) - CTA to browse more songs
export function AddLanguageChip() {
  return (
    <Link
      to="/"
      className="flex-shrink-0 snap-start flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-700 hover:border-gray-600 bg-gray-900/50 min-w-[160px] transition-colors"
    >
      <span className="text-2xl text-gray-500">🌍</span>
      <div className="text-left">
        <div className="font-medium text-gray-400 text-sm">Add a language</div>
        <div className="text-xs text-gray-500">Browse songs</div>
      </div>
    </Link>
  );
}
