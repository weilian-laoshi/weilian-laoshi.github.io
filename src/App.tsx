import React, { useState, useEffect, useCallback } from 'react';
import type { Profile, Deck, Flashcard, LeitnerBoxSummary, LanguageId, DifficultyLevel } from './types';
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
  db,
} from './db/database';
import { SUPPORTED_LANGUAGES, DIFFICULTY_LEVELS, normalizeDifficulty } from './data/languages';
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
} from 'lucide-react';

export function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<LanguageId | 'all'>('all');
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
  const [customLangId, setCustomLangId] = useState<LanguageId>('english');
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

  // Load or Initialize Profile
  const loadInitialData = useCallback(async () => {
    let allProf = await getAllProfiles();
    if (allProf.length === 0) {
      // First time onboarding: seed default profile for Chinese speakers learning English
      const initial = await createProfile(
        '威廉学员',
        '🌱',
        ['english'],
        ['daily-travel', 'manners-etiquette', 'business-work', 'idioms-expressions', 'culture-history', 'science-nature'],
        'A1'
      );
      allProf = [initial];
    }

    setProfiles(allProf);
    const current = allProf[0];
    if (current) {
      await seedCurriculumForProfile(
        current.id,
        current.selectedLanguages && current.selectedLanguages.length > 0 ? current.selectedLanguages : ['english'],
        current.selectedTopics && current.selectedTopics.length > 0 ? current.selectedTopics : ['daily-travel', 'manners-etiquette', 'business-work', 'idioms-expressions'],
        current.languageDifficulties || current.selectedDifficulty || 'A1'
      );
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

    // Apply language filter to cards when viewing all decks
    if (!selectedDeckId && selectedLanguageFilter !== 'all') {
      activeCards = activeCards.filter(c => c.languageId === selectedLanguageFilter);
    }

    setCards(activeCards);
    setBoxSummaries(computeBoxSummaries(activeCards));
  }, [activeProfile, selectedDeckId, selectedLanguageFilter]);

  useEffect(() => {
    refreshProfileData();
  }, [refreshProfileData]);

  const handleSelectDeck = (deckId: string | null) => {
    setSelectedDeckId(deckId);
    setActiveBoxFilter(null);
    setIsFavoritesPage(false);
  };

  // Return to the main page (reset deck selection, study mode, filters, and modals)
  const handleGoHome = () => {
    setIsStudyMode(false);
    setIsFavoritesPage(false);
    setSelectedDeckId(null);
    setSelectedLanguageFilter('all');
    setActiveBoxFilter(null);
    setIsProfileModalOpen(false);
    setIsCurriculumModalOpen(false);
    setIsCustomDeckModalOpen(false);
  };

  // Start Study Session (Enforce 10 sentences per session)
  const handleStartStudy = async (deckId?: string) => {
    if (!activeProfile) return;

    const SESSION_SIZE = 10;
    const langFilter = selectedLanguageFilter !== 'all' ? selectedLanguageFilter : undefined;
    const dueCards = await getDueCards(
      activeProfile.id,
      deckId || selectedDeckId || undefined,
      !deckId && !selectedDeckId ? langFilter : undefined
    );

    let queue: Flashcard[] = [];
    if (dueCards.length > 0) {
      queue = dueCards.slice(0, SESSION_SIZE);
    } else {
      // If no cards are due today, allow practice of cards in current scope
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
      alert('No favorite sentences yet! Click the star icon (★) on any card during study or in the deck manager to mark it as a favorite.');
      return;
    }

    // Queue favorite cards (up to SESSION_SIZE)
    setStudyQueue(favoriteCards.slice(0, SESSION_SIZE));
    setIsStudyMode(true);
  };

  // Save Curriculum (Languages + Topics + Difficulty)
  const handleSaveCurriculum = async (
    languages: LanguageId[],
    topics: string[],
    difficulties: Partial<Record<LanguageId, DifficultyLevel>>
  ) => {
    if (!activeProfile) return;

    await seedCurriculumForProfile(activeProfile.id, languages, topics, difficulties);

    const mergedDifficulties = {
      ...(activeProfile.languageDifficulties || {}),
      ...difficulties,
    };
    const primaryDifficulty = (languages.length > 0 && difficulties[languages[0]])
      ? normalizeDifficulty(difficulties[languages[0]]!)
      : normalizeDifficulty(activeProfile.selectedDifficulty || 'A1');

    activeProfile.selectedLanguages = languages;
    activeProfile.selectedTopics = topics;
    activeProfile.languageDifficulties = mergedDifficulties;
    activeProfile.selectedDifficulty = primaryDifficulty;

    await db.profiles.put(activeProfile);
    setActiveProfile({ ...activeProfile });

    await refreshProfileData();
  };

  // Create Custom Deck
  const handleCreateCustomDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !customTitle.trim()) return;

    const newDeck = await createCustomDeck(
      activeProfile.id,
      customLangId,
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
    if (confirm('Delete this entire language deck and all its flashcards?')) {
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
        Loading language learning system...
      </div>
    );
  }

  const selectedDeck = decks.find(d => d.id === selectedDeckId);
  const displayedDecks = selectedLanguageFilter === 'all'
    ? decks
    : decks.filter(d => d.languageId === selectedLanguageFilter);

  const totalDueCards = cards.filter(c => c.nextReviewDate <= Date.now()).length;
  // Compute total favorites from all cards across the profile so the count in visualizer is always global
  const totalFavoriteCards = allCards.filter(c => c.isFavorite).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
      <Navbar
        activeProfile={activeProfile}
        decks={decks}
        selectedLanguageFilter={selectedLanguageFilter}
        onSelectLanguageFilter={setSelectedLanguageFilter}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenCurriculumModal={() => setIsCurriculumModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        totalDueToday={totalDueCards}
        onGoHome={handleGoHome}
        isStudyMode={isStudyMode}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {isStudyMode ? (
          <StudySession
            deck={selectedDeck}
            cards={studyQueue}
            onToggleFavorite={async (cardId) => {
              const res = await toggleCardFavorite(cardId);
              // Update in-place in studyQueue so active session immediately keeps correct favorite state
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
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer"
                  >
                    <span>&larr; View All Language Decks</span>
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
                        Language Decks
                      </h2>
                      {selectedLanguageFilter !== 'all' ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">
                          {activeProfile.languageDifficulties?.[selectedLanguageFilter] || activeProfile.selectedDifficulty || 'Beginner'} Tier
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {Array.from(new Set(activeProfile.selectedLanguages.map(l => activeProfile.languageDifficulties?.[l] || activeProfile.selectedDifficulty || 'beginner'))).length === 1
                            ? `${activeProfile.languageDifficulties?.[activeProfile.selectedLanguages[0]] || activeProfile.selectedDifficulty || 'Beginner'} Tier`
                            : 'Multi-Level Tiers'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Review phrases on schedule to cement native fluency and intuitive recall.
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    {cards.length > 0 && (
                      <button
                        onClick={() => handleStartStudy()}
                        className="w-full sm:w-auto order-first sm:order-last px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Study ({totalDueCards} Due)</span>
                      </button>
                    )}

                    {totalFavoriteCards > 0 && (
                      <button
                        onClick={() => handleStudyFavorites()}
                        className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-amber-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Review all starred favorite sentences"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                        <span>Favorites ({totalFavoriteCards})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsCurriculumModalOpen(true)}
                      className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Curriculum</span>
                    </button>

                    <button
                      onClick={() => setIsCustomDeckModalOpen(true)}
                      className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Custom Deck</span>
                    </button>
                  </div>
                </div>

                {/* Deck Cards Grid */}
                {displayedDecks.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      No decks match the current filter
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
                      Configure your languages and subjects to seed decks, or clear the language filter.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedLanguageFilter('all');
                        setIsCurriculumModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 cursor-pointer shadow-xs"
                    >
                      Open Curriculum Builder
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedDecks.map(deck => {
                      const langDef = SUPPORTED_LANGUAGES.find(l => l.id === deck.languageId);

                      return (
                        <LanguageDeckCard
                          key={deck.id}
                          deck={deck}
                          flag={langDef?.flag || '🌐'}
                          onOpen={() => handleSelectDeck(deck.id)}
                          onStudy={() => handleStartStudy(deck.id)}
                          onDelete={() => handleDeleteDeck(deck.id)}
                        />
                      );
                    })}
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
        initialLanguages={activeProfile.selectedLanguages || ['spanish']}
        initialTopics={activeProfile.selectedTopics || ['daily-travel']}
        initialDifficulty={activeProfile.selectedDifficulty || 'beginner'}
        initialLanguageDifficulties={activeProfile.languageDifficulties || {}}
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
              Create Custom Language Deck
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Add your own specialized vocabulary deck with Leitner repetition.
            </p>

            <form onSubmit={handleCreateCustomDeck} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Language
                  </label>
                  <select
                    value={customLangId}
                    onChange={e => setCustomLangId(e.target.value as LanguageId)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                  >
                    {SUPPORTED_LANGUAGES.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={customDifficulty}
                    onChange={e => setCustomDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                  >
                    {DIFFICULTY_LEVELS.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.cefr})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Deck Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spanish Subjunctive Triggers"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Brief note or grammatical focus"
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCustomDeckModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Create Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual Language Deck card
function LanguageDeckCard({
  deck,
  flag,
  onOpen,
  onStudy,
  onDelete,
}: {
  deck: Deck;
  flag: string;
  onOpen: () => void;
  onStudy: () => void;
  onDelete: () => void;
}) {
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    getCardsForDeck(deck.id).then(setDeckCards);
  }, [deck.id]);

  const dueCount = deckCards.filter(c => c.nextReviewDate <= Date.now()).length;

  return (
    <div
      onClick={onOpen}
      className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between cursor-pointer group shadow-2xs hover:shadow-xs active:scale-[0.99] relative"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">{flag}</span>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {deck.title}
            </h3>
          </div>

          {deck.isCustom && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete deck"
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          {deck.description}
        </p>
      </div>

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
            {deckCards.length} phrases
          </span>
          {dueCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {dueCount} due
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
          <span>Study</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default App;
