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

// --- Sanitize Database: Ensure only English is present & clean titles ---
export async function sanitizeEnglishDatabase(): Promise<void> {
  try {
    const allDecks = await db.decks.toArray();
    const obsoleteDecks = allDecks.filter(d => d.languageId !== 'english');
    if (obsoleteDecks.length > 0) {
      for (const d of obsoleteDecks) {
        await db.cards.where('deckId').equals(d.id).delete();
        await db.decks.delete(d.id);
      }
    }

    const allCards = await db.cards.toArray();
    const obsoleteCards = allCards.filter(c => c.languageId !== 'english');
    if (obsoleteCards.length > 0) {
      for (const c of obsoleteCards) {
        await db.cards.delete(c.id);
      }
    }

    // Clean redundant "英语 (English): " prefix from deck titles
    for (const d of allDecks) {
      if (d.title && /英语\s*\(English\):\s*/i.test(d.title)) {
        d.title = d.title.replace(/^英语\s*\(English\):\s*/i, '').trim();
        await db.decks.put(d);
      }
    }

    // Sanitize profile names with "微联" -> "威廉" and sync all topics
    const allProfiles = await db.profiles.toArray();
    const allTopicIds = LANGUAGE_TOPICS.map(t => t.id);
    for (const p of allProfiles) {
      let changed = false;
      if (p.name && p.name.includes('微联')) {
        p.name = p.name.replace('微联', '威廉');
        changed = true;
      }
      const missingTopics = allTopicIds.filter(tid => !p.selectedTopics?.includes(tid));
      if (missingTopics.length > 0) {
        p.selectedTopics = Array.from(new Set([...(p.selectedTopics || []), ...allTopicIds]));
        changed = true;
      }
      if (changed) {
        await db.profiles.put(p);
      }
      await seedCurriculumForProfile(p.id, p.selectedTopics, p.selectedDifficulty || 'A1');
    }
  } catch (err) {
    console.warn('Database sanitization notice:', err);
  }
}

// --- Profile Helpers ---

export async function getAllProfiles(): Promise<Profile[]> {
  await sanitizeEnglishDatabase();
  return await db.profiles.toArray();
}

export async function createProfile(
  name: string,
  avatar: string,
  _ignoredLanguages: LanguageId[] = ['english'],
  selectedTopics: string[] = LANGUAGE_TOPICS.map(t => t.id),
  difficultyOrMap: DifficultyLevel | Partial<Record<LanguageId, DifficultyLevel>> = 'A1',
  accent: 'en-US' | 'en-GB' = 'en-US'
): Promise<Profile> {
  const primaryDifficulty: DifficultyLevel =
    typeof difficultyOrMap === 'string'
      ? normalizeDifficulty(difficultyOrMap)
      : difficultyOrMap['english']
      ? normalizeDifficulty(difficultyOrMap['english'])
      : 'A1';

  const newProfile: Profile = {
    id: 'prof_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name: name.trim() || '英语学员 (Learner)',
    avatar: avatar || '🌱',
    selectedLanguages: ['english'],
    selectedTopics,
    selectedDifficulty: primaryDifficulty,
    languageDifficulties: { english: primaryDifficulty },
    accent,
    createdAt: Date.now(),
  };

  await db.profiles.add(newProfile);
  await seedCurriculumForProfile(newProfile.id, selectedTopics, primaryDifficulty);
  return newProfile;
}

export async function deleteProfile(profileId: string): Promise<void> {
  await db.transaction('rw', db.profiles, db.decks, db.cards, async () => {
    await db.cards.where('profileId').equals(profileId).delete();
    await db.decks.where('profileId').equals(profileId).delete();
    await db.profiles.delete(profileId);
  });
}

// --- Deck & Curriculum Seeding (English Only) ---

export async function getDecksForProfile(profileId: string): Promise<Deck[]> {
  return await db.decks.where('profileId').equals(profileId).toArray();
}

export async function seedCurriculumForProfile(
  profileId: string,
  topics: string[],
  difficulty: DifficultyLevel
): Promise<void> {
  const existingDecks = await db.decks.where('profileId').equals(profileId).toArray();
  const langDef = SUPPORTED_LANGUAGES[0];
  const langDifficulty = normalizeDifficulty(difficulty);
  const includedLevels = getIncludedLevels(langDifficulty);

  for (const topicId of topics) {
    const topicDef = LANGUAGE_TOPICS.find(t => t.id === topicId);
    if (!topicDef) continue;

    // Check if this deck already exists for this profile and topic
    const existingDeck = existingDecks.find(
      d => d.languageId === 'english' && d.topicId === topicId
    );

    // Match seed cards for English + this topic whose difficulty is in includedLevels
    const matchingSeeds = LANGUAGE_CURRICULUM_SEEDS.filter(
      s => s.topicId === topicId && includedLevels.includes(normalizeDifficulty(s.difficulty))
    );

    const seedsToInsert = matchingSeeds.length > 0
      ? matchingSeeds
      : LANGUAGE_CURRICULUM_SEEDS.filter(s => s.topicId === topicId);

    const diffDef = DIFFICULTY_LEVELS.find(d => d.id === langDifficulty);

    if (existingDeck) {
      if (existingDeck.difficulty !== langDifficulty) {
        existingDeck.difficulty = langDifficulty;
        existingDeck.title = `${topicDef.chineseName} (${topicDef.name})`;
        existingDeck.description = `${topicDef.description} • 难度: ${includedLevels.join(', ')}`;
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
          languageId: 'english',
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

      // Synchronize updated notes, hints, phonetic onto existing cards
      for (const card of currentCards) {
        const seedMatch = LANGUAGE_CURRICULUM_SEEDS.find(
          s => s.front === card.front
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
          if (seedMatch.back && card.back !== seedMatch.back) {
            card.back = seedMatch.back;
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

    const deckId = `deck_english_${topicId}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

    const newDeck: Deck = {
      id: deckId,
      profileId,
      languageId: 'english',
      topicId: topicId,
      difficulty: langDifficulty,
      title: `${topicDef.chineseName} (${topicDef.name})`,
      description: `${topicDef.description} • 难度: ${includedLevels.join(', ')} (${diffDef?.chineseTitle || ''})`,
      languageCode: langDef?.code || 'en-US',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.decks.add(newDeck);

    const now = Date.now();
    const flashcards: Flashcard[] = seedsToInsert.map((s, idx) => ({
      id: `card_${deckId}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      deckId,
      profileId,
      languageId: 'english',
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

export async function createCustomDeck(
  profileId: string,
  title: string,
  description: string,
  difficulty: DifficultyLevel = 'A1'
): Promise<Deck> {
  const deckId = 'deck_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  const newDeck: Deck = {
    id: deckId,
    profileId,
    languageId: 'english',
    topicId: 'custom',
    difficulty,
    title: title.trim(),
    description: description.trim(),
    languageCode: 'en-US',
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
  deckId?: string
): Promise<Flashcard[]> {
  const now = Date.now();
  const allProfileCards = await db.cards.where('profileId').equals(profileId).toArray();

  return allProfileCards.filter(card => {
    const matchesDeck = deckId ? card.deckId === deckId : true;
    const isDue = card.nextReviewDate <= now;
    return matchesDeck && isDue;
  });
}

export async function processCardReview(
  card: Flashcard,
  wasCorrect: boolean
): Promise<{ oldBox: number; newBox: number; nextDate: number }> {
  const now = Date.now();
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
    languageId: 'english',
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

  const labels: Record<1 | 2 | 3 | 4 | 5, { label: string; chineseLabel: string }> = {
    1: { label: 'Box 1: Daily Recall', chineseLabel: '第1盒 · 每日复习' },
    2: { label: 'Box 2: 3-Day Reinforce', chineseLabel: '第2盒 · 3天巩固' },
    3: { label: 'Box 3: Weekly Retention', chineseLabel: '第3盒 · 每周强化' },
    4: { label: 'Box 4: 14-Day Memory', chineseLabel: '第4盒 · 双周稳固' },
    5: { label: 'Box 5: 30-Day Mastered', chineseLabel: '第5盒 · 长期掌握' },
  };

  return boxes.map(box => {
    const boxCards = cards.filter(c => c.box === box);
    const dueCount = boxCards.filter(c => c.nextReviewDate <= now).length;
    return {
      box,
      intervalDays: BOX_INTERVALS_DAYS[box],
      label: labels[box].label,
      chineseLabel: labels[box].chineseLabel,
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
    version: 3,
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
    selectedLanguages: ['english'],
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
        languageId: 'english',
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
          languageId: 'english',
          profileId,
        });
      }
    }
  });

  return importedProfile;
}
