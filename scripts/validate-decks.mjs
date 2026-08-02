/**
 * Content lint for the deck JSONs. Catches the things that quietly degrade the
 * app: missing fields, duplicate ids, thin examples, and entries that can't
 * produce a fill-the-blank question.
 *
 *   npm run check:decks
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DECK_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'decks');
const REQUIRED_ENTRY_FIELDS = ['id', 'word', 'pos', 'pron', 'definition', 'examples', 'note', 'tier'];

let errors = 0;
let warnings = 0;

const fail = (message) => {
  errors++;
  console.error(`  ✗ ${message}`);
};
const warn = (message) => {
  warnings++;
  console.warn(`  ! ${message}`);
};

const ARTICLES = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'the', 'a', 'an']);

/** Loose mirror of lib/cloze.ts — enough to flag entries the mode can't use. */
function hasUsableExample(entry, lang = 'en-US') {
  const parts = entry.word
    .replace(/[¿¡?!.]/g, '')
    .trim()
    .split(/[\s/]+/)
    .map((p) => p.toLowerCase());
  const core = ARTICLES.has(parts[0]) ? parts.slice(1) : parts;
  // Phrases must appear whole; single words match on a truncated stem.
  const needles =
    core.length > 1
      ? core
      : [core[0].length >= 6 ? core[0].slice(0, core[0].length - 3) : core[0].slice(0, Math.max(3, core[0].length - 1))];
  return entry.examples.some((example) => {
    const source = (lang.startsWith('en') ? example : example.split(' — ')[0]).toLowerCase();
    return source.length >= 24 && needles.every((n) => source.includes(n));
  });
}

const seenIds = new Set();
const files = readdirSync(DECK_DIR).filter((f) => f.endsWith('.json')).sort();

for (const file of files) {
  const deck = JSON.parse(readFileSync(join(DECK_DIR, file), 'utf8'));
  console.log(`\n${file} — ${deck.name}`);

  for (const field of ['id', 'name', 'tagline', 'description', 'accent', 'lang', 'entries']) {
    if (deck[field] === undefined) fail(`deck is missing "${field}"`);
  }
  if (typeof deck.defaultOn !== 'boolean') fail('deck is missing "defaultOn"');
  if (!/^#[0-9A-Fa-f]{6}$/.test(deck.accent ?? '')) fail(`accent "${deck.accent}" is not a hex colour`);

  const count = deck.entries?.length ?? 0;
  if (count < 35 || count > 45) fail(`${count} entries (target is 35–45)`);
  else console.log(`  ✓ ${count} entries`);

  let noCloze = 0;
  const words = new Set();

  for (const entry of deck.entries ?? []) {
    const label = entry.word ?? entry.id ?? '(unnamed)';
    for (const field of REQUIRED_ENTRY_FIELDS) {
      if (entry[field] === undefined || entry[field] === '') fail(`${label}: missing "${field}"`);
    }
    if (seenIds.has(entry.id)) fail(`${label}: duplicate id "${entry.id}" across decks`);
    seenIds.add(entry.id);

    if (words.has(entry.word.toLowerCase())) fail(`${label}: duplicated within this deck`);
    words.add(entry.word.toLowerCase());

    if (![1, 2, 3].includes(entry.tier)) fail(`${label}: tier must be 1, 2 or 3`);
    if (!Array.isArray(entry.examples) || entry.examples.length < 2) {
      fail(`${label}: needs at least 2 examples`);
    }
    for (const example of entry.examples ?? []) {
      if (example.length < 24) warn(`${label}: example looks too short — "${example}"`);
    }
    if (entry.definition && entry.definition.length < 30) {
      warn(`${label}: definition looks thin`);
    }
    if (entry.examples?.length && !hasUsableExample(entry, deck.lang)) {
      noCloze++;
      warn(`${label}: no example contains the word, so it can't appear in Fill the blank`);
    }
  }

  if (noCloze === 0) console.log('  ✓ every entry can produce a fill-the-blank question');
}

console.log(
  `\n${files.length} decks checked — ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${
    warnings === 1 ? '' : 's'
  }`
);
process.exit(errors ? 1 : 0);
