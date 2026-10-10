export type LanguageId = 'spanish' | 'english' | 'german' | 'chinese';

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'beginner' | 'intermediate' | 'advanced' | 'fluent';

export interface LanguageOption {
  id: LanguageId;
  name: string;
  nativeName: string;
  flag: string;
  code: string; // Speech synthesis language code (e.g. 'es-ES', 'zh-CN')
  description: string;
}

export interface TopicOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface DifficultyOption {
  id: DifficultyLevel;
  name: string;
  cefr: string;
  badge: string;
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  selectedLanguages: LanguageId[];
  selectedTopics: string[];
  selectedDifficulty: DifficultyLevel;
  languageDifficulties?: Partial<Record<LanguageId, DifficultyLevel>>;
  createdAt: number;
}


export interface Deck {
  id: string;
  profileId: string;
  languageId: LanguageId;
  topicId: string;
  difficulty: DifficultyLevel;
  title: string;
  description: string;
  languageCode: string;
  isCustom?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  profileId: string;
  languageId: LanguageId;
  difficulty: DifficultyLevel;
  front: string; // Target language word / phrase / expression
  back: string; // Translation & meaning
  phonetic?: string; // Pinyin for Chinese, IPA / pronunciation for others
  exampleTarget?: string; // Example sentence in target language
  exampleTranslation?: string; // Example sentence translated
  grammarNotes?: string; // Part of speech, gender article, cultural nuance
  hint?: string;
  isFavorite?: boolean; // User starred favorite for quick review
  box: 1 | 2 | 3 | 4 | 5;
  nextReviewDate: number; // Unix timestamp in ms
  lastReviewedDate?: number;
  totalReviews: number;
  correctCount: number;
  incorrectCount: number;
  createdAt: number;
}

export interface LeitnerBoxSummary {
  box: 1 | 2 | 3 | 4 | 5;
  intervalDays: number;
  label: string;
  cardCount: number;
  dueCount: number;
}

export interface SessionResult {
  cardId: string;
  wasCorrect: boolean;
  oldBox: number;
  newBox: number;
}
