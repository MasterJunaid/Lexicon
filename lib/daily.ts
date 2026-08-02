import { hashString, mulberry32, seededShuffle } from './random';
import type { FeedItem } from './types';

/** Decks that get first refusal on Word of the Day. */
const PRIORITY_DECKS = ['growth-operator', 'sharp-writing'];
const PRIORITY_SHARE = 0.6;

export function dailySeed(date: string, salt = ''): number {
  return hashString(`${date}::${salt}`);
}

/**
 * Deterministic pick for a given date. Growth Operator and Sharp Writing win
 * the coin flip 60% of the time, provided at least one of them is switched on.
 */
export function wordOfTheDay(items: FeedItem[], date: string): FeedItem | null {
  if (!items.length) return null;
  const rand = mulberry32(dailySeed(date, 'wotd'));
  const priority = items.filter((i) => PRIORITY_DECKS.includes(i.deckId));
  const rest = items.filter((i) => !PRIORITY_DECKS.includes(i.deckId));
  const usePriority = (rand() < PRIORITY_SHARE && priority.length > 0) || rest.length === 0;
  // Drawing the other 40% from the non-priority decks only, so the split holds
  // at 60/40 rather than leaking priority words into both halves.
  const pool = usePriority ? priority : rest;
  const ordered = seededShuffle(pool, dailySeed(date, 'wotd-order'));
  // Walk a deterministic offset so consecutive days rarely repeat a word.
  const offset = Math.floor(rand() * ordered.length);
  return ordered[offset];
}

/**
 * The feed order for a day: one full shuffled pass over every active word,
 * then further re-shuffled passes appended so scrolling never dead-ends.
 */
export function feedOrder(items: FeedItem[], date: string, passes = 4): FeedItem[] {
  if (!items.length) return [];
  const out: FeedItem[] = [];
  for (let pass = 0; pass < passes; pass++) {
    out.push(...seededShuffle(items, dailySeed(date, `feed-${pass}`)));
  }
  return out;
}

/** Weight unseen words to the front of the first pass without breaking determinism. */
export function freshFirst(items: FeedItem[], seen: Record<string, number>): FeedItem[] {
  const unseen = items.filter((i) => !seen[i.entry.id]);
  const rest = items.filter((i) => seen[i.entry.id]);
  return [...unseen, ...rest];
}
