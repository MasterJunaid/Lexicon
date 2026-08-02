'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { allDecks, itemIndex, MY_WORDS_DECK_ID } from './decks';
import { addDays, todayISO } from './dates';
import { grade, newCard } from './srs';
import { applyTheme } from './themes';
import { defaultState, loadState, parseImport, saveState } from './storage';
import type {
  Collection,
  DayLog,
  Deck,
  FeedItem,
  LexiconState,
  MyWord,
  PracticeMode,
  Tier,
} from './types';

interface StoreValue {
  state: LexiconState;
  ready: boolean;
  today: string;
  decks: Deck[];
  items: FeedItem[];
  byId: Map<string, FeedItem>;
  todayLog: DayLog;
  goalMet: boolean;
  isSaved: (id: string) => boolean;
  toggleSave: (id: string) => void;
  isKnown: (id: string) => boolean;
  toggleKnown: (id: string) => void;
  clearKnown: () => void;
  markSeen: (id: string) => void;
  setTheme: (theme: string) => void;
  toggleDeck: (deckId: string) => void;
  setGoal: (words: number, practice: number) => void;
  setSpeechRate: (rate: number) => void;
  answerWotd: (date: string, entryId: string, response: 'knew' | 'new') => void;
  queueForReview: (id: string) => void;
  gradeCard: (id: string, correct: boolean) => void;
  logPractice: (mode: PracticeMode, score: number) => void;
  addMyWord: (word: Omit<MyWord, 'id' | 'createdAt'>) => string;
  updateMyWord: (id: string, patch: Partial<MyWord>) => void;
  deleteMyWord: (id: string) => void;
  createCollection: (name: string) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  toggleInCollection: (collectionId: string, entryId: string) => void;
  importJSON: (text: string) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const EMPTY_LOG: DayLog = { words: 0, practice: 0, reviews: 0 };

function bumpStreak(state: LexiconState, today: string): Partial<LexiconState> {
  if (state.lastActiveDate === today) return {};
  const streak =
    state.lastActiveDate && addDays(state.lastActiveDate, 1) === today ? state.streak + 1 : 1;
  return {
    streak,
    longestStreak: Math.max(streak, state.longestStreak),
    lastActiveDate: today,
  };
}

function withDay(state: LexiconState, today: string, patch: Partial<DayLog>): LexiconState {
  const existing = state.days[today] ?? EMPTY_LOG;
  return {
    ...state,
    ...bumpStreak(state, today),
    days: {
      ...state.days,
      [today]: {
        words: existing.words + (patch.words ?? 0),
        practice: existing.practice + (patch.practice ?? 0),
        reviews: existing.reviews + (patch.reviews ?? 0),
      },
    },
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LexiconState>(() => defaultState());
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(() => todayISO());
  const loaded = useRef(false);

  useEffect(() => {
    const initial = loadState();
    setState(initial);
    applyTheme(initial.settings.theme);
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveState(state);
  }, [state]);

  useEffect(() => {
    applyTheme(state.settings.theme);
  }, [state.settings.theme]);

  // Roll the date over without a refresh if the app is left open past midnight.
  useEffect(() => {
    const tick = window.setInterval(() => {
      const now = todayISO();
      setToday((prev) => (prev === now ? prev : now));
    }, 60_000);
    const onVisible = () => setToday(todayISO());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const decks = useMemo(() => allDecks(state.myWords), [state.myWords]);
  const byId = useMemo(() => itemIndex(decks), [decks]);
  const items = useMemo(
    () =>
      decks
        .filter((deck) => state.settings.decksOn[deck.id] ?? deck.defaultOn)
        .flatMap((deck) =>
          deck.entries.map((entry) => ({
            entry,
            deckId: deck.id,
            deckName: deck.name,
            accent: deck.accent,
            lang: deck.lang,
          }))
        ),
    [decks, state.settings.decksOn]
  );

  const todayLog = state.days[today] ?? EMPTY_LOG;
  const goalMet =
    todayLog.words >= state.settings.goalWords &&
    todayLog.practice + (todayLog.reviews > 0 ? 1 : 0) >= state.settings.goalPractice;

  const isSaved = useCallback((id: string) => state.saved.includes(id), [state.saved]);

  const toggleSave = useCallback(
    (id: string) => {
      setState((prev) => {
        const saved = prev.saved.includes(id)
          ? prev.saved.filter((s) => s !== id)
          : [id, ...prev.saved];
        const srs = { ...prev.srs };
        if (!prev.saved.includes(id) && !srs[id]) srs[id] = newCard();
        return { ...prev, saved, srs };
      });
    },
    []
  );

  const isKnown = useCallback((id: string) => Boolean(state.known[id]), [state.known]);

  const toggleKnown = useCallback((id: string) => {
    setState((prev) => {
      const known = { ...prev.known };
      const srs = { ...prev.srs };
      if (known[id]) {
        delete known[id];
      } else {
        known[id] = Date.now();
        // A word you already know doesn't belong in the review ladder.
        delete srs[id];
      }
      return { ...prev, known, srs };
    });
  }, []);

  const clearKnown = useCallback(() => {
    setState((prev) => ({ ...prev, known: {} }));
  }, []);

  const markSeen = useCallback(
    (id: string) => {
      setState((prev) => {
        if (prev.seen[id]) return { ...prev, seen: { ...prev.seen, [id]: Date.now() } };
        const next = { ...prev, seen: { ...prev.seen, [id]: Date.now() } };
        return withDay(next, todayISO(), { words: 1 });
      });
    },
    []
  );

  const setTheme = useCallback((theme: string) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, theme } }));
  }, []);

  const toggleDeck = useCallback((deckId: string) => {
    setState((prev) => {
      const current = prev.settings.decksOn[deckId] ?? false;
      const decksOn = { ...prev.settings.decksOn, [deckId]: !current };
      // Never leave the feed with nothing in it.
      const anyOn = Object.entries(decksOn).some(
        ([id, on]) => on && (id !== MY_WORDS_DECK_ID || prev.myWords.length > 0)
      );
      if (!anyOn) return prev;
      return { ...prev, settings: { ...prev.settings, decksOn } };
    });
  }, []);

  const setGoal = useCallback((words: number, practice: number) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, goalWords: words, goalPractice: practice },
    }));
  }, []);

  const setSpeechRate = useCallback((rate: number) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, speechRate: rate } }));
  }, []);

  const answerWotd = useCallback(
    (date: string, entryId: string, response: 'knew' | 'new') => {
      setState((prev) => {
        const srs = { ...prev.srs };
        if (response === 'new') {
          srs[entryId] = srs[entryId] ?? newCard();
        } else if (srs[entryId]) {
          srs[entryId] = grade(srs[entryId], true);
        }
        const next = {
          ...prev,
          srs,
          wotd: { ...prev.wotd, [date]: response },
          seen: { ...prev.seen, [entryId]: Date.now() },
        };
        return withDay(next, todayISO(), { words: prev.seen[entryId] ? 0 : 1 });
      });
    },
    []
  );

  const queueForReview = useCallback((id: string) => {
    setState((prev) =>
      prev.srs[id] ? prev : { ...prev, srs: { ...prev.srs, [id]: newCard() } }
    );
  }, []);

  const gradeCard = useCallback((id: string, correct: boolean) => {
    setState((prev) => {
      const card = prev.srs[id] ?? newCard();
      const next = { ...prev, srs: { ...prev.srs, [id]: grade(card, correct) } };
      return withDay(next, todayISO(), { reviews: 1 });
    });
  }, []);

  const logPractice = useCallback((mode: PracticeMode, score: number) => {
    setState((prev) => {
      const best = prev.highScores[mode] ?? 0;
      const next: LexiconState = {
        ...prev,
        practiceRuns: prev.practiceRuns + 1,
        highScores: { ...prev.highScores, [mode]: Math.max(best, score) },
      };
      return withDay(next, todayISO(), { practice: 1 });
    });
  }, []);

  const addMyWord = useCallback((word: Omit<MyWord, 'id' | 'createdAt'>) => {
    const id = `mw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setState((prev) => ({
      ...prev,
      myWords: [{ ...word, id, createdAt: Date.now() }, ...prev.myWords],
      settings: {
        ...prev.settings,
        decksOn: { ...prev.settings.decksOn, [MY_WORDS_DECK_ID]: true },
      },
    }));
    return id;
  }, []);

  const updateMyWord = useCallback((id: string, patch: Partial<MyWord>) => {
    setState((prev) => ({
      ...prev,
      myWords: prev.myWords.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  }, []);

  const deleteMyWord = useCallback((id: string) => {
    setState((prev) => {
      const srs = { ...prev.srs };
      delete srs[id];
      const seen = { ...prev.seen };
      delete seen[id];
      return {
        ...prev,
        myWords: prev.myWords.filter((w) => w.id !== id),
        saved: prev.saved.filter((s) => s !== id),
        collections: prev.collections.map((c) => ({
          ...c,
          entryIds: c.entryIds.filter((e) => e !== id),
        })),
        srs,
        seen,
      };
    });
  }, []);

  const createCollection = useCallback((name: string) => {
    const id = `col-${Date.now().toString(36)}`;
    const collection: Collection = { id, name, entryIds: [], createdAt: Date.now() };
    setState((prev) => ({ ...prev, collections: [...prev.collections, collection] }));
    return id;
  }, []);

  const renameCollection = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.filter((c) => c.id !== id),
    }));
  }, []);

  const toggleInCollection = useCallback((collectionId: string, entryId: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              entryIds: c.entryIds.includes(entryId)
                ? c.entryIds.filter((e) => e !== entryId)
                : [...c.entryIds, entryId],
            }
          : c
      ),
    }));
  }, []);

  const importJSON = useCallback((text: string) => {
    const next = parseImport(text);
    setState(next);
    applyTheme(next.settings.theme);
  }, []);

  const resetAll = useCallback(() => {
    const fresh = defaultState();
    setState(fresh);
    applyTheme(fresh.settings.theme);
  }, []);

  const value: StoreValue = {
    state,
    ready,
    today,
    decks,
    items,
    byId,
    todayLog,
    goalMet,
    isSaved,
    toggleSave,
    isKnown,
    toggleKnown,
    clearKnown,
    markSeen,
    setTheme,
    toggleDeck,
    setGoal,
    setSpeechRate,
    answerWotd,
    queueForReview,
    gradeCard,
    logPractice,
    addMyWord,
    updateMyWord,
    deleteMyWord,
    createCollection,
    renameCollection,
    deleteCollection,
    toggleInCollection,
    importJSON,
    resetAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/**
 * Active words minus the ones marked known. The known list is snapshotted once
 * per mount: tapping "I know this" must not reorder the feed under your thumb,
 * so the word stays on screen (undoable) and is gone on the next visit.
 */
export function useLearnableItems(): FeedItem[] {
  const { items, state, ready } = useStore();
  const [snapshot, setSnapshot] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (ready && snapshot === null) setSnapshot(state.known);
  }, [ready, snapshot, state.known]);

  // Deliberately not keyed on state.known: a later change must not produce a
  // new array, or every list built from this would reshuffle mid-session.
  return useMemo(() => {
    const known = snapshot ?? {};
    return items.filter((item) => !known[item.entry.id]);
  }, [items, snapshot]);
}

export type { Tier };
