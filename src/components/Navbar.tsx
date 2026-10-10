import React from 'react';
import type { Profile, Deck } from '../types';
import { DIFFICULTY_LEVELS } from '../data/languages';
import {
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Star,
  BookOpen,
} from 'lucide-react';

interface NavbarProps {
  activeProfile: Profile;
  decks: Deck[];
  totalDueToday: number;
  totalFavorites: number;
  onOpenProfileModal: () => void;
  onOpenCurriculumModal: () => void;
  onOpenFavorites: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onGoHome: () => void;
  isStudyMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProfile,
  decks,
  totalDueToday,
  totalFavorites,
  onOpenProfileModal,
  onOpenCurriculumModal,
  onOpenFavorites,
  theme,
  onToggleTheme,
  onGoHome,
  isStudyMode = false,
}) => {
  const currentDiff = DIFFICULTY_LEVELS.find(d => d.id === activeProfile.selectedDifficulty) || DIFFICULTY_LEVELS[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-850 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            title="返回首页 (Return Home)"
            className="flex items-center gap-2.5 cursor-pointer group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-lg transition-transform active:scale-98 shrink-0"
          >
            <div className="w-8.5 h-8.5 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-all shrink-0 border border-zinc-800/80">
              <span className="font-bold text-xs tracking-tight select-none text-white">威廉</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                Leitner English
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wider mt-0.5">
                莱特纳 5 盒记忆系统
              </span>
            </div>

          </button>

          {/* CEFR Level Pill (desktop only) */}
          {!isStudyMode && (
            <button
              type="button"
              onClick={onOpenCurriculumModal}
              title="调整英语难度级别与学习主题"
              className="hidden md:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-[11px] font-medium border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">{currentDiff.chineseTitle}</span>
              <span className="text-zinc-400 dark:text-zinc-500">&bull;</span>
              <span className="text-zinc-500 dark:text-zinc-400">{decks.length} 个主题</span>
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Due Count Badge */}
          {totalDueToday > 0 && !isStudyMode && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              <span>{totalDueToday} 待复习</span>
            </div>
          )}

          {/* Starred Favorites Quick Button */}
          {totalFavorites > 0 && !isStudyMode && (
            <button
              type="button"
              onClick={onOpenFavorites}
              className="h-9 px-2.5 rounded-lg border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-amber-900 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="查看重点星标卡片"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{totalFavorites}</span>
            </button>
          )}

          {/* Curriculum Modal Button */}
          {!isStudyMode && (
            <button
              type="button"
              onClick={onOpenCurriculumModal}
              className="h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="设置学习难度与主题"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">课程设置</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer active:scale-95 select-none"
            title={`切换为${theme === 'dark' ? '浅色' : '深色'}模式`}
            aria-label="Toggle theme"
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
            className="h-9 flex items-center gap-1.5 px-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-2xs select-none"
            title="管理学员档案与数据备份"
          >
            <span className="text-sm select-none">{activeProfile.avatar}</span>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[65px] sm:max-w-[90px] truncate">
              {activeProfile.name}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};
