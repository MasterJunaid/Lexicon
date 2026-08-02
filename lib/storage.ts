import { DECKS, MY_WORDS_DECK_ID } from './decks';
import { STATE_VERSION, type LexiconState } from './types';
import { DEFAULT_THEME } from './themes';

export const STORAGE_KEY = 'lexicon.state.v1';

export function defaultState(now = Date.now()): LexiconState {
  const decksOn: Record<string, boolean> = {};
  for (const deck of DECKS) decksOn[deck.id] = deck.defaultOn;
  decksOn[MY_WORDS_DECK_ID] = true;
  return {
    version: STATE_VERSION,
    settings: {
      theme: DEFAULT_THEME,
      decksOn,
      goalWords: 3,
      goalPractice: 1,
      speechRate: 0.92,
    },
    saved: [],
    collections: [],
    myWords: [],
    srs: {},
    seen: {},
    known: {},
    wotd: {},
    days: {},
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    highScores: {},
    practiceRuns: 0,
    createdAt: now,
  };
}

/** Merge a loaded blob over defaults so new fields never crash an old save. */
export function hydrate(raw: unknown): LexiconState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const input = raw as Partial<LexiconState>;
  const migrated = migrate(input);
  return {
    ...base,
    ...migrated,
    version: STATE_VERSION,
    settings: {
      ...base.settings,
      ...(migrated.settings ?? {}),
      // Decks added after this save was written keep their own defaultOn.
      decksOn: { ...base.settings.decksOn, ...(migrated.settings?.decksOn ?? {}) },
    },
    saved: migrated.saved ?? base.saved,
    collections: migrated.collections ?? base.collections,
    myWords: migrated.myWords ?? base.myWords,
    srs: migrated.srs ?? base.srs,
    seen: migrated.seen ?? base.seen,
    known: migrated.known ?? base.known,
    wotd: migrated.wotd ?? base.wotd,
    days: migrated.days ?? base.days,
    highScores: migrated.highScores ?? base.highScores,
  };
}

/**
 * Schema migrations. Each case upgrades one version to the next and falls
 * through, so a v1 save loaded by a v3 build walks the whole chain.
 */
function migrate(input: Partial<LexiconState>): Partial<LexiconState> {
  const version = input.version ?? STATE_VERSION;
  if (version > STATE_VERSION) {
    // A newer build wrote this. Keep what we understand rather than wiping it.
    return input;
  }
  let state = input;
  if (version < 2) {
    // v2 added the "I know this" list.
    state = { ...state, known: state.known ?? {}, version: 2 };
  }
  return state;
}

export function loadState(): LexiconState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return hydrate(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state: LexiconState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private-mode failure: the session still works, it just won't persist.
  }
}

export function exportState(state: LexiconState): string {
  return JSON.stringify(
    { app: 'lexicon', exportedAt: new Date().toISOString(), state },
    null,
    2
  );
}

export function parseImport(text: string): LexiconState {
  const parsed = JSON.parse(text);
  const candidate = parsed && parsed.state ? parsed.state : parsed;
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('That file does not look like a Lexicon export.');
  }
  return hydrate(candidate);
}
