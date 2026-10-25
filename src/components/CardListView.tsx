import React, { useState } from 'react';
import { Volume2, Star, Eye, EyeOff, PlayCircle, MessageSquare, Layers, Sparkles } from 'lucide-react';
import type { Flashcard, CardType } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { DialogueCardContent } from './DialogueCardContent';
import { getChinesePinyin } from '../utils/pinyin';

interface CardListViewProps {
  cards: Flashcard[];
  activeType: CardType;
  onStudyType: (type: CardType) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  targetLangCode?: string;
}

export const CardListView: React.FC<CardListViewProps> = ({
  cards,
  activeType,
  onStudyType,
  onToggleFavorite,
  targetLangCode = 'en-US',
}) => {
  const [showAllTranslations, setShowAllTranslations] = useState<boolean>(false);
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const { speak } = useSpeech();

  const toggleExpand = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const dueCount = cards.filter((c) => new Date(c.nextReviewDate).getTime() <= Date.now()).length;

  const typeConfig: Record<CardType, { title: string; subtitle: string; icon: typeof MessageSquare; color: string }> = {
    word: {
      title: 'Vocabulary & Words',
      subtitle: 'Build your foundational vocabulary brick by brick',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600',
    },
    sentence: {
      title: 'Common Sentences',
      subtitle: 'Master natural sentence structures and fluent expressions',
      icon: Layers,
      color: 'from-amber-500 to-orange-600',
    },
    dialogue: {
      title: 'Conversations & Dialogues',
      subtitle: 'Real-world scenarios with turn-by-turn dialogue and audio',
      icon: MessageSquare,
      color: 'from-emerald-500 to-teal-600',
    },
  };

  const currentConfig = typeConfig[activeType];
  const IconComponent = currentConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-xl bg-gradient-to-br ${currentConfig.color} shadow-lg shrink-0`}>
              <IconComponent className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{currentConfig.title}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                  {cards.length} cards
                </span>
              </div>
              <p className="text-stone-300 text-sm mt-1 max-w-xl">
                {currentConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAllTranslations(!showAllTranslations)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-xs border border-white/10"
            >
              {showAllTranslations ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Hide Translations</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Show All Translations</span>
                </>
              )}
            </button>

            <button
              onClick={() => onStudyType(activeType)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Study Now {dueCount > 0 ? `(${dueCount} Due)` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800">
          <p className="text-stone-500 dark:text-stone-400">
            No cards found for this type in your active deck.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const isExpanded = expandedCardIds.has(card.id);
            const isFlipped = showAllTranslations || isExpanded;
            const isDialogue = card.cardType === 'dialogue';

            return (
              <div
                key={card.id}
                onClick={() => toggleExpand(card.id)}
                className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-stone-900/90 border transition-all cursor-pointer select-none ${
                  isExpanded
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm'
                }`}
              >
                {/* Card Top: Box badge + Favorite + Audio */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                      Box {card.box}
                    </span>
                    {card.cardType && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium capitalize bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                        {card.cardType}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!isDialogue && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(card.front, targetLangCode);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Listen"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite(card.id, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        card.isFavorite
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                      title={card.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star className={`w-4 h-4 ${card.isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 my-1">
                  {isDialogue ? (
                    <DialogueCardContent
                      front={card.front}
                      back={card.back}
                      phonetic={card.phonetic}
                      targetLangCode={targetLangCode}
                      isFlipped={isFlipped}
                      compact={!isExpanded && !showAllTranslations}
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-stone-900 dark:text-white leading-relaxed">
                        {card.front}
                      </p>
                      {card.phonetic && (
                        <p className="text-xs font-mono text-stone-400 dark:text-stone-500">
                          {card.phonetic}
                        </p>
                      )}
                      {isFlipped && (
                        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 animate-in fade-in duration-150 space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-medium">
                              {getChinesePinyin(card.back)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speak(card.back, 'zh-CN');
                              }}
                              title="Pronounce Chinese (朗读中文)"
                              className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm text-stone-700 dark:text-stone-300 font-medium">
                            {card.back}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: flip hint */}
                <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 border-t border-stone-100 dark:border-stone-800/60">
                  <span>
                    Next: {new Date(card.nextReviewDate).toLocaleDateString()}
                  </span>
                  <span className="italic">
                    {isFlipped ? 'Click to fold' : 'Click to reveal'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
