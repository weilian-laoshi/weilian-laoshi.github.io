import React, { useState, useEffect, useCallback } from 'react';
import type { Profile, Deck, Flashcard, LeitnerBoxSummary, DifficultyLevel } from './types';
import {
  getAllProfiles,
  createProfile,
  getDecksForProfile,
  getAllCardsForProfile,
  getCardsForDeck,
  getDueCards,
  seedCurriculumForProfile,
  computeBoxSummaries,
  createCustomDeck,
  deleteDeck,
  toggleCardFavorite,
  sanitizeEnglishDatabase,
  db,
} from './db/database';
import { DIFFICULTY_LEVELS, LANGUAGE_TOPICS, normalizeDifficulty } from './data/languages';
import { Navbar } from './components/Navbar';
import { LeitnerVisualizer } from './components/LeitnerVisualizer';
import { DeckManager } from './components/DeckManager';
import { StudySession } from './components/StudySession';
import { FavoritesView } from './components/FavoritesView';
import { LanguageCurriculumModal } from './components/LanguageCurriculumModal';
import { ProfileModal } from './components/ProfileModal';
import {
  Plus,
  Play,
  Layers,
  ArrowRight,
  Trash2,
  SlidersHorizontal,
  Star,
  Compass,
  Plane,
  Utensils,
  ShoppingBag,
  HeartHandshake,
  Briefcase,
  Sparkles,
  Landmark,
  Atom,
} from 'lucide-react';

const TOPIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Plane,
  Utensils,
  ShoppingBag,
  HeartHandshake,
  Briefcase,
  Sparkles,
  Landmark,
  Atom,
};

export function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [boxSummaries, setBoxSummaries] = useState<LeitnerBoxSummary[]>([]);
  const [activeBoxFilter, setActiveBoxFilter] = useState<number | null>(null);

  // Modals & Navigation states
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isFavoritesPage, setIsFavoritesPage] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCustomDeckModalOpen, setIsCustomDeckModalOpen] = useState(false);

  // Custom deck form state
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<DifficultyLevel>('A1');

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('leitner_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  const applyThemeToDom = useCallback((nextTheme: 'dark' | 'light') => {
    try {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#09090b');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fafafa');
      }
      localStorage.setItem('leitner_theme', nextTheme);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme, applyThemeToDom]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyThemeToDom(next);
      return next;
    });
  }, [applyThemeToDom]);

  // Load or Initialize Profile (English Only)
  const loadInitialData = useCallback(async () => {
    await sanitizeEnglishDatabase();
    let allProf = await getAllProfiles();
    if (allProf.length === 0) {
      // First time onboarding: seed default profile for Chinese students learning English
      const initial = await createProfile(
        '英语学员',
        '🌱',
        ['english'],
        LANGUAGE_TOPICS.map(t => t.id),
        'A1',
        'en-US'
      );
      allProf = [initial];
    }

    setProfiles(allProf);
    const current = allProf[0];
    if (current) {
      const currentTopics = current.selectedTopics && current.selectedTopics.length > 0
        ? current.selectedTopics
        : LANGUAGE_TOPICS.map(t => t.id);
      const currentDiff = normalizeDifficulty(current.selectedDifficulty || 'A1');

      await seedCurriculumForProfile(current.id, currentTopics, currentDiff);
    }
    setActiveProfile(current);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load Decks & Cards for the Active Profile
  const refreshProfileData = useCallback(async () => {
    if (!activeProfile) return;

    const profDecks = await getDecksForProfile(activeProfile.id);
    setDecks(profDecks);

    const totalProfileCards = await getAllCardsForProfile(activeProfile.id);
    setAllCards(totalProfileCards);

    let activeCards: Flashcard[] = [];
    if (selectedDeckId) {
      activeCards = await getCardsForDeck(selectedDeckId);
    } else {
      activeCards = totalProfileCards;
    }

    setCards(activeCards);
    setBoxSummaries(computeBoxSummaries(activeCards));
  }, [activeProfile, selectedDeckId]);

  useEffect(() => {
    refreshProfileData();
  }, [refreshProfileData]);

  const handleSelectDeck = (deckId: string | null) => {
    setSelectedDeckId(deckId);
    setActiveBoxFilter(null);
    setIsFavoritesPage(false);
  };

  // Return to the main page
  const handleGoHome = () => {
    setIsStudyMode(false);
    setIsFavoritesPage(false);
    setSelectedDeckId(null);
    setActiveBoxFilter(null);
    setIsProfileModalOpen(false);
    setIsCurriculumModalOpen(false);
    setIsCustomDeckModalOpen(false);
  };

  // Start Study Session (Enforce 10 sentences per session)
  const handleStartStudy = async (deckId?: string) => {
    if (!activeProfile) return;

    const SESSION_SIZE = 10;
    const dueCards = await getDueCards(
      activeProfile.id,
      deckId || selectedDeckId || undefined
    );

    let queue: Flashcard[] = [];
    if (dueCards.length > 0) {
      queue = dueCards.slice(0, SESSION_SIZE);
    } else {
      // If no cards are due today, practice cards in current scope
      const targetCards = deckId
        ? await getCardsForDeck(deckId)
        : selectedDeckId
        ? await getCardsForDeck(selectedDeckId)
        : cards;

      queue = targetCards.slice(0, SESSION_SIZE);
    }

    setStudyQueue(queue);
    setIsStudyMode(true);
  };

  // Start Study Session for Favorite Flashcards (10 per session)
  const handleStudyFavorites = async (deckId?: string) => {
    if (!activeProfile) return;

    const SESSION_SIZE = 10;
    const targetCards = deckId
      ? await getCardsForDeck(deckId)
      : (allCards.length > 0 ? allCards : await getAllCardsForProfile(activeProfile.id));

    const favoriteCards = targetCards.filter(c => c.isFavorite);
    if (favoriteCards.length === 0) {
      alert('您尚未标记任何重点星标句子！在学习或词库中点击星标（★）即可收藏。');
      return;
    }

    setStudyQueue(favoriteCards.slice(0, SESSION_SIZE));
    setIsStudyMode(true);
  };

  // Save Curriculum (English Topics + Difficulty)
  const handleSaveCurriculum = async (
    _languages: any,
    topics: string[],
    difficulties: Partial<Record<any, DifficultyLevel>>
  ) => {
    if (!activeProfile) return;

    const targetDifficulty = normalizeDifficulty(difficulties['english'] || activeProfile.selectedDifficulty || 'A1');

    await seedCurriculumForProfile(activeProfile.id, topics, targetDifficulty);

    activeProfile.selectedLanguages = ['english'];
    activeProfile.selectedTopics = topics;
    activeProfile.selectedDifficulty = targetDifficulty;
    activeProfile.languageDifficulties = { english: targetDifficulty };

    await db.profiles.put(activeProfile);
    setActiveProfile({ ...activeProfile });

    await refreshProfileData();
  };

  // Create Custom English Deck
  const handleCreateCustomDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !customTitle.trim()) return;

    const newDeck = await createCustomDeck(
      activeProfile.id,
      customTitle.trim(),
      customDesc.trim(),
      customDifficulty
    );

    setCustomTitle('');
    setCustomDesc('');
    setIsCustomDeckModalOpen(false);
    await refreshProfileData();
    setSelectedDeckId(newDeck.id);
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (confirm('确认删除此词库及其所有记忆卡片？')) {
      await deleteDeck(deckId);
      if (selectedDeckId === deckId) {
        setSelectedDeckId(null);
      }
      await refreshProfileData();
    }
  };

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-400 text-xs font-mono">
        正在初始化莱特纳英语学习系统...
      </div>
    );
  }

  const selectedDeck = decks.find(d => d.id === selectedDeckId);
  const totalDueCards = cards.filter(c => c.nextReviewDate <= Date.now()).length;
  const totalFavoriteCards = allCards.filter(c => c.isFavorite).length;
  const currentDiffDef = DIFFICULTY_LEVELS.find(d => d.id === activeProfile.selectedDifficulty) || DIFFICULTY_LEVELS[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
      <Navbar
        activeProfile={activeProfile}
        decks={decks}
        totalDueToday={totalDueCards}
        totalFavorites={totalFavoriteCards}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenCurriculumModal={() => setIsCurriculumModalOpen(true)}
        onOpenFavorites={() => {
          setSelectedDeckId(null);
          setIsFavoritesPage(true);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoHome={handleGoHome}
        isStudyMode={isStudyMode}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-8">
        {isStudyMode ? (
          <StudySession
            deck={selectedDeck}
            cards={studyQueue}
            onToggleFavorite={async (cardId) => {
              const res = await toggleCardFavorite(cardId);
              setStudyQueue(prev =>
                prev.map(c => (c.id === cardId ? { ...c, isFavorite: res } : c))
              );
              await refreshProfileData();
              return res;
            }}
            onFinish={() => {
              setIsStudyMode(false);
              refreshProfileData();
            }}
            onExit={() => {
              setIsStudyMode(false);
              refreshProfileData();
            }}
          />
        ) : isFavoritesPage ? (
          <FavoritesView
            cards={allCards}
            decks={decks}
            onBack={() => setIsFavoritesPage(false)}
            onStartStudyFavorites={() => handleStudyFavorites()}
            onRefresh={refreshProfileData}
          />
        ) : (
          <div>
            {/* Visualizer Header */}
            <LeitnerVisualizer
              summaries={boxSummaries}
              activeBoxFilter={activeBoxFilter}
              onSelectBox={setActiveBoxFilter}
              totalCards={cards.length}
              totalDue={totalDueCards}
              totalFavorites={totalFavoriteCards}
              onOpenFavorites={() => {
                setSelectedDeckId(null);
                setIsFavoritesPage(true);
              }}
            />

            {/* If viewing a single deck */}
            {selectedDeck ? (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => setSelectedDeckId(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>&larr; 返回所有英语词库 (View All English Decks)</span>
                  </button>
                </div>

                <DeckManager
                  deck={selectedDeck}
                  cards={cards}
                  activeBoxFilter={activeBoxFilter}
                  onRefresh={refreshProfileData}
                  onStartStudy={() => handleStartStudy(selectedDeck.id)}
                  onStudyFavorites={() => handleStudyFavorites(selectedDeck.id)}
                  dueCount={totalDueCards}
                />
              </div>
            ) : (
              /* All Decks Overview */
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        英语主题词库 (English Decks)
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {currentDiffDef.chineseTitle}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      结合莱特纳 5 盒间隔重复记忆法，掌握纯正英美地道表达与语法考点。
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    {cards.length > 0 && (
                      <button
                        onClick={() => handleStartStudy()}
                        className="w-full sm:w-auto order-first sm:order-last px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>开始今日复习 ({totalDueCards} 待复习)</span>
                      </button>
                    )}

                    {totalFavoriteCards > 0 && (
                      <button
                        onClick={() => handleStudyFavorites()}
                        className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-amber-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title="复习所有星标重点句子"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                        <span>重点星标 ({totalFavoriteCards})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsCurriculumModalOpen(true)}
                      className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>等级与主题</span>
                    </button>

                    <button
                      onClick={() => setIsCustomDeckModalOpen(true)}
                      className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新建词库</span>
                    </button>
                  </div>
                </div>

                {/* Deck Cards Grid */}
                {decks.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      当前暂无词库
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
                      打开课程设置，勾选学习主题与目标等级以生成词库。
                    </p>
                    <button
                      onClick={() => setIsCurriculumModalOpen(true)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 cursor-pointer shadow-xs"
                    >
                      打开课程配置
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decks.map(deck => (
                      <EnglishDeckCard
                        key={deck.id}
                        deck={deck}
                        onOpen={() => handleSelectDeck(deck.id)}
                        onStudy={() => handleStartStudy(deck.id)}
                        onDelete={() => handleDeleteDeck(deck.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Curriculum Modal */}
      <LanguageCurriculumModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
        initialTopics={activeProfile.selectedTopics || LANGUAGE_TOPICS.map(t => t.id)}
        initialDifficulty={activeProfile.selectedDifficulty || 'A1'}
        initialLanguageDifficulties={activeProfile.languageDifficulties || { english: 'A1' }}
        onSaveCurriculum={handleSaveCurriculum}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectProfile={prof => {
          setActiveProfile(prof);
          setSelectedDeckId(null);
        }}
        onRefreshProfiles={loadInitialData}
        onOpenCurriculumModal={() => setIsCurriculumModalOpen(true)}
      />

      {/* Create Custom Deck Modal */}
      {isCustomDeckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              创建自定义英语词库
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              自主收录日常工作或阅读中遇到的生词生句，享受莱特纳智能复习。
            </p>

            <form onSubmit={handleCreateCustomDeck} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  目标难度级别
                </label>
                <select
                  value={customDifficulty}
                  onChange={e => setCustomDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                >
                  {DIFFICULTY_LEVELS.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.chineseTitle} ({d.cefr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  词库名称
                </label>
                <input
                  type="text"
                  placeholder="例如: 雅思口语高频搭配、海外租房生活英语"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  词库简介 / 重点说明
                </label>
                <input
                  type="text"
                  placeholder="简要备注此词库的学习目标与语境"
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCustomDeckModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer shadow-xs"
                >
                  创建词库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual English Deck Card
function getTopicIcon(topicId?: string): React.ComponentType<{ className?: string }> {
  const topicDef = LANGUAGE_TOPICS.find(t => t.id === topicId);
  return (topicDef && TOPIC_ICONS[topicDef.icon]) || Layers;
}

function EnglishDeckCard({
  deck,
  onOpen,
  onStudy,
  onDelete,
}: {
  deck: Deck;
  onOpen: () => void;
  onStudy: () => void;
  onDelete: () => void;
}) {
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    getCardsForDeck(deck.id).then(setDeckCards);
  }, [deck.id]);

  const dueCount = deckCards.filter(c => c.nextReviewDate <= Date.now()).length;
  const TopicIcon = getTopicIcon(deck.topicId);
  const cleanTitle = deck.title.replace(/^英语\s*\(English\):\s*/i, '').trim();
  const cleanDesc = deck.description.replace(/^英语\s*\(English\):\s*/i, '').trim();

  return (
    <div
      onClick={onOpen}
      className="p-4 sm:p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between cursor-pointer group shadow-2xs hover:shadow-xs active:scale-[0.99] relative"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 border border-zinc-200/70 dark:border-zinc-700/60 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors">
              <TopicIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {cleanTitle}
            </h3>
          </div>

          {deck.isCustom && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              title="删除此自定义词库"
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          {cleanDesc}
        </p>
      </div>

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
            {deckCards.length} 句短语
          </span>
          {dueCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {dueCount} 待复习
            </span>
          )}
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            onStudy();
          }}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
        >
          <span>复习</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default App;
