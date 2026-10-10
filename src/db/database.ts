import Dexie, { type Table } from 'dexie';
import type {
  Profile,
  Deck,
  Flashcard,
  LeitnerBoxSummary,
  LanguageId,
  DifficultyLevel,
} from '../types';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_TOPICS,
  DIFFICULTY_LEVELS,
  LANGUAGE_CURRICULUM_SEEDS,
  normalizeDifficulty,
  getIncludedLevels,
} from '../data/languages';

export const BOX_INTERVALS_DAYS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
} as const;

export class LeitnerDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  decks!: Table<Deck, string>;
  cards!: Table<Flashcard, string>;

  constructor() {
    super('WeilianLaoshiEnglishDB');
    this.version(1).stores({
      profiles: 'id, name, createdAt',
      decks: 'id, profileId, languageId, topicId, difficulty, createdAt',
      cards: 'id, deckId, profileId, languageId, difficulty, box, nextReviewDate, lastReviewedDate, isFavorite',
    });
  }
}

export const db = new LeitnerDatabase();

// --- Profile Helpers ---

export async function getAllProfiles(): Promise<Profile[]> {
  return await db.profiles.toArray();
}

export async function createProfile(
  name: string,
  avatar: string,
  selectedLanguages: LanguageId[],
  selectedTopics: string[],
  difficultyOrMap: DifficultyLevel | Partial<Record<LanguageId, DifficultyLevel>> = 'beginner'
): Promise<Profile> {
  const languageDifficulties: Partial<Record<LanguageId, DifficultyLevel>> =
    typeof difficultyOrMap === 'object'
      ? { ...difficultyOrMap }
      : selectedLanguages.reduce((acc, l) => ({ ...acc, [l]: difficultyOrMap }), {});

  const primaryDifficulty: DifficultyLevel =
    typeof difficultyOrMap === 'string'
      ? difficultyOrMap
      : selectedLanguages.length > 0 && difficultyOrMap[selectedLanguages[0]]
      ? difficultyOrMap[selectedLanguages[0]]!
      : 'beginner';

  const newProfile: Profile = {
    id: 'prof_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name: name.trim() || '英语学习者 (Learner)',
    avatar: avatar || '🌱',
    selectedLanguages,
    selectedTopics,
    selectedDifficulty: primaryDifficulty,
    languageDifficulties,
    createdAt: Date.now(),
  };

  await db.profiles.add(newProfile);
  await seedCurriculumForProfile(newProfile.id, selectedLanguages, selectedTopics, languageDifficulties);
  return newProfile;
}

export async function deleteProfile(profileId: string): Promise<void> {
  await db.transaction('rw', db.profiles, db.decks, db.cards, async () => {
    await db.cards.where('profileId').equals(profileId).delete();
    await db.decks.where('profileId').equals(profileId).delete();
    await db.profiles.delete(profileId);
  });
}

// --- Deck & Curriculum Seeding ---

export async function getDecksForProfile(profileId: string): Promise<Deck[]> {
  return await db.decks.where('profileId').equals(profileId).toArray();
}

export async function seedCurriculumForProfile(
  profileId: string,
  languages: LanguageId[],
  topics: string[],
  difficultyOrMap: DifficultyLevel | Partial<Record<LanguageId, DifficultyLevel>>
): Promise<void> {
  const existingDecks = await db.decks.where('profileId').equals(profileId).toArray();

  for (const langId of languages) {
    const langDef = SUPPORTED_LANGUAGES.find(l => l.id === langId);
    if (!langDef) continue;

    const rawDiff: DifficultyLevel =
      typeof difficultyOrMap === 'object' && difficultyOrMap[langId]
        ? difficultyOrMap[langId]!
        : typeof difficultyOrMap === 'string'
        ? difficultyOrMap
        : 'A1';
    const langDifficulty: DifficultyLevel = normalizeDifficulty(rawDiff);
    const includedLevels = getIncludedLevels(langDifficulty);

    for (const topicId of topics) {
      const topicDef = LANGUAGE_TOPICS.find(t => t.id === topicId);
      if (!topicDef) continue;

      // Check if this deck already exists for this profile and topic
      const existingDeck = existingDecks.find(
        d => d.languageId === langId && d.topicId === topicId
      );

      // Match seed cards for this language + topic whose difficulty is in includedLevels
      // ("as the user selects a level, the lower level ones are also selected")
      const matchingSeeds = LANGUAGE_CURRICULUM_SEEDS.filter(
        s => s.languageId === langId && s.topicId === topicId && includedLevels.includes(normalizeDifficulty(s.difficulty))
      );

      const seedsToInsert = matchingSeeds.length > 0
        ? matchingSeeds
        : LANGUAGE_CURRICULUM_SEEDS.filter(
            s => s.languageId === langId && s.topicId === topicId && includedLevels.includes(normalizeDifficulty(s.difficulty))
          );

      if (existingDeck) {
        if (existingDeck.difficulty !== langDifficulty) {
          existingDeck.difficulty = langDifficulty;
          await db.decks.put(existingDeck);
        }

        // Synchronize missing seeds into existing deck
        const currentCards = await db.cards.where('deckId').equals(existingDeck.id).toArray();
        const existingFronts = new Set(currentCards.map(c => c.front));
        const missingSeeds = seedsToInsert.filter(s => !existingFronts.has(s.front));

        if (missingSeeds.length > 0) {
          const now = Date.now();
          const newCards: Flashcard[] = missingSeeds.map((s, idx) => ({
            id: `card_${existingDeck.id}_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            deckId: existingDeck.id,
            profileId,
            languageId: s.languageId,
            difficulty: normalizeDifficulty(s.difficulty),
            front: s.front,
            back: s.back,
            phonetic: s.phonetic,
            exampleTarget: s.exampleTarget,
            exampleTranslation: s.exampleTranslation,
            grammarNotes: s.grammarNotes,
            hint: s.hint,
            box: 1,
            nextReviewDate: now,
            totalReviews: 0,
            correctCount: 0,
            incorrectCount: 0,
            createdAt: now,
          }));
          await db.cards.bulkAdd(newCards);
        }

        // Synchronize enriched grammar notes, hints, and explanations onto existing cards
        for (const card of currentCards) {
          const seedMatch = LANGUAGE_CURRICULUM_SEEDS.find(
            s => s.front === card.front && s.languageId === card.languageId
          );
          if (seedMatch) {
            let changed = false;
            if (seedMatch.grammarNotes && card.grammarNotes !== seedMatch.grammarNotes) {
              card.grammarNotes = seedMatch.grammarNotes;
              changed = true;
            }
            if (seedMatch.hint && card.hint !== seedMatch.hint) {
              card.hint = seedMatch.hint;
              changed = true;
            }
            if (seedMatch.phonetic && card.phonetic !== seedMatch.phonetic) {
              card.phonetic = seedMatch.phonetic;
              changed = true;
            }
            if (normalizeDifficulty(card.difficulty) !== normalizeDifficulty(seedMatch.difficulty)) {
              card.difficulty = normalizeDifficulty(seedMatch.difficulty);
              changed = true;
            }
            if (changed) {
              await db.cards.put(card);
            }
          }
        }
        continue;
      }

      const diffDef = DIFFICULTY_LEVELS.find(d => d.id === langDifficulty);
      const deckId = `deck_${langId}_${topicId}_${langDifficulty}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

      const newDeck: Deck = {
        id: deckId,
        profileId,
        languageId: langId,
        topicId: topicId,
        difficulty: langDifficulty,
        title: `${langDef.name}: ${topicDef.name}`,
        description: `${topicDef.description} • Levels: ${includedLevels.join(', ')} (${diffDef?.cefr || ''})`,
        languageCode: langDef.code,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.decks.add(newDeck);

      const now = Date.now();
      const flashcards: Flashcard[] = seedsToInsert.map((s, idx) => ({
        id: `card_${deckId}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        deckId,
        profileId,
        languageId: s.languageId,
        difficulty: normalizeDifficulty(s.difficulty),
        front: s.front,
        back: s.back,
        phonetic: s.phonetic,
        exampleTarget: s.exampleTarget,
        exampleTranslation: s.exampleTranslation,
        grammarNotes: s.grammarNotes,
        hint: s.hint,
        box: 1,
        nextReviewDate: now,
        totalReviews: 0,
        correctCount: 0,
        incorrectCount: 0,
        createdAt: now,
      }));

      if (flashcards.length > 0) {
        await db.cards.bulkAdd(flashcards);
      }
    }
  }
}

export async function createCustomDeck(
  profileId: string,
  languageId: LanguageId,
  title: string,
  description: string,
  difficulty: DifficultyLevel = 'beginner'
): Promise<Deck> {
  const langDef = SUPPORTED_LANGUAGES.find(l => l.id === languageId);
  const deckId = 'deck_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  const newDeck: Deck = {
    id: deckId,
    profileId,
    languageId,
    topicId: 'custom',
    difficulty,
    title: title.trim(),
    description: description.trim(),
    languageCode: langDef?.code || 'en-US',
    isCustom: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.decks.add(newDeck);
  return newDeck;
}

export async function deleteDeck(deckId: string): Promise<void> {
  await db.transaction('rw', db.decks, db.cards, async () => {
    await db.cards.where('deckId').equals(deckId).delete();
    await db.decks.delete(deckId);
  });
}

// --- Flashcard Operations & Leitner System ---

export async function getCardsForDeck(deckId: string): Promise<Flashcard[]> {
  return await db.cards.where('deckId').equals(deckId).toArray();
}

export async function getAllCardsForProfile(profileId: string): Promise<Flashcard[]> {
  return await db.cards.where('profileId').equals(profileId).toArray();
}

export async function getDueCards(
  profileId: string,
  deckId?: string,
  languageId?: LanguageId
): Promise<Flashcard[]> {
  const now = Date.now();
  const allProfileCards = await db.cards.where('profileId').equals(profileId).toArray();

  return allProfileCards.filter(card => {
    const matchesDeck = deckId ? card.deckId === deckId : true;
    const matchesLang = languageId ? card.languageId === languageId : true;
    const isDue = card.nextReviewDate <= now;
    return matchesDeck && matchesLang && isDue;
  });
}

export async function processCardReview(
  card: Flashcard,
  wasCorrect: boolean
): Promise<{ oldBox: number; newBox: number; nextDate: number }> {
  const now = Date.now();
  // Fetch fresh card record to ensure dynamic flags (like isFavorite) are never overwritten by stale session objects
  const freshCard = (await db.cards.get(card.id)) || card;
  const oldBox = freshCard.box;
  let newBox: 1 | 2 | 3 | 4 | 5 = 1;

  if (wasCorrect) {
    newBox = Math.min(5, oldBox + 1) as 1 | 2 | 3 | 4 | 5;
  } else {
    // Leitner system drops to Box 1 for memory reinforcement
    newBox = 1;
  }

  const intervalDays = BOX_INTERVALS_DAYS[newBox];
  const nextDate = now + intervalDays * 24 * 60 * 60 * 1000;

  const updated: Flashcard = {
    ...freshCard,
    box: newBox,
    nextReviewDate: nextDate,
    lastReviewedDate: now,
    totalReviews: freshCard.totalReviews + 1,
    correctCount: freshCard.correctCount + (wasCorrect ? 1 : 0),
    incorrectCount: freshCard.incorrectCount + (wasCorrect ? 0 : 1),
  };

  await db.cards.put(updated);

  return { oldBox, newBox, nextDate };
}

export async function addCard(
  deckId: string,
  profileId: string,
  languageId: LanguageId,
  difficulty: DifficultyLevel,
  front: string,
  back: string,
  phonetic?: string,
  exampleTarget?: string,
  exampleTranslation?: string,
  grammarNotes?: string,
  hint?: string
): Promise<Flashcard> {
  const newCard: Flashcard = {
    id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    deckId,
    profileId,
    languageId,
    difficulty,
    front: front.trim(),
    back: back.trim(),
    phonetic: phonetic?.trim() || undefined,
    exampleTarget: exampleTarget?.trim() || undefined,
    exampleTranslation: exampleTranslation?.trim() || undefined,
    grammarNotes: grammarNotes?.trim() || undefined,
    hint: hint?.trim() || undefined,
    box: 1,
    nextReviewDate: Date.now(),
    totalReviews: 0,
    correctCount: 0,
    incorrectCount: 0,
    createdAt: Date.now(),
  };

  await db.cards.add(newCard);
  return newCard;
}

export async function updateCard(card: Flashcard): Promise<void> {
  await db.cards.put(card);
}

export async function toggleCardFavorite(cardId: string): Promise<boolean> {
  const card = await db.cards.get(cardId);
  if (!card) return false;
  const newFav = !card.isFavorite;
  card.isFavorite = newFav;
  await db.cards.put(card);
  return newFav;
}

export async function deleteCard(cardId: string): Promise<void> {
  await db.cards.delete(cardId);
}

export async function resetCardProgress(cardId: string): Promise<void> {
  const card = await db.cards.get(cardId);
  if (card) {
    card.box = 1;
    card.nextReviewDate = Date.now();
    card.totalReviews = 0;
    card.correctCount = 0;
    card.incorrectCount = 0;
    await db.cards.put(card);
  }
}

// --- Leitner Box Summary Statistics ---

export function computeBoxSummaries(cards: Flashcard[]): LeitnerBoxSummary[] {
  const now = Date.now();
  const boxes: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

  const labels: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: 'Box 1: Daily Recall',
    2: 'Box 2: 3-Day Reinforce',
    3: 'Box 3: Weekly Retention',
    4: 'Box 4: 14-Day Memory',
    5: 'Box 5: 30-Day Mastered',
  };

  return boxes.map(box => {
    const boxCards = cards.filter(c => c.box === box);
    const dueCount = boxCards.filter(c => c.nextReviewDate <= now).length;
    return {
      box,
      intervalDays: BOX_INTERVALS_DAYS[box],
      label: labels[box],
      cardCount: boxCards.length,
      dueCount,
    };
  });
}

// --- Data Portability: Export / Import ---

export interface BackupData {
  version: number;
  exportedAt: number;
  profile: Profile;
  decks: Deck[];
  cards: Flashcard[];
}

export async function exportProfileBackup(profileId: string): Promise<BackupData | null> {
  const profile = await db.profiles.get(profileId);
  if (!profile) return null;

  const decks = await db.decks.where('profileId').equals(profileId).toArray();
  const cards = await db.cards.where('profileId').equals(profileId).toArray();

  return {
    version: 2,
    exportedAt: Date.now(),
    profile,
    decks,
    cards,
  };
}

export async function importProfileBackup(backup: BackupData): Promise<Profile> {
  const profileId = 'prof_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const importedProfile: Profile = {
    ...backup.profile,
    id: profileId,
    name: backup.profile.name + ' (Imported)',
    createdAt: Date.now(),
  };

  await db.transaction('rw', db.profiles, db.decks, db.cards, async () => {
    await db.profiles.add(importedProfile);

    const oldToNewDeckMap = new Map<string, string>();

    for (const d of backup.decks) {
      const newDeckId = 'deck_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      oldToNewDeckMap.set(d.id, newDeckId);
      await db.decks.add({
        ...d,
        id: newDeckId,
        profileId,
      });
    }

    for (const c of backup.cards) {
      const newDeckId = oldToNewDeckMap.get(c.deckId);
      if (newDeckId) {
        await db.cards.add({
          ...c,
          id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          deckId: newDeckId,
          profileId,
        });
      }
    }
  });

  return importedProfile;
}
