import React, { useState } from 'react';
import type { Flashcard, Deck } from '../types';
import { FormattedContent } from './FormattedContent';
import { useSpeech } from '../hooks/useSpeech';
import { getChinesePinyin } from '../utils/pinyin';
import { toggleCardFavorite, resetCardProgress, deleteCard } from '../db/database';
import { DIFFICULTY_LEVELS } from '../data/languages';
import {
  Star,
  ArrowLeft,
  Sparkles,
  Volume2,
  BookOpen,
  RotateCcw,
  Trash2,
  Layers,
} from 'lucide-react';

interface FavoritesViewProps {
  cards: Flashcard[];
  decks: Deck[];
  onBack: () => void;
  onStartStudyFavorites: () => void;
  onRefresh: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  cards,
  decks,
  onBack,
  onStartStudyFavorites,
  onRefresh,
}) => {
  const [selectedBoxFilter, setSelectedBoxFilter] = useState<number | 'all'>('all');
  const { speak, isSupported: speechSupported } = useSpeech();

  const favoriteCards = cards.filter(c => c.isFavorite);

  const displayedCards = selectedBoxFilter === 'all'
    ? favoriteCards
    : favoriteCards.filter(c => c.box === selectedBoxFilter);

  const handleToggleFavorite = async (cardId: string) => {
    await toggleCardFavorite(cardId);
    onRefresh();
  };

  const handleResetCard = async (cardId: string) => {
    await resetCardProgress(cardId);
    onRefresh();
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('确认永久删除这张卡片吗？')) {
      await deleteCard(cardId);
      onRefresh();
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 cursor-pointer mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回学习主页 (Back to Home)</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>星标重点句子 (Starred Sentences)</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {favoriteCards.length}
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                专为你标记的英语重难点短语提供专属 10 题冲刺复习与深度巩固。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {favoriteCards.length > 0 && (
            <button
              onClick={onStartStudyFavorites}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-amber-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>开始星标专练 (10题)</span>
            </button>
          )}
        </div>
      </div>

      {/* Box filter pills if favorites exist */}
      {favoriteCards.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-400 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5" /> 筛选盒子:
          </span>
          <button
            onClick={() => setSelectedBoxFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              selectedBoxFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            全部 ({favoriteCards.length})
          </button>
          {[1, 2, 3, 4, 5].map(b => {
            const count = favoriteCards.filter(c => c.box === b).length;
            if (count === 0) return null;
            return (
              <button
                key={b}
                onClick={() => setSelectedBoxFilter(b)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  selectedBoxFilter === b
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                盒 {b} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Cards List */}
      {displayedCards.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 fill-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            暂无收藏卡片
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            在复习或浏览词库卡片时，点击星标（★）即可将重要句子收藏至此处。
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 cursor-pointer"
          >
            浏览英语词库
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedCards.map(card => {
            const isDue = card.nextReviewDate <= Date.now();
            const deck = decks.find(d => d.id === card.deckId);
            const diffDef = DIFFICULTY_LEVELS.find(d => d.id === card.difficulty);

            return (
              <div
                key={card.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs flex flex-col sm:flex-row items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <span>🇬🇧</span>
                      <span>{deck?.title || '英语词库'}</span>
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300">
                      盒 {card.box}
                    </span>

                    {card.difficulty && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {diffDef?.chineseTitle || card.difficulty}
                      </span>
                    )}

                    {isDue && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        今日待复习
                      </span>
                    )}

                    {card.phonetic && (
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        {card.phonetic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      <FormattedContent content={card.front} />
                    </div>

                    {speechSupported && (
                      <button
                        type="button"
                        onClick={() => speak(card.front, deck?.languageCode || 'en-US')}
                        title="朗读发音"
                        className="p-1 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-medium">
                        {getChinesePinyin(card.back)}
                      </span>
                      {speechSupported && (
                        <button
                          type="button"
                          onClick={() => speak(card.back, 'zh-CN')}
                          title="朗读中文发音"
                          className="p-0.5 rounded text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <FormattedContent content={card.back} />
                  </div>

                  {card.exampleTarget && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/60 space-y-0.5">
                      <div className="flex items-start gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                        <div>
                          <span><strong>例句：</strong> {card.exampleTarget}</span>
                          {card.exampleTranslation && (
                            <div className="mt-0.5">
                              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 mr-1.5">
                                {getChinesePinyin(card.exampleTranslation)}
                              </span>
                              <span className="italic text-zinc-600 dark:text-zinc-400">
                                ({card.exampleTranslation})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {card.grammarNotes && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                      考点提示：{card.grammarNotes}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleFavorite(card.id)}
                    title="取消收藏"
                    className="p-1.5 rounded-md text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleResetCard(card.id)}
                    title="重置到第1盒"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    title="删除卡片"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
