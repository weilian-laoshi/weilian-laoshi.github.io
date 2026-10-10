import React from 'react';
import type { LeitnerBoxSummary } from '../types';
import { Clock, CheckCircle2, Star } from 'lucide-react';

interface LeitnerVisualizerProps {
  summaries: LeitnerBoxSummary[];
  activeBoxFilter: number | null;
  onSelectBox: (box: number | null) => void;
  totalCards: number;
  totalDue: number;
  totalFavorites?: number;
  onOpenFavorites?: () => void;
}

export const LeitnerVisualizer: React.FC<LeitnerVisualizerProps> = ({
  summaries,
  activeBoxFilter,
  onSelectBox,
  totalCards,
  totalDue,
  totalFavorites = 0,
  onOpenFavorites,
}) => {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3.5 sm:mb-4">
        <div>
          <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
            莱特纳五盒记忆系统 (Leitner 5-Box SRS)
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            掌握牢固的卡片晋升至更高盒子并延长复习周期；遗忘则立即退回第1盒强化巩固。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs self-start sm:self-auto">
          {onOpenFavorites && (
            <button
              type="button"
              onClick={onOpenFavorites}
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg font-semibold transition-all cursor-pointer border ${
                totalFavorites > 0
                  ? 'bg-amber-400/15 text-amber-900 dark:text-amber-300 border-amber-400/30 hover:bg-amber-400/25'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-750 hover:text-amber-500'
              }`}
              title="查看所有星标重点句子"
            >
              <Star className={`w-3.5 h-3.5 ${totalFavorites > 0 ? 'fill-amber-400 text-amber-500' : 'text-zinc-400'}`} />
              <span>重点星标</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                totalFavorites > 0
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
              }`}>
                {totalFavorites}
              </span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalCards}</span> 句总词库
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-medium ${
            totalDue > 0
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
          }`}>
            {totalDue > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{totalDue} 句今日待复习</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>今日全部掌握</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 5-Box Stepper Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {summaries.map((s) => {
          const isSelected = activeBoxFilter === s.box;
          const percent = totalCards > 0 ? Math.round((s.cardCount / totalCards) * 100) : 0;

          return (
            <button
              key={s.box}
              type="button"
              onClick={() => onSelectBox(isSelected ? null : s.box)}
              className={`text-left p-2 sm:p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/20 dark:ring-zinc-100/20 shadow-xs'
                  : 'bg-zinc-50/70 dark:bg-zinc-900/70 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/90 border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              {/* Progress Bar under each box */}
              <div
                className={`absolute bottom-0 left-0 h-1 transition-all ${
                  isSelected ? 'bg-amber-400' : 'bg-indigo-500/40 dark:bg-indigo-400/30'
                }`}
                style={{ width: `${percent}%` }}
              />

              <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
                <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider ${
                  isSelected ? 'opacity-90' : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  <span className="sm:hidden">盒{s.box}</span>
                  <span className="hidden sm:inline">第 {s.box} 盒</span>
                </span>
                <span className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded ${
                  isSelected
                    ? 'bg-white/20 dark:bg-black/10'
                    : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {s.intervalDays}天
                </span>
              </div>

              <div className="flex items-baseline justify-between w-full">
                <span className={`text-base sm:text-xl font-bold tracking-tight ${
                  isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-100'
                }`}>
                  {s.cardCount}
                </span>

                {s.dueCount > 0 && (
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-amber-400 text-zinc-950 font-bold'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}>
                    <span className="sm:hidden">!{s.dueCount}</span>
                    <span className="hidden sm:inline">{s.dueCount} 待背</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {activeBoxFilter !== null && (
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>当前筛选：<strong>第 {activeBoxFilter} 盒</strong>内的短语</span>
          <button
            onClick={() => onSelectBox(null)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            显示全部盒子
          </button>
        </div>
      )}
    </div>
  );
};
