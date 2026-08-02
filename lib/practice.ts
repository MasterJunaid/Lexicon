import { buildCloze } from './cloze';
import { mulberry32, sample, seededShuffle } from './random';
import type { FeedItem, SrsCard } from './types';

export interface Question {
  key: string;
  entryId: string;
  kicker: string;
  prompt: string;
  /** Rendered in display serif when the prompt is a word rather than prose. */
  promptIsWord: boolean;
  options: string[];
  answer: number;
  lang: string;
  accent: string;
  /** Shown after answering. */
  reveal: string;
}

export interface PairsRound {
  words: { entryId: string; word: string; lang: string }[];
  definitions: { entryId: string; text: string }[];
}

export interface SpellPrompt {
  entryId: string;
  word: string;
  definition: string;
  lang: string;
  accent: string;
}

export function shorten(text: string, max = 96): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(' '), max - 12);
  return `${cut.slice(0, stop).replace(/[,;:—-]$/, '')}…`;
}

/**
 * Words the practice modes should reach for first: things seen, saved, or in
 * the SRS queue, topped up with the rest of the active pool.
 */
export function practicePool(
  items: FeedItem[],
  seen: Record<string, number>,
  saved: string[],
  srs: Record<string, SrsCard>
): FeedItem[] {
  const savedSet = new Set(saved);
  const familiar = items.filter(
    (i) => seen[i.entry.id] || savedSet.has(i.entry.id) || srs[i.entry.id]
  );
  if (familiar.length >= 12) {
    const rest = items.filter((i) => !familiar.includes(i));
    return [...familiar, ...rest];
  }
  return items;
}

function distractors(pool: FeedItem[], target: FeedItem, count: number, rand: () => number) {
  const sameDeck = pool.filter(
    (i) => i.deckId === target.deckId && i.entry.id !== target.entry.id
  );
  const others = pool.filter((i) => i.deckId !== target.deckId);
  const chosen = sample(sameDeck, count, rand);
  if (chosen.length < count) {
    chosen.push(...sample(others, count - chosen.length, rand));
  }
  return chosen;
}

function place<T>(correct: T, wrong: T[], rand: () => number): { options: T[]; answer: number } {
  const options = seededShuffle([correct, ...wrong], Math.floor(rand() * 1e9));
  return { options, answer: options.indexOf(correct) };
}

export function buildDefinitionMatch(
  pool: FeedItem[],
  count: number,
  seed: number
): Question[] {
  const rand = mulberry32(seed);
  const targets = sample(pool, Math.min(count, pool.length), rand);
  const questions: Question[] = [];

  targets.forEach((target, index) => {
    const wrong = distractors(pool, target, 3, rand);
    if (wrong.length < 3) return;
    const wordToDef = index % 2 === 0;

    if (wordToDef) {
      const { options, answer } = place(
        shorten(target.entry.definition, 110),
        wrong.map((w) => shorten(w.entry.definition, 110)),
        rand
      );
      questions.push({
        key: `dm-${target.entry.id}-${index}`,
        entryId: target.entry.id,
        kicker: 'Which definition fits?',
        prompt: target.entry.word,
        promptIsWord: true,
        options,
        answer,
        lang: target.lang,
        accent: target.accent,
        reveal: target.entry.definition,
      });
    } else {
      const { options, answer } = place(
        target.entry.word,
        wrong.map((w) => w.entry.word),
        rand
      );
      questions.push({
        key: `dm-${target.entry.id}-${index}`,
        entryId: target.entry.id,
        kicker: 'Which word means this?',
        prompt: target.entry.definition,
        promptIsWord: false,
        options,
        answer,
        lang: target.lang,
        accent: target.accent,
        reveal: `${target.entry.word} · ${target.entry.pos}`,
      });
    }
  });

  return questions;
}

export function buildFillBlank(pool: FeedItem[], count: number, seed: number): Question[] {
  const rand = mulberry32(seed);
  const usable = pool.filter((i) => buildCloze(i.entry, i.lang) !== null);
  const targets = sample(usable, Math.min(count, usable.length), rand);

  return targets.flatMap((target, index) => {
    const cloze = buildCloze(target.entry, target.lang);
    if (!cloze) return [];
    const wrong = distractors(pool, target, 3, rand);
    if (wrong.length < 3) return [];
    const { options, answer } = place(
      target.entry.word,
      wrong.map((w) => w.entry.word),
      rand
    );
    return [
      {
        key: `fb-${target.entry.id}-${index}`,
        entryId: target.entry.id,
        kicker: 'Fill the blank',
        prompt: cloze.sentence,
        promptIsWord: false,
        options,
        answer,
        lang: target.lang,
        accent: target.accent,
        reveal: `${target.entry.word} — ${target.entry.definition}`,
      },
    ];
  });
}

export function buildPairs(pool: FeedItem[], size: number, seed: number): PairsRound {
  const rand = mulberry32(seed);
  const chosen = sample(pool, Math.min(size, pool.length), rand);
  return {
    words: seededShuffle(
      chosen.map((i) => ({ entryId: i.entry.id, word: i.entry.word, lang: i.lang })),
      Math.floor(rand() * 1e9)
    ),
    definitions: seededShuffle(
      chosen.map((i) => ({ entryId: i.entry.id, text: shorten(i.entry.definition, 82) })),
      Math.floor(rand() * 1e9)
    ),
  };
}

export function buildSpell(pool: FeedItem[], count: number, seed: number): SpellPrompt[] {
  const rand = mulberry32(seed);
  // Multi-word phrases and punctuation make for a miserable typing test.
  const usable = pool.filter((i) => /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]*$/.test(i.entry.word));
  const source = usable.length >= count ? usable : pool;
  return sample(source, Math.min(count, source.length), rand).map((i) => ({
    entryId: i.entry.id,
    word: i.entry.word,
    definition: i.entry.definition,
    lang: i.lang,
    accent: i.accent,
  }));
}

export function normalizeSpelling(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}
