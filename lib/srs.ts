import { addDays, todayISO } from './dates';
import type { SrsCard } from './types';

/** SM-2-lite. Five boxes, fixed intervals, graduation at box 5. */
export const INTERVALS = [1, 3, 7, 14, 30];
export const MAX_REVIEWS_PER_DAY = 15;

export function newCard(now = Date.now()): SrsCard {
  return { box: 0, due: todayISO(), reps: 0, lapses: 0, addedAt: now };
}

export function grade(card: SrsCard, correct: boolean, now = Date.now()): SrsCard {
  const today = todayISO(new Date(now));
  if (correct) {
    // Box n means "n intervals cleared", so box 1 gets INTERVALS[0] (1 day).
    const box = Math.min(card.box + 1, INTERVALS.length + 1);
    const interval = INTERVALS[Math.min(box, INTERVALS.length) - 1];
    return {
      ...card,
      box,
      reps: card.reps + 1,
      due: addDays(today, interval),
      lastReviewed: now,
    };
  }
  return {
    ...card,
    box: 0,
    reps: card.reps + 1,
    lapses: card.lapses + 1,
    due: addDays(today, 1),
    lastReviewed: now,
  };
}

/** Mastered: cleared every interval up to and including the 30-day one. */
export function isGraduated(card: SrsCard): boolean {
  return card.box > INTERVALS.length;
}

export function isDue(card: SrsCard, today = todayISO()): boolean {
  return !isGraduated(card) && card.due <= today;
}

export function dueCardIds(srs: Record<string, SrsCard>, today = todayISO()): string[] {
  return Object.entries(srs)
    .filter(([, card]) => isDue(card, today))
    .sort((a, b) => {
      if (a[1].due !== b[1].due) return a[1].due < b[1].due ? -1 : 1;
      return a[1].box - b[1].box;
    })
    .map(([id]) => id);
}

export function masteredCount(srs: Record<string, SrsCard>): number {
  return Object.values(srs).filter(isGraduated).length;
}
