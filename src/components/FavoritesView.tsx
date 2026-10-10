import React, { useState } from 'react';
import type { Flashcard, Deck } from '../types';
import { FormattedContent } from './FormattedContent';
import { useSpeech } from '../hooks/useSpeech';
import { toggleCardFavorite, resetCardProgress, deleteCard } from '../db/database';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import {
  Star,
  ArrowLeft,
  Sparkles,
  Volume2,
  BookOpen,
  RotateCcw,
  Trash2,
  Filter,
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const { speak, isSupported: speechSupported } = useSpeech();

  const favoriteCards = cards.filter(c => c.isFavorite);

  const availableLanguages = Array.from(
    new Set(favoriteCards.map(c => c.languageId))
  );

  const displayedCards = selectedLanguage === 'all'
    ? favoriteCards
    : favoriteCards.filter(c => c.languageId === selectedLanguage);

  const handleToggleFavorite = async (cardId: string) => {
    await toggleCardFavorite(cardId);
    onRefresh();
  };

  const handleResetCard = async (cardId: string) => {
    await resetCardProgress(cardId);
    onRefresh();
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('Delete this card?')) {
      await deleteCard(cardId);
      onRefresh();
    }
  };

  const getLanguageMeta = (langId: string) => {
    return SUPPORTED_LANGUAGES.find(l => l.id === langId);
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
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>星标收藏句子 (Starred Favorites)</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {favoriteCards.length}
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                集中查阅与强化学习您收藏的重点难点表达，随时进行针对性巩固。
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
              <span>Study Favorites (10)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {availableLanguages.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs text-zinc-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setSelectedLanguage('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              selectedLanguage === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            All ({favoriteCards.length})
          </button>
          {availableLanguages.map(langId => {
            const meta = getLanguageMeta(langId);
            const count = favoriteCards.filter(c => c.languageId === langId).length;
            return (
              <button
                key={langId}
                onClick={() => setSelectedLanguage(langId)}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                  selectedLanguage === langId
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                <span>{meta?.flag || '🌐'}</span>
                <span>{meta?.name || langId}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
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
            No Starred Sentences
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            Click the star icon (★) while studying or viewing any language deck to bookmark important phrases here.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 cursor-pointer"
          >
            Browse Language Decks
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedCards.map(card => {
            const isDue = card.nextReviewDate <= Date.now();
            const deck = decks.find(d => d.id === card.deckId);
            const langMeta = getLanguageMeta(card.languageId);

            return (
              <div
                key={card.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs flex flex-col sm:flex-row items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <span>{langMeta?.flag || '🌐'}</span>
                      <span>{langMeta?.name || card.languageId}</span>
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300">
                      Box {card.box}
                    </span>

                    {card.difficulty && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {card.difficulty}
                      </span>
                    )}

                    {isDue && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        Due for recall
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
                        onClick={() => speak(card.front, deck?.languageCode || 'es-ES')}
                        title="Pronounce"
                        className="p-1 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    <FormattedContent content={card.back} />
                  </div>

                  {card.exampleTarget && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                      <span>
                        <strong>Context:</strong> {card.exampleTarget}{' '}
                        {card.exampleTranslation && <span className="italic">({card.exampleTranslation})</span>}
                      </span>
                    </div>
                  )}

                  {card.grammarNotes && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                      Note: {card.grammarNotes}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleFavorite(card.id)}
                    title="Remove from favorites"
                    className="p-1.5 rounded-md text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleResetCard(card.id)}
                    title="Reset to Box 1"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    title="Delete phrase"
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
