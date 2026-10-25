export type LanguageId = 'english';

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'beginner' | 'intermediate' | 'advanced' | 'fluent';

export interface LanguageOption {
  id: LanguageId;
  name: string;
  nativeName: string;
  flag: string;
  code: string; // Speech synthesis language code (e.g. 'en-US', 'en-GB')
  description: string;
}

export interface TopicOption {
  id: string;
  name: string;
  chineseName: string;
  description: string;
  icon: string;
}

export interface DifficultyOption {
  id: DifficultyLevel;
  name: string;
  cefr: string;
  badge: string;
  chineseTitle: string;
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  selectedTopics: string[];
  selectedDifficulty: DifficultyLevel;
  accent?: 'en-US' | 'en-GB';
  selectedLanguages?: LanguageId[];
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

export type CardType = 'sentence' | 'word' | 'dialogue';

export interface Flashcard {
  id: string;
  deckId: string;
  profileId: string;
  languageId: LanguageId;
  difficulty: DifficultyLevel;
  cardType?: CardType; // 'word' for words/expressions, 'sentence' for full sentences, 'dialogue' for short dialogues
  front: string; // Target English word / phrase / expression
  back: string; // Chinese translation & meaning (中文释义)
  phonetic?: string; // English IPA pronunciation (/aɪ piː eɪ/)
  exampleTarget?: string; // Example sentence in English
  exampleTranslation?: string; // Chinese translation of example sentence
  grammarNotes?: string; // Grammar notes, collocations, Chinglish traps & cultural context
  hint?: string; // Memory clue / mnemonic in Chinese
  isFavorite?: boolean; // Starred favorite for quick review
  box: 1 | 2 | 3 | 4 | 5; // Leitner box (1 to 5)
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
  chineseLabel: string;
  cardCount: number;
  dueCount: number;
}

export interface SessionResult {
  cardId: string;
  wasCorrect: boolean;
  oldBox: number;
  newBox: number;
}
