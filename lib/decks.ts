import type { Deck, Entry, FeedItem, MyWord } from './types';

import growthOperator from '@/data/decks/growth-operator.json';
import sharpWriting from '@/data/decks/sharp-writing.json';
import strategyPositioning from '@/data/decks/strategy-positioning.json';
import fintechMarkets from '@/data/decks/fintech-markets.json';
import taste from '@/data/decks/taste.json';
import greGeneral from '@/data/decks/gre-general.json';
import espanolStarter from '@/data/decks/espanol-starter.json';

/**
 * Deck registry. To add a deck: drop a JSON file in data/decks/ following the
 * same shape, import it here, and add it to this array. Nothing else to wire up.
 */
export const DECKS: Deck[] = [
  growthOperator as Deck,
  sharpWriting as Deck,
  strategyPositioning as Deck,
  fintechMarkets as Deck,
  taste as Deck,
  greGeneral as Deck,
  espanolStarter as Deck,
];

export const MY_WORDS_DECK_ID = 'my-words';

export const MY_WORDS_META = {
  id: MY_WORDS_DECK_ID,
  name: 'My Words',
  tagline: 'Yours, free, forever',
  description:
    'Words you add yourself, with your own definition and your own example. Unlimited, exportable, never paywalled.',
  accent: '#B0752B',
  lang: 'en-US',
  defaultOn: true,
  custom: true,
};

export function myWordsDeck(myWords: MyWord[]): Deck {
  return {
    ...MY_WORDS_META,
    entries: myWords
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(
        (w): Entry => ({
          id: w.id,
          word: w.word,
          pos: w.pos,
          pron: w.pron,
          definition: w.definition,
          examples: w.examples.filter(Boolean),
          note: w.note,
          tier: w.tier,
        })
      ),
  };
}

export function allDecks(myWords: MyWord[]): Deck[] {
  return [...DECKS, myWordsDeck(myWords)];
}

export function toFeedItems(deck: Deck): FeedItem[] {
  return deck.entries.map((entry) => ({
    entry,
    deckId: deck.id,
    deckName: deck.name,
    accent: deck.accent,
    lang: deck.lang,
  }));
}

export function activeItems(decks: Deck[], decksOn: Record<string, boolean>): FeedItem[] {
  return decks
    .filter((d) => decksOn[d.id] ?? d.defaultOn)
    .flatMap(toFeedItems);
}

export function itemIndex(decks: Deck[]): Map<string, FeedItem> {
  const map = new Map<string, FeedItem>();
  for (const deck of decks) {
    for (const item of toFeedItems(deck)) map.set(item.entry.id, item);
  }
  return map;
}

export function deckById(decks: Deck[], id: string): Deck | undefined {
  return decks.find((d) => d.id === id);
}
