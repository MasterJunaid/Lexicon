export type Tier = 1 | 2 | 3;

export interface Entry {
  id: string;
  word: string;
  pos: string;
  pron: string;
  definition: string;
  examples: string[];
  note: string;
  tier: Tier;
  /** Optional hand-written cloze sentence using ___ for the blank. */
  cloze?: string;
}

export interface Deck {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  lang: string;
  defaultOn: boolean;
  entries: Entry[];
  /** True for the user-authored deck. */
  custom?: boolean;
}

/** An entry paired with the deck it came from. */
export interface FeedItem {
  entry: Entry;
  deckId: string;
  deckName: string;
  accent: string;
  lang: string;
}

export interface MyWord {
  id: string;
  word: string;
  pos: string;
  pron: string;
  definition: string;
  examples: string[];
  note: string;
  tier: Tier;
  createdAt: number;
}

export interface SrsCard {
  /** 0–5. 5 means graduated. */
  box: number;
  /** ISO date (YYYY-MM-DD) the card is next due. */
  due: string;
  reps: number;
  lapses: number;
  addedAt: number;
  lastReviewed?: number;
}

export interface Collection {
  id: string;
  name: string;
  entryIds: string[];
  createdAt: number;
}

export type PracticeMode =
  | 'definition-match'
  | 'fill-blank'
  | 'pairs'
  | 'spell-it'
  | 'speed-round';

export interface DayLog {
  /** Distinct words viewed in the feed / word of the day. */
  words: number;
  /** Practice rounds completed. */
  practice: number;
  /** Review cards answered. */
  reviews: number;
}

export const STATE_VERSION = 1;

export interface LexiconState {
  version: number;
  settings: {
    theme: string;
    decksOn: Record<string, boolean>;
    goalWords: number;
    goalPractice: number;
    speechRate: number;
  };
  saved: string[];
  collections: Collection[];
  myWords: MyWord[];
  srs: Record<string, SrsCard>;
  /** entryId -> last seen timestamp */
  seen: Record<string, number>;
  /** ISO date -> word-of-the-day response */
  wotd: Record<string, 'knew' | 'new'>;
  days: Record<string, DayLog>;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  highScores: Partial<Record<PracticeMode, number>>;
  practiceRuns: number;
  createdAt: number;
}
