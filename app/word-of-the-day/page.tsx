'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Conversation,
  DeckTag,
  Empty,
  KnowButton,
  SaveButton,
  SpeakButton,
  Synonyms,
  TierDots,
} from '@/components/Bits';
import { CheckIcon, FlameIcon, PlusIcon } from '@/components/Icons';
import { wordOfTheDay } from '@/lib/daily';
import { formatLongDate } from '@/lib/dates';
import { splitExample } from '@/lib/format';
import { useLearnableItems, useStore } from '@/lib/store';

export default function WordOfTheDayPage() {
  const { today, state, answerWotd, ready } = useStore();
  const items = useLearnableItems();
  const item = useMemo(() => wordOfTheDay(items, today), [items, today]);
  const response = state.wotd[today];

  if (!ready) return <main className="min-h-[100dvh]" />;

  if (!item) {
    return (
      <main className="pad-top pad-nav px-5">
        <Empty
          title="Nothing to serve"
          body="Turn a deck back on in settings and the Word of the Day comes back."
        />
      </main>
    );
  }

  const { entry } = item;

  return (
    <main className="pad-nav min-h-[100dvh] px-5">
      <div className="mx-auto max-w-lg">
        <header className="pad-top flex items-center justify-between pb-6">
          <div>
            <p className="kicker">Word of the day</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {formatLongDate(today)}
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border rule px-3 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: 'var(--surface)' }}
            title="Current streak"
          >
            <FlameIcon size={16} filled={state.streak > 0} />
            {state.streak}
          </div>
        </header>

        <section className="card-surface animate-riseIn rounded-card p-6">
          <div className="flex items-center justify-between">
            <DeckTag name={item.deckName} accent={item.accent} />
            <TierDots tier={entry.tier} />
          </div>

          <h1
            className="display mt-6 text-balance"
            style={{ fontSize: 'clamp(2.4rem, 12vw, 3.8rem)', lineHeight: 0.95 }}
            lang={item.lang}
          >
            {entry.word}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3">
            <span
              className="text-[15px] italic"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)' }}
            >
              {entry.pos}
            </span>
            <span
              className="text-[13px]"
              style={{ color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}
            >
              /{entry.pron}/
            </span>
          </div>

          <div className="my-5 h-px w-16" style={{ backgroundColor: 'var(--accent)' }} />

          <p className="text-[17px] leading-[1.55]">{entry.definition}</p>

          {entry.synonyms?.length ? (
            <div className="mt-4">
              <Synonyms words={entry.synonyms} />
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {entry.examples.map((example, i) => {
              const [source, gloss] = splitExample(example, item.lang);
              return (
                <figure key={i} className="border-l-2 pl-4" style={{ borderColor: 'var(--rule)' }}>
                  <blockquote
                    className="text-[15px] leading-[1.5]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {source}
                  </blockquote>
                  {gloss ? (
                    <figcaption className="mt-1 text-[13px]" style={{ color: 'var(--faint)' }}>
                      {gloss}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>

          {entry.conversation?.length ? (
            <div className="mt-5">
              <Conversation lines={entry.conversation} lang={item.lang} />
            </div>
          ) : null}

          {entry.note ? (
            <div className="mt-6 border-t rule pt-4">
              <p className="kicker mb-1.5">Usage</p>
              <p className="text-[14px] leading-[1.5]" style={{ color: 'var(--muted)' }}>
                {entry.note}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-2.5">
            <SpeakButton text={entry.word} lang={item.lang} />
            <SaveButton entryId={entry.id} />
            <KnowButton entryId={entry.id} />
          </div>
        </section>

        <section className="mt-6">
          {response ? (
            <div
              className="card-surface flex items-center justify-between rounded-card px-5 py-4"
              role="status"
            >
              <div>
                <p className="text-sm font-semibold">
                  {response === 'knew' ? 'Marked as known' : 'Added to your review queue'}
                </p>
                <p className="mt-0.5 text-[13px]" style={{ color: 'var(--muted)' }}>
                  {response === 'knew'
                    ? 'It moves further out in the schedule. Tap the check above to retire it from the feed entirely.'
                    : "You'll see it again tomorrow, then on the 3/7/14/30-day ladder."}
                </p>
              </div>
              <span style={{ color: 'var(--accent-2)' }}>
                <CheckIcon size={22} />
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn btn-ghost h-14"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={() => answerWotd(today, entry.id, 'knew')}
              >
                <CheckIcon size={18} />
                Knew it
              </button>
              <button
                type="button"
                className="btn btn-accent h-14"
                onClick={() => answerWotd(today, entry.id, 'new')}
              >
                <PlusIcon size={18} />
                New to me
              </button>
            </div>
          )}
        </section>

        <div className="mt-4 flex justify-center gap-4 text-[13px]">
          <Link href="/review" style={{ color: 'var(--muted)' }}>
            Review queue
          </Link>
          <span style={{ color: 'var(--rule)' }}>·</span>
          <Link href="/" style={{ color: 'var(--muted)' }}>
            Back to feed
          </Link>
        </div>
      </div>
    </main>
  );
}
