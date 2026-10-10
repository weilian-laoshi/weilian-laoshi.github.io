import React from 'react';
import type { Profile, Deck, LanguageId } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import {
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface NavbarProps {
  activeProfile: Profile;
  decks: Deck[];
  selectedLanguageFilter: LanguageId | 'all';
  onSelectLanguageFilter: (lang: LanguageId | 'all') => void;
  onOpenProfileModal: () => void;
  onOpenCurriculumModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  totalDueToday: number;
  onGoHome: () => void;
  isStudyMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProfile,
  decks,
  selectedLanguageFilter,
  onSelectLanguageFilter,
  onOpenProfileModal,
  onOpenCurriculumModal,
  theme,
  onToggleTheme,
  totalDueToday,
  onGoHome,
  isStudyMode = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            title="Return to main page"
            className="flex items-center gap-2 cursor-pointer group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-lg p-0.5 transition-opacity hover:opacity-85 shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <span className="text-sm font-semibold select-none">联</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                微联老师 · Weilian Laoshi
              </span>
              <span className="hidden sm:inline text-[10px] text-zinc-400 font-mono tracking-wider uppercase mt-0.5">
                Leitner English Flashcards
              </span>
            </div>
          </button>

          {/* Desktop Language Filter Pills (only when not studying) */}
          {!isStudyMode && (
            <div className="hidden lg:flex items-center ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 gap-1">
              <button
                type="button"
                onClick={() => onSelectLanguageFilter('all')}
                className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedLanguageFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                All
              </button>
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onSelectLanguageFilter(lang.id)}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                    selectedLanguageFilter === lang.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden xl:inline">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Actions - Carefully sized for mobile screens */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Due Count Badge (desktop only) */}
          {totalDueToday > 0 && !isStudyMode && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-medium">
              <Sparkles className="w-3 h-3" />
              <span>{totalDueToday} Due</span>
            </div>
          )}

          {/* Curriculum Builder Trigger - Icon button on mobile, with badge on tablet/desktop */}
          <button
            type="button"
            onClick={onOpenCurriculumModal}
            className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center sm:gap-1 cursor-pointer shrink-0 active:scale-95"
            title="Configure target languages, topics & difficulty"
          >
            <SlidersHorizontal className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden md:inline">Curriculum</span>
            <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize">
              {selectedLanguageFilter !== 'all'
                ? (activeProfile.languageDifficulties?.[selectedLanguageFilter] || activeProfile.selectedDifficulty || 'beginner')
                : (activeProfile.selectedDifficulty || 'beginner')} &bull; {decks.length}
            </span>
          </button>

          {/* Theme Toggle (Sun/Moon Button) - Explicit touch-friendly mobile target */}
          <button
            type="button"
            onClick={onToggleTheme}
            onTouchEnd={(e) => {
              e.preventDefault();
              onToggleTheme();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs touch-manipulation select-none relative z-20"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle light or dark theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
            )}
          </button>

          {/* Profile Switcher Trigger */}
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="h-9 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-2xs shrink-0 select-none touch-manipulation"
            title="Manage profiles & backup data"
          >
            <span className="text-sm select-none">{activeProfile.avatar}</span>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[45px] sm:max-w-[85px] truncate">
              {activeProfile.name}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Mobile Language Scroll Strip - hidden during study session for distraction-free learning */}
      {!isStudyMode && (
        <div className="lg:hidden border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectLanguageFilter('all')}
            className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors cursor-pointer ${
              selectedLanguageFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            All
          </button>
          {SUPPORTED_LANGUAGES.map(lang => {
            const isSelected = selectedLanguageFilter === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => onSelectLanguageFilter(lang.id)}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
