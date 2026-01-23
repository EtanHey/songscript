import { LanguageFlag } from "../LanguageFlag";
import { LanguageChip, getLanguageDisplayName, type LanguageProgressData } from "./LanguageChip";
import { LanguageCard } from "./LanguageCard";
import { AddLanguageChip } from "./AddLanguageChip";
import { AddLanguageCard } from "./AddLanguageCard";

export interface MyLanguagesSectionProps {
  languages: LanguageProgressData[];
  selectedLanguage: string | null;
  onSelectLanguage: (lang: string) => void;
}

// My Languages Section Component - Mobile: horizontal scroll, Desktop: grid
export function MyLanguagesSection({
  languages,
  selectedLanguage,
  onSelectLanguage,
}: MyLanguagesSectionProps) {
  return (
    <div>
      {/* Mobile: Horizontal scrolling chips/cards */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4">
          {languages.map((lang) => (
            <LanguageChip
              key={lang.language}
              language={lang}
              isSelected={selectedLanguage === lang.language}
              onSelect={() => onSelectLanguage(lang.language)}
            />
          ))}
          {/* Add a language chip */}
          <AddLanguageChip />
        </div>

        {/* Filter active indicator */}
        {selectedLanguage && (
          <div className="flex items-center justify-between bg-emerald-900/20 rounded-lg px-4 py-2 border border-emerald-500/30">
            <span className="text-sm text-emerald-400 flex items-center gap-1">
              Filtering by <LanguageFlag language={selectedLanguage} size="1em" /> {getLanguageDisplayName(selectedLanguage)}
            </span>
            <button
              onClick={() => onSelectLanguage(selectedLanguage)}
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Grid of language cards */}
      <div className="hidden md:block">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {languages.map((lang) => (
            <LanguageCard
              key={lang.language}
              language={lang}
              isSelected={selectedLanguage === lang.language}
              onSelect={() => onSelectLanguage(lang.language)}
            />
          ))}
          {/* Add a language card */}
          <AddLanguageCard />
        </div>

        {/* Filter active indicator for desktop */}
        {selectedLanguage && (
          <div className="mt-4 flex items-center justify-between bg-emerald-900/20 rounded-lg px-4 py-3 border border-emerald-500/30">
            <span className="text-sm text-emerald-400 flex items-center gap-2">
              <LanguageFlag language={selectedLanguage} size="1.125em" />
              Dashboard filtered to show only {getLanguageDisplayName(selectedLanguage)} content
            </span>
            <button
              onClick={() => onSelectLanguage(selectedLanguage)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
