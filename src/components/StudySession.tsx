import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Flashcard, Deck, SessionResult } from '../types';
import { processCardReview } from '../db/database';
import { FormattedContent } from './FormattedContent';
import { useSpeech } from '../hooks/useSpeech';
import confetti from 'canvas-confetti';
import {
  Volume2,
  HelpCircle,
  RotateCw,
  CheckCircle,
  XCircle,
  Trophy,
  ArrowLeft,
  Sparkles,
  Repeat,
  BookOpen,
  SkipForward,
  Star,
} from 'lucide-react';

interface StudySessionProps {
  deck?: Deck;
  cards: Flashcard[];
  onFinish: () => void;
  onExit: () => void;
  onToggleFavorite?: (cardId: string) => Promise<boolean> | void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  deck,
  cards,
  onFinish,
  onExit,
  onToggleFavorite,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isReverseMode, setIsReverseMode] = useState(false); // Practice Native -> Target
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Local Starred Favorites Set for optimistic and reactive UI updates
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    cards.forEach(c => {
      if (c.isFavorite) initial.add(c.id);
    });
    return initial;
  });

  // Keep favoriteIds in sync whenever cards array updates
  useEffect(() => {
    const set = new Set<string>();
    cards.forEach(c => {
      if (c.isFavorite) set.add(c.id);
    });
    setFavoriteIds(set);
  }, [cards]);

  const currentCard = cards[currentIndex];

  const handleToggleCurrentFavorite = useCallback(async () => {
    if (!currentCard) return;
    const isCurrentlyFav = favoriteIds.has(currentCard.id);
    const newFav = !isCurrentlyFav;

    // Mutate in-memory card object so subsequent reviews/grades retain the favorite state
    currentCard.isFavorite = newFav;

    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (newFav) next.add(currentCard.id);
      else next.delete(currentCard.id);
      return next;
    });

    if (onToggleFavorite) {
      await onToggleFavorite(currentCard.id);
    }
  }, [currentCard, favoriteIds, onToggleFavorite]);

  // Swipe & Drag Gesture State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flyDirection, setFlyDirection] = useState<'left' | 'right' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const { speak, isSpeaking, isSupported: speechSupported } = useSpeech();

  const targetLangCode = deck?.languageCode || 'en-US';

  const handleSpeak = useCallback((text: string, forceLang?: string) => {
    speak(text, forceLang || targetLangCode);
  }, [speak, targetLangCode]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleSkip = useCallback(() => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
      setDragOffset(0);
      setFlyDirection(null);
    } else {
      setIsCompleted(true);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
        });
      } catch {
        // Fallback silently if canvas not available
      }
    }
  }, [currentIndex, cards.length]);

  const handleGrade = useCallback(async (wasCorrect: boolean) => {
    if (!currentCard) return;

    const { oldBox, newBox } = await processCardReview(currentCard, wasCorrect);

    const result: SessionResult = {
      cardId: currentCard.id,
      wasCorrect,
      oldBox,
      newBox,
    };

    const nextResults = [...sessionResults, result];
    setSessionResults(nextResults);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setIsCompleted(true);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
        });
      } catch {
        // Fallback silently if canvas not available
      }
    }
  }, [currentCard, currentIndex, cards.length, sessionResults]);

  // Pointer / Touch Swipe Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || !isDragging) return;
    const diffX = e.clientX - dragStartRef.current.x;
    const diffY = e.clientY - dragStartRef.current.y;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      setDragOffset(diffX);
    }
  };

  const handlePointerUp = () => {
    if (!dragStartRef.current) return;
    const wasHorizontal = isHorizontalSwipeRef.current;
    const offset = dragOffset;
    const duration = Date.now() - dragStartRef.current.time;
    const velocity = Math.abs(offset) / Math.max(duration, 1);

    dragStartRef.current = null;
    isHorizontalSwipeRef.current = null;
    setIsDragging(false);

    // Minor movement (< 8px) is a clean tap to flip
    if (Math.abs(offset) < 8) {
      setDragOffset(0);
      handleFlip();
      return;
    }

    // Meaningful horizontal swipe: threshold > 65px or quick flick
    if (wasHorizontal && (Math.abs(offset) > 65 || velocity > 0.35)) {
      const direction = offset > 0 ? 'right' : 'left';
      setFlyDirection(direction);

      setTimeout(() => {
        setFlyDirection(null);
        setDragOffset(0);
        // Swiping left = Review Again (false), Swiping right = I Know This (true)
        if (direction === 'right') {
          handleGrade(true);
        } else {
          handleGrade(false);
        }
      }, 160);
    } else {
      setDragOffset(0);
    }
  };

  const handlePointerCancel = () => {
    dragStartRef.current = null;
    isHorizontalSwipeRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  // Global Keyboard listener for spacebar, 1, 2, K, S, H, Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === '1' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGrade(false);
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleGrade(true);
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleSkip();
      } else if (e.key.toLowerCase() === 's') {
        if (currentCard) {
          e.preventDefault();
          handleSpeak(isReverseMode ? currentCard.back : currentCard.front);
        }
      } else if (e.key.toLowerCase() === 'h') {
        if (currentCard?.hint) {
          e.preventDefault();
          setShowHint(prev => !prev);
        }
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleCurrentFavorite();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleGrade, handleSkip, handleSpeak, handleToggleCurrentFavorite, isFlipped, isCompleted, currentCard, isReverseMode, onExit]);

  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          All Caught Up!
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
          No cards currently due in this deck according to your Leitner review schedule.
        </p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
        >
          Return to Deck
        </button>
      </div>
    );
  }

  if (isCompleted) {
    const total = sessionResults.length;
    const correctCount = sessionResults.filter(r => r.wasCorrect).length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const advanced = sessionResults.filter(r => r.newBox > r.oldBox).length;

    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
          Review Session Complete!
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8">
          Excellent work reinforcing your language retention with spaced repetition.
        </p>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 mb-8 text-left shadow-xs space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Phrases Practiced</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{total}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Recall Accuracy</span>
            <span className={`font-semibold ${accuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {accuracy}%
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Promoted to Higher Box</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {advanced} phrases
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onFinish}
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-xs cursor-pointer"
          >
            Finish Session
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  // Content display according to reverse mode
  const promptText = isReverseMode ? currentCard.back : currentCard.front;
  const answerText = isReverseMode ? currentCard.front : currentCard.back;

  // Dynamic card transform based on swipe dragging or fly-off
  const getCardStyle = (): React.CSSProperties => {
    if (flyDirection) {
      const x = flyDirection === 'right' ? 450 : -450;
      const rot = flyDirection === 'right' ? 18 : -18;
      return {
        transform: `translate3d(${x}px, 0, 0) rotate(${rot}deg)`,
        opacity: 0,
        transition: 'transform 0.16s ease-out, opacity 0.16s ease-out',
        touchAction: 'pan-y',
      };
    }

    if (dragOffset !== 0) {
      const rot = Math.min(Math.max(dragOffset * 0.04, -14), 14);
      return {
        transform: `translate3d(${dragOffset}px, 0, 0) rotate(${rot}deg)`,
        transition: isDragging ? 'none' : 'transform 0.22s ease-out',
        touchAction: 'pan-y',
      };
    }

    return {
      transform: 'translate3d(0, 0, 0) rotate(0deg)',
      transition: 'transform 0.22s ease-out',
      touchAction: 'pan-y',
    };
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-3 flex flex-col min-h-[580px]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Session</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Reverse Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsReverseMode(prev => !prev)}
            title="切换卡片提示方向 (英文原句 → 中文释义 或 中文释义 → 英文原句)"
            className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              isReverseMode
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isReverseMode ? '逆向练习 (中文 → 英文)' : '顺向练习 (英文 → 中文)'}</span>
          </button>

          <span className="px-2 py-1 rounded-md text-[11px] font-mono uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
            Box {currentCard.box}
          </span>
          <span className="text-xs font-mono text-zinc-400">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Flashcard Container with Swipe Support */}
      <div className="perspective-1000 flex-1 flex flex-col justify-center my-auto min-h-[380px] relative overflow-hidden px-1">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={isDragging ? handlePointerMove : undefined}
          onPointerUp={isDragging ? handlePointerUp : undefined}
          onPointerCancel={isDragging ? handlePointerCancel : undefined}
          style={getCardStyle()}
          className={`w-full min-h-[360px] rounded-2xl border transition-all duration-300 cursor-grab active:cursor-grabbing p-8 flex flex-col justify-between relative shadow-sm hover:shadow-md select-none touch-pan-y ${
            isFlipped
              ? 'bg-zinc-50/90 dark:bg-zinc-900/90 border-zinc-300 dark:border-zinc-700 ring-1 ring-zinc-400/20'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
          }`}
        >
          {/* Dynamic Swipe Direction Feedback Badges */}
          {dragOffset > 25 && (
            <div className="absolute top-4 right-4 z-30 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 bg-emerald-600 text-white border border-emerald-500">
              <span>I Know This</span>
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          {dragOffset < -25 && (
            <div className="absolute top-4 left-4 z-30 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 bg-rose-600 text-white border border-rose-500">
              <XCircle className="w-3.5 h-3.5 text-white" />
              <span>Review Again</span>
            </div>
          )}

          {/* Card Top Meta */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {isFlipped ? 'Meaning & Usage' : 'Target Phrase'}
              </span>
              {currentCard.difficulty && (
                <span className="text-[10px] font-medium uppercase px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {currentCard.difficulty}
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-2"
              onClick={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Star Favorite Button */}
              <button
                type="button"
                title={favoriteIds.has(currentCard.id) ? 'Remove from favorites (F)' : 'Mark as favorite sentence (F)'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCurrentFavorite();
                }}
                onPointerDown={e => e.stopPropagation()}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-90 shrink-0 ${
                  favoriteIds.has(currentCard.id)
                    ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                    : 'text-zinc-400 hover:text-amber-500 border-zinc-200 dark:border-zinc-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 bg-zinc-50/50 dark:bg-zinc-900/50'
                }`}
                aria-label="Toggle favorite"
              >
                <Star
                  className={`w-4 h-4 transition-transform ${
                    favoriteIds.has(currentCard.id)
                      ? 'fill-amber-950 text-amber-950 scale-110'
                      : 'hover:scale-110'
                  }`}
                />
              </button>

              {/* Speech Audio Button */}
              {speechSupported && (
                <button
                  type="button"
                  title="Pronounce with native accent (Shortcut: S)"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(isReverseMode ? answerText : promptText);
                  }}
                  onPointerDown={e => e.stopPropagation()}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-95 shrink-0 ${
                    isSpeaking
                      ? 'bg-amber-400 text-zinc-950 border-amber-500 ring-2 ring-amber-400/40 scale-105 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50'
                  }`}
                  aria-label="Listen to pronunciation"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-zinc-950' : ''}`} />
                </button>
              )}

              {/* Hint Toggle */}
              {currentCard.hint && !isFlipped && (
                <button
                  type="button"
                  title="Toggle Hint (Shortcut: H)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(prev => !prev);
                  }}
                  onPointerDown={e => e.stopPropagation()}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors cursor-pointer active:scale-95 shrink-0 ${
                    showHint
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-300'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50'
                  }`}
                  aria-label="Toggle hint"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="my-auto py-3 sm:py-4">
            {!isFlipped ? (
              <div>
                {/* Phonetic / Pinyin display */}
                {!isReverseMode && currentCard.phonetic && (
                  <div className="mb-2.5">
                    <span className="inline-block text-xs sm:text-sm font-mono px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 whitespace-pre-line">
                      {currentCard.phonetic}
                    </span>
                  </div>
                )}

                <FormattedContent
                  content={promptText}
                  className="text-xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug"
                />

                {/* Mobile-Friendly Quick Audio Trigger */}
                {speechSupported && (
                  <div
                    className="mt-3 flex items-center gap-2"
                    onClick={e => e.stopPropagation()}
                    onPointerDown={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleSpeak(promptText)}
                      onPointerDown={e => e.stopPropagation()}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                        isSpeaking
                          ? 'bg-amber-400 text-zinc-950 border-amber-500 ring-2 ring-amber-400/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      <span>{isSpeaking ? 'Speaking...' : 'Tap to Listen'}</span>
                    </button>
                  </div>
                )}

                {showHint && currentCard.hint && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 animate-in fade-in">
                    <strong>Hint:</strong> {currentCard.hint}
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in duration-200 space-y-3.5 sm:space-y-4">
                <div>
                  <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider block mb-1">
                    Translation
                  </span>
                  <FormattedContent
                    content={answerText}
                    className="text-lg sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 leading-snug"
                  />

                  {isReverseMode && currentCard.phonetic && (
                    <div className="mt-1.5 mb-2">
                      <span className="inline-block text-xs font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 whitespace-pre-line">
                        {currentCard.phonetic}
                      </span>
                    </div>
                  )}

                  {/* Audio button for revealed translation if target is on back */}
                  {speechSupported && isReverseMode && (
                    <div
                      className="mt-2.5 flex items-center gap-2"
                      onClick={e => e.stopPropagation()}
                      onPointerDown={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleSpeak(answerText, targetLangCode)}
                        onPointerDown={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 active:scale-95 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>朗读英文 (Listen)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Example sentence & translation */}
                {currentCard.exampleTarget && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>语境例句 (In Context):</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(currentCard.exampleTarget!, targetLangCode);
                        }}
                        onPointerDown={e => e.stopPropagation()}
                        title="朗读语境例句"
                        className="p-1 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 cursor-pointer active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {currentCard.exampleTarget}
                    </p>
                    {currentCard.exampleTranslation && (
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 italic">
                        "{currentCard.exampleTranslation}"
                      </p>
                    )}
                  </div>
                )}

                {/* Grammar & cultural context explanation */}
                {currentCard.grammarNotes && (
                  <div className="mt-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/90 dark:border-indigo-900/50 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed shadow-2xs">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>语法重点与文化语境 (Context & Notes)</span>
                    </div>
                    <p className="opacity-95">{currentCard.grammarNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Flip / Gesture Hint */}
          <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 shrink-0" />
              <span>Tap to {isFlipped ? 'flip back' : 'reveal'}</span>
              <span className="opacity-70">&bull; Swipe &larr; Review Again &bull; Swipe &rarr; I Know This</span>
            </span>
            <span className="font-mono text-[11px] uppercase">
              English · 莱特纳
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="mt-4 sm:mt-6 flex items-center gap-2 sm:gap-3">
        {!isFlipped ? (
          <div className="w-full flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleFlip}
              className="flex-1 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <span>查看中文释义 / 翻转 (Show Meaning)</span>
              <kbd className="hidden sm:inline-block font-mono bg-white/20 dark:bg-black/10 px-1.5 py-0.5 rounded text-[10px]">Space</kbd>
            </button>
            <button
              type="button"
              onClick={handleSkip}
              title="跳过此卡片 (快捷键: K 或左右滑动作答)"
              className="py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
            >
              <SkipForward className="w-4 h-4" />
              <span>跳过</span>
              <kbd className="hidden sm:inline-block font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">K</kbd>
            </button>
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleGrade(false)}
              className="py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-500/10 hover:bg-red-500/15 text-red-700 dark:text-red-400 text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span>还未掌握 (Review Again)</span>
              <kbd className="hidden sm:inline-block font-mono bg-red-500/10 px-1.5 py-0.5 rounded text-[10px]">1</kbd>
            </button>

            <button
              type="button"
              onClick={() => handleGrade(true)}
              className="py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>已掌握 (I Know This)</span>
              <kbd className="hidden sm:inline-block font-mono bg-emerald-500/15 px-1.5 py-0.5 rounded text-[10px]">2</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
