import React, { useState } from 'react';
import type { Deck, Flashcard, CardType } from '../types';
import { addCard, updateCard, deleteCard, resetCardProgress, toggleCardFavorite } from '../db/database';
import { FormattedContent } from './FormattedContent';
import { DialogueCardContent } from './DialogueCardContent';
import { useSpeech } from '../hooks/useSpeech';
import { getChinesePinyin } from '../utils/pinyin';
import {
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Volume2,
  Sparkles,
  BookOpen,
  Star,
  MessageSquare,
  Layers,
} from 'lucide-react';

interface DeckManagerProps {
  deck: Deck;
  cards: Flashcard[];
  activeBoxFilter: number | null;
  onRefresh: () => void;
  onStartStudy: () => void;
  onStudyFavorites?: () => void;
  dueCount: number;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  deck,
  cards,
  activeBoxFilter,
  onRefresh,
  onStartStudy,
  onStudyFavorites,
  dueCount,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form states
  const [cardType, setCardType] = useState<CardType>('word');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [exampleTarget, setExampleTarget] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [grammarNotes, setGrammarNotes] = useState('');
  const [hint, setHint] = useState('');

  const { speak, isSupported: speechSupported } = useSpeech();

  const resetForm = () => {
    setCardType('word');
    setFront('');
    setBack('');
    setPhonetic('');
    setExampleTarget('');
    setExampleTranslation('');
    setGrammarNotes('');
    setHint('');
    setIsAdding(false);
    setEditingCardId(null);
  };

  const handleStartEdit = (card: Flashcard) => {
    setEditingCardId(card.id);
    setCardType(card.cardType || 'word');
    setFront(card.front);
    setBack(card.back);
    setPhonetic(card.phonetic || '');
    setExampleTarget(card.exampleTarget || '');
    setExampleTranslation(card.exampleTranslation || '');
    setGrammarNotes(card.grammarNotes || '');
    setHint(card.hint || '');
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    if (editingCardId) {
      const existing = cards.find(c => c.id === editingCardId);
      if (existing) {
        await updateCard({
          ...existing,
          cardType,
          front: front.trim(),
          back: back.trim(),
          phonetic: phonetic.trim() || undefined,
          exampleTarget: exampleTarget.trim() || undefined,
          exampleTranslation: exampleTranslation.trim() || undefined,
          grammarNotes: grammarNotes.trim() || undefined,
          hint: hint.trim() || undefined,
        });
      }
    } else {
      await addCard(
        deck.id,
        deck.profileId,
        deck.difficulty,
        front,
        back,
        phonetic,
        exampleTarget,
        exampleTranslation,
        grammarNotes,
        hint,
        cardType
      );
    }

    resetForm();
    onRefresh();
  };

  const handleDelete = async (cardId: string) => {
    if (confirm('Delete this card permanently?')) {
      await deleteCard(cardId);
      onRefresh();
    }
  };

  const handleReset = async (cardId: string) => {
    await resetCardProgress(cardId);
    onRefresh();
  };

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<CardType | 'all'>('all');

  const handleToggleFav = async (cardId: string) => {
    await toggleCardFavorite(cardId);
    onRefresh();
  };

  const displayedCards = cards.filter(c => {
    if (activeBoxFilter !== null && c.box !== activeBoxFilter) return false;
    if (showFavoritesOnly && !c.isFavorite) return false;
    if (selectedTypeFilter !== 'all' && (c.cardType || 'word') !== selectedTypeFilter) return false;
    return true;
  });

  const favoritesCount = cards.filter(c => c.isFavorite).length;

  return (
    <div className="w-full">
      {/* Deck Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {deck.title.replace(/^英语\s*\(English\):\s*/i, '').trim()}
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
              {deck.difficulty}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {deck.description.replace(/^英语\s*\(English\):\s*/i, '').trim()}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          {favoritesCount > 0 && onStudyFavorites && (
            <button
              onClick={onStudyFavorites}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-amber-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Quickly review all starred favorite sentences in this deck"
            >
              <Star className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
              <span>Review ({favoritesCount})</span>
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Phrase</span>
          </button>

          <button
            onClick={onStartStudy}
            disabled={cards.length === 0}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {dueCount > 0 ? `Study Due (${dueCount})` : 'Practice All'}
            </span>
          </button>
        </div>
      </div>

      {/* Add / Edit Card Form Panel */}
      {isAdding && (
        <div className="mb-6 p-5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {editingCardId ? 'Edit Language Phrase' : 'Add New Language Phrase'}
            </h3>
            <span className="text-xs text-zinc-400 uppercase font-mono">
              英语 &bull; {deck.difficulty}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Card Type Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                卡片类别 (Card Type)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCardType('word')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    cardType === 'word'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>单词 (Word)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardType('sentence')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    cardType === 'sentence'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-amber-400'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>句子 (Sentence)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardType('dialogue')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    cardType === 'dialogue'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-400'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>对话 (Dialogue)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {cardType === 'dialogue'
                    ? '英文情景对话 (A: ... \\n B: ...)'
                    : '英文表达 / 核心词汇 (English Expression)'}
                </label>
                <textarea
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  placeholder={
                    cardType === 'dialogue'
                      ? 'A: Hello, how can I help you?\nB: I would like an iced latte, please.'
                      : '例如: Could you tell me how to get to the airport?'
                  }
                  rows={cardType === 'dialogue' ? 3 : 2}
                  required
                  className="w-full text-xs font-sans p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {cardType === 'dialogue'
                    ? '中文对话释义 (A: ... \\n B: ...)'
                    : '中文释义 / 详细含义 (Chinese Meaning)'}
                </label>
                <textarea
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  placeholder={
                    cardType === 'dialogue'
                      ? 'A: 您好，有什么可以帮您？\nB: 请给我来一杯冰拿铁。'
                      : '例如: 请问，去机场应该怎么走？'
                  }
                  rows={cardType === 'dialogue' ? 3 : 2}
                  required
                  className="w-full text-xs font-sans p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  国际音标 / 发音提示 (IPA / Pronunciation)
                </label>
                <input
                  type="text"
                  value={phonetic}
                  onChange={e => setPhonetic(e.target.value)}
                  placeholder="例如: /kʊd juː tɛl miː/"
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  语法考点与语境笔记 (Grammar & Context)
                </label>
                <input
                  type="text"
                  value={grammarNotes}
                  onChange={e => setGrammarNotes(e.target.value)}
                  placeholder="例如: Could 比 Can 语气更委婉，后接动词原形"
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  记忆线索与提示 (Recall Hint)
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={e => setHint(e.target.value)}
                  placeholder="例如: 礼貌问路常用句式"
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  英语例句 (English Context Sentence)
                </label>
                <input
                  type="text"
                  value={exampleTarget}
                  onChange={e => setExampleTarget(e.target.value)}
                  placeholder="例如: Excuse me, could you tell me how to get to the airport?"
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  例句中文对照 (Example Chinese Translation)
                </label>
                <input
                  type="text"
                  value={exampleTranslation}
                  onChange={e => setExampleTranslation(e.target.value)}
                  placeholder="例如: 打扰一下，请问坐地铁去机场该怎么走？"
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-xs cursor-pointer"
              >
                {editingCardId ? 'Save Changes' : 'Add Phrase'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1 gap-2 mb-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span>{displayedCards.length} phrase{displayedCards.length === 1 ? '' : 's'}</span>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80">
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  selectedTypeFilter === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('word')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedTypeFilter === 'word'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-500'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Words</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('sentence')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedTypeFilter === 'sentence'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-500'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Sentences</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('dialogue')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedTypeFilter === 'dialogue'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-500'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>Dialogues</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFavoritesOnly(prev => !prev)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                showFavoritesOnly
                  ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-2xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
              title="Filter by favorite sentences"
            >
              <Star className={`w-3 h-3 ${showFavoritesOnly ? 'fill-amber-950 text-amber-950' : 'text-zinc-400'}`} />
              <span>Favorites ({favoritesCount})</span>
            </button>
          </div>
          <span className="text-[11px]">Leitner 5-Box Schedule</span>
        </div>

        {displayedCards.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
            {showFavoritesOnly
              ? 'No favorite phrases found in this deck. Click the star icon on any card to add it to your favorites!'
              : 'No phrases found in this filter. Add a new phrase or clear the filter.'}
          </div>
        ) : (
          displayedCards.map(card => {
            const isDue = card.nextReviewDate <= Date.now();
            const isDialogue = card.cardType === 'dialogue';

            return (
              <div
                key={card.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs flex flex-col sm:flex-row items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300">
                      Box {card.box}
                    </span>
                    {card.cardType && (
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        card.cardType === 'dialogue'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : card.cardType === 'sentence'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {card.cardType}
                      </span>
                    )}
                    {isDue && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        Due for recall
                      </span>
                    )}
                    {card.phonetic && !isDialogue && (
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        {card.phonetic}
                      </span>
                    )}
                  </div>

                  {isDialogue ? (
                    <div className="pt-1">
                      <DialogueCardContent
                        front={card.front}
                        back={card.back}
                        phonetic={card.phonetic}
                        targetLangCode={deck.languageCode}
                        isFlipped={true}
                        compact={true}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          <FormattedContent content={card.front} />
                        </div>

                        {speechSupported && (
                          <button
                            type="button"
                            onClick={() => speak(card.front, deck.languageCode)}
                            title="Pronounce"
                            className="p-1 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                              title="Pronounce Chinese (朗读中文发音)"
                              className="p-0.5 rounded text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <FormattedContent content={card.back} />
                      </div>
                    </>
                  )}

                  {card.exampleTarget && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/60 space-y-0.5">
                      <div className="flex items-start gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                        <div>
                          <span><strong>Context:</strong> {card.exampleTarget}</span>
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
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleFav(card.id)}
                    title={card.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      card.isFavorite
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                        : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${card.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleReset(card.id)}
                    title="Reset to Box 1"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(card)}
                    title="Edit phrase"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    title="Delete phrase"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
