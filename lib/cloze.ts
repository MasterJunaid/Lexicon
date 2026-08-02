import { splitExample } from './format';
import type { Entry } from './types';

export const BLANK = '______';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SUFFIXES = '(?:s|es|ed|d|ing|ly|ion|ions|al|ity|ies|y)?';

const ARTICLES = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'the', 'a', 'an']);

/**
 * Ordered strategies for finding an inflected form of `word` inside a sentence.
 * Exact-with-suffix first (safe), prefix-stem last (loose, only for irregulars).
 */
function candidatePatterns(word: string): RegExp[] {
  const clean = word
    .replace(/[¿¡?!.]/g, '')
    .replace(/\s*\/\s*/g, ' ')
    .trim();
  const parts = clean.split(/\s+/);
  const patterns: RegExp[] = [];

  if (parts.length > 1) {
    // Headwords are stored with their article ("la cuenta") but sentences use
    // the bare noun as often as not, so the article is optional in the match.
    const leadingArticle = ARTICLES.has(parts[0].toLowerCase());
    const core = leadingArticle ? parts.slice(1) : parts;
    const body = core.map((p) => `${escapeRegex(p)}\\w{0,3}`).join('\\s+(?:\\w+\\s+)?');
    const prefix = leadingArticle ? `(?:${escapeRegex(parts[0])}\\s+)?` : '';
    // Otherwise the whole phrase has to be present. Blanking one word out of
    // "merecer la pena" leaves a question that answers itself.
    patterns.push(new RegExp(`\\b${prefix}${body}\\b`, 'i'));
    return patterns;
  }

  const single = parts[0];
  patterns.push(new RegExp(`\\b${escapeRegex(single)}${SUFFIXES}\\b`, 'i'));

  if (/e$/i.test(single)) {
    const stem = single.slice(0, -1);
    patterns.push(new RegExp(`\\b${escapeRegex(stem)}(?:e|es|ed|ing|ion|ions|or)\\b`, 'i'));
  }
  if (/y$/i.test(single)) {
    const stem = single.slice(0, -1);
    patterns.push(new RegExp(`\\b${escapeRegex(stem)}(?:y|ies|ied|ying)\\b`, 'i'));
  }
  if (single.length >= 6) {
    const stem = single.slice(0, Math.max(4, single.length - 3));
    patterns.push(new RegExp(`\\b${escapeRegex(stem)}\\w{0,5}\\b`, 'i'));
  }
  return patterns;
}

export interface Cloze {
  sentence: string;
  /** The exact surface form that was removed. */
  answer: string;
}

/** Turn an entry into a fill-the-blank sentence, or null if no example fits. */
export function buildCloze(entry: Entry, lang = 'en-US'): Cloze | null {
  if (entry.cloze && entry.cloze.includes('___')) {
    return { sentence: entry.cloze.replace(/_{3,}/g, BLANK), answer: entry.word };
  }
  const patterns = candidatePatterns(entry.word);
  for (const example of entry.examples) {
    const [source] = splitExample(example, lang);
    if (source.length < 24) continue;
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match && match.index !== undefined) {
        // Blank every occurrence and every inflection — a second mention of the
        // word later in the sentence would otherwise hand the answer back.
        const sentence = patterns.reduce(
          (text, p) => text.replace(new RegExp(p.source, 'gi'), BLANK),
          source
        );
        return { sentence, answer: match[0] };
      }
    }
  }
  return null;
}

export function canCloze(entry: Entry, lang = 'en-US'): boolean {
  return buildCloze(entry, lang) !== null;
}
