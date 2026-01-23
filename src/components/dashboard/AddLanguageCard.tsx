import { Link } from "@tanstack/react-router";

// Add Language Card (Desktop) - CTA to browse more songs
export function AddLanguageCard() {
  return (
    <Link
      to="/"
      className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-gray-700 hover:border-gray-600 bg-gray-900/50 transition-all duration-200 hover:shadow-lg min-h-[200px]"
    >
      <span className="text-4xl mb-3 opacity-50">🌍</span>
      <h3 className="font-medium text-gray-400 mb-1">Add a language</h3>
      <p className="text-xs text-gray-500 text-center">
        Browse songs to start learning a new language
      </p>
    </Link>
  );
}
