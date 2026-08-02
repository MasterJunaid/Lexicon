# Lexicon

A personal vocabulary PWA. Full-screen swipe feed, a deterministic Word of the Day, five
practice modes, and a spaced-repetition queue — built around one question: **would this word
actually earn its place in a growth memo, a LinkedIn post, or a creator brief?**

Eight decks ship with the app. Every entry carries a rewritten definition, near-synonyms so the
sense lands in a second, three example sentences, a short spoken exchange showing how the word
actually gets said out loud, and a usage note. Every example in the first four decks is written
to be pasteable into real work, not lifted from a dictionary.

| Deck | What it's for | Entries |
| --- | --- | --- |
| Growth Operator | Weekly reports, experiment writeups, strategy memos | 42 |
| Sharp Writing | Observation posts, insight lines, deep memos | 41 |
| Strategy & Positioning | The reading list: Rumelt, Dunford, Ries & Trout, Moore | 40 |
| Fintech & Markets | Creator scripts and the Finance Cheat Sheet | 41 |
| Taste | Fashion and fragrance, for the personal-brand side | 40 |
| GRE-tier General | Advanced general vocabulary that earns its keep | 42 |
| Español Starter | Peninsular Spanish, beginner tier (off by default) | 40 |
| My Words | Yours. Unlimited, free, exportable — never paywalled | ∞ |

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run check:decks  # content lint for the deck JSONs
npm run icons        # regenerate the PWA icon set
npm run lint
```

Requires Node 18.17+ (developed on Node 22).

## Deploying to Vercel

There is no backend, no database, and no environment variables — it's a static Next.js app.

1. Push this repo to GitHub.
2. On [vercel.com/new](https://vercel.com/new), import the repo. Vercel detects Next.js; take
   every default and deploy.
3. Or from the CLI:

   ```bash
   npx vercel --prod
   ```

The service worker only registers in production builds, so install/offline behaviour shows up
on the deployed URL (or via `npm run build && npm start`), not in `npm run dev`.

## Add to Home Screen (iPhone)

1. Open the deployed URL in **Safari** (Chrome on iOS can't install PWAs).
2. Tap the Share button → **Add to Home Screen** → Add.
3. Launch it from the home screen. It opens standalone — no browser chrome, no address bar.

The app is offline-first after the first launch: decks are bundled into the JavaScript, and the
service worker caches every route and static asset. Fonts come from Google Fonts on first load
and are cached after that; if they never load, each theme falls back to a local serif stack.

**Your data lives in this browser's localStorage.** Deleting the app, clearing site data, or
switching phones wipes it. Export from Settings → Your data before doing any of those.

## The 9am daily nudge (iOS Shortcuts)

There are no push notifications by design — no server, no accounts. iOS Shortcuts does the job
better anyway, because tapping the notification opens the app directly.

**Build the shortcut:**

1. Open **Shortcuts** → **Shortcuts** tab → **+**.
2. Add action → search **URL** → set it to your deployed address plus the daily route:
   `https://your-app.vercel.app/word-of-the-day`
3. Add action → search **Open URLs** → it picks up the URL above automatically.
4. Rename it (tap the name at the top) to **Lexicon Daily**. Done.

**Automate it for 9am:**

1. Shortcuts → **Automation** tab → **+** → **Time of Day**.
2. Set **9:00 AM**, **Daily** → Next.
3. Choose **Run Immediately** and turn **Notify When Run** on. (Leave "Ask Before Running" off —
   that's what makes it one tap.)
4. Add action → **Run Shortcut** → pick **Lexicon Daily** → Done.

At 9am you get a notification; tapping it opens straight to the Word of the Day. If you'd rather
land in the feed, point the URL at the root instead.

The shortcut can't know whether you've already practised — there's no server for it to ask. If you
want a backstop, add a second identical automation at 8pm and let the streak counter do the rest.

## Adding a deck

Deck JSON lives in `data/decks/`. To add one:

1. Create `data/decks/your-deck.json`:

   ```json
   {
     "id": "your-deck",
     "name": "Your Deck",
     "tagline": "Short subtitle",
     "description": "One sentence on what this deck is for.",
     "accent": "#9C3B2E",
     "lang": "en-US",
     "defaultOn": true,
     "entries": [
       {
         "id": "yd-example",
         "word": "example",
         "pos": "n.",
         "pron": "ig-ZAM-pul",
         "definition": "Rewritten in your own words, not scraped from a dictionary.",
         "synonyms": ["near-equivalent", "rough substitute"],
         "examples": [
           "One sentence set in the work you actually do.",
           "A second sentence, general is fine.",
           "A third is optional."
         ],
         "conversation": [
           "Jae: A question someone would actually ask.",
           "You: The reply, using the word the way you'd say it out loud."
         ],
         "note": "When to reach for it, and what it's often confused with.",
         "tier": 2
       }
     ]
   }
   ```

2. Register it in `lib/decks.ts` — import the JSON and add it to the `DECKS` array. That's the
   only code change.
3. Run `npm run check:decks`. It enforces required fields, unique ids across all decks, 35–45
   entries, at least two examples, at least two synonyms, a two-turn conversation in
   `Speaker: line` form, and flags any entry that can't produce a fill-the-blank question or
   never uses its own word in its conversation.

Field notes:

- `tier` is 1–3 (difficulty), shown as dots on the card.
- `synonyms` are near-equivalents for getting the sense fast, not exact swaps. They render as
  chips under the definition, and they also keep the practice modes fair — a word listed as a
  synonym is never offered as a wrong answer against its own entry.
- `conversation` is 2–4 turns, each `"Speaker: what they say"`. Use `You:` for your own line.
  It renders as the "Out loud" block in the expanded card.
- `lang` drives the `speechSynthesis` voice. Set it to `es-ES`, `fr-FR` and so on for a
  non-English deck; those decks may write examples as `"Spanish sentence — English gloss"` and
  the card renders the gloss underneath in a smaller size. English decks treat em-dashes as
  ordinary punctuation.
- `cloze` is an optional per-entry override: a sentence containing `___` for Fill the blank. Only
  needed when no example contains a recognisable form of the word (irregular verbs, mostly).
- `defaultOn: false` ships the deck switched off, like Español Starter.

Icons: `npm run icons` regenerates `public/icons/` from `scripts/generate-icons.mjs`, which draws
the mark in code — no design tool or image dependency.

## How the app works

**Feed** (`/`) — a full-screen vertical swipe through every word in the active decks, shuffled
with a per-day seed so today's order is stable all day. Unseen words come first. Tap a card to
expand examples, the spoken exchange, and the usage note; scrolling past the last card offers a
reshuffle.

Three actions sit under every word: speak it, heart it, or **✓ I know this**. The check retires
a word — it stops appearing in the feed, the daily word, and practice rounds, and any review card
for it is dropped. The card stays on screen after you tap so the ✓ can undo it, and disappears
from the next session onward. Settings → Known words puts everything back at once.

**Word of the Day** (`/word-of-the-day`) — deterministic from the date. 60% of days it draws from
Growth Operator or Sharp Writing, the other 40% from everything else that's on. "Knew it" pushes
the card up the ladder; "New to me" drops it into the review queue.

**Practice** (`/practice`) — five modes:

- *Definition match* — MCQ, alternating word→meaning and meaning→word.
- *Fill the blank* — a real example sentence with the word removed. Every inflection of the
  answer gets blanked, so nothing leaks.
- *Pairs* — five words, five definitions, score falls with time and mistakes.
- *Spell it* — hear it (`speechSynthesis`) and read the definition, then type it.
- *Speed round* — 60 seconds of rapid MCQ, high score tracked.

Distractors prefer other words from the same deck, which makes the rounds meaningfully harder.
Anything you miss is added to the review queue automatically.

**Review** (`/review`) — SM-2-lite. Correct answers move a card along `1 → 3 → 7 → 14 → 30` days;
a miss sends it back to tomorrow. Clearing the 30-day step graduates the card ("mastered"). Max
15 cards a day. Cards enter from three places: "New to me" on the daily, practice misses, and
anything you heart.

**Lexicon** (`/lexicon`) — saved words, custom collections, and the My Words form.

**Stats** (`/stats`) — streak, longest streak, 14-day activity, per-deck coverage, high scores.

**Settings** (`/settings`) — themes, deck toggles, known-word reset, daily goal, speech rate,
export/import, full reset.

### Themes

Four, each swapping the full palette and the display/UI font pair: **Editorial** (default, warm
cream and near-black), **Ink** (dark), **Deep Winter** (jewel tones on black), **Newsprint**
(grey stock, Caslon throughout). The choice is applied before first paint by an inline script in
the root layout, so there's no flash of the wrong theme on launch. All motion respects
`prefers-reduced-motion`.

## localStorage schema

One key: **`lexicon.state.v1`** (the key name is fixed; the schema version lives inside).
Unknown fields are merged over defaults on load, so an older save never breaks a newer build,
and a save written by a *newer* build is preserved rather than wiped. Migrations go in
`migrate()` in `lib/storage.ts` alongside a bump to `STATE_VERSION`. Current version: **2**
(v1 → v2 added the `known` map; v1 saves upgrade in place, keeping everything else).

```jsonc
{
  "version": 2,
  "settings": {
    "theme": "editorial",              // theme id
    "decksOn": { "growth-operator": true, "espanol-starter": false },
    "goalWords": 3,                    // daily goal: words in the feed
    "goalPractice": 1,                 // daily goal: practice rounds
    "speechRate": 0.92                 // speechSynthesis rate
  },
  "saved": ["go-incrementality"],      // hearted entry ids, most recent first
  "collections": [
    { "id": "col-…", "name": "Q4 memo", "entryIds": ["…"], "createdAt": 0 }
  ],
  "myWords": [
    {
      "id": "mw-…", "word": "", "pos": "n.", "pron": "",
      "definition": "", "synonyms": [""], "examples": [""], "conversation": ["You: …"],
      "note": "", "tier": 2, "createdAt": 0
    }
  ],
  "srs": {
    "go-incrementality": {
      "box": 2,                        // 0 = new, >5 = graduated
      "due": "2026-08-09",             // local YYYY-MM-DD
      "reps": 3, "lapses": 1, "addedAt": 0, "lastReviewed": 0
    }
  },
  "seen": { "go-incrementality": 1754150400000 },   // entry id -> last seen (ms)
  "known": { "go-delta": 1754150400000 },           // "I know this" -> held out of rotation
  "wotd": { "2026-08-02": "new" },                  // date -> "knew" | "new"
  "days": { "2026-08-02": { "words": 6, "practice": 1, "reviews": 12 } },
  "streak": 4,
  "longestStreak": 11,
  "lastActiveDate": "2026-08-02",
  "highScores": { "speed-round": 22, "pairs": 74 },
  "practiceRuns": 18,
  "createdAt": 0
}
```

Export produces `{ app: "lexicon", exportedAt, state }`. Import accepts that wrapper or a bare
state object, and **replaces** everything — it isn't a merge.

## Structure

```
app/                 routes: feed, word-of-the-day, practice/*, review, lexicon, stats, settings
components/          WordCard, Feed, EntryRow, MyWordForm, practice shell + MCQ runner
lib/                 decks, storage, store (React context), srs, daily, cloze, practice, themes, speech
data/decks/          the eight deck JSONs — the actual product
public/              manifest, service worker, generated icons
scripts/             deck validator, icon generator
```

## Non-goals

No accounts, no server, no push notifications, no runtime AI calls, no native widget. Everything
runs locally in the browser, forever, whether or not this repo is ever touched again.
