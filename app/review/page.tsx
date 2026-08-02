'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DeckTag, PageHeader, SpeakButton, Synonyms } from '@/components/Bits';
import { CheckIcon, CloseIcon } from '@/components/Icons';
import { splitExample } from '@/lib/format';
import { INTERVALS, dueCardIds, isGraduated, MAX_REVIEWS_PER_DAY } from '@/lib/srs';
import { useStore } from '@/lib/store';

export default function ReviewPage() {
  const { state, today, byId, gradeCard, ready } = useStore();

  // Built once, after hydration, then frozen — grading a card must not
  // reshuffle the queue underneath you mid-session.
  const [queue, setQueue] = useState<string[]>([]);
  const [built, setBuilt] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ correct: number; missed: number }>({
    correct: 0,
    missed: 0,
  });

  const id = queue[index];
  const item = id ? byId.get(id) : undefined;
  const card = id ? state.srs[id] : undefined;

  const dueLater = useMemo(
    () =>
      Object.entries(state.srs).filter(
        ([entryId, c]) => byId.has(entryId) && !isGraduated(c) && c.due > today
      ).length,
    [state.srs, byId, today]
  );

  useEffect(() => {
    if (!ready || built) return;
    setQueue(
      dueCardIds(state.srs, today)
        .filter((entryId) => byId.has(entryId))
        .slice(0, MAX_REVIEWS_PER_DAY)
    );
    setBuilt(true);
  }, [ready, built, state.srs, today, byId]);

  if (!ready || !built) return <main className="min-h-[100dvh]" />;

  const answer = (correct: boolean) => {
    if (!id) return;
    gradeCard(id, correct);
    setResults((r) => ({
      correct: r.correct + (correct ? 1 : 0),
      missed: r.missed + (correct ? 0 : 1),
    }));
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  if (!queue.length || !item || !card) {
    const finished = queue.length > 0;
    return (
      <main className="pad-nav min-h-[100dvh]">
        <PageHeader kicker="Spaced repetition" title={finished ? 'Queue clear.' : 'Nothing due.'} />
        <div className="mx-auto max-w-lg px-5">
          <div className="card-surface rounded-card p-6">
            {finished ? (
              <>
                <p className="text-[15px] leading-relaxed">
                  {results.correct} remembered, {results.missed} missed. Missed cards come back
                  tomorrow; the rest move up the ladder.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {INTERVALS.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border rule px-3 py-1 text-[12px]"
                      style={{ color: 'var(--muted)' }}
                    >
                      {n}d
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[15px] leading-relaxed">
                Nothing is due today. Cards arrive here from three places: words you mark
                &ldquo;New to me&rdquo; on the daily, words you miss in practice, and anything you
                heart in the feed.
              </p>
            )}
            <p className="mt-4 text-[13px]" style={{ color: 'var(--faint)' }}>
              {dueLater} card{dueLater === 1 ? '' : 's'} scheduled for later.
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <Link href="/practice" className="btn btn-primary flex-1 py-4">
              Practice instead
            </Link>
            <Link href="/" className="btn btn-ghost flex-1 py-4">
              Back to feed
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { entry } = item;
  const stage = Math.min(card.box, INTERVALS.length - 1);

  return (
    <main className="pad-nav flex min-h-[100dvh] flex-col px-5">
      <header className="pad-top mx-auto w-full max-w-lg">
        <div className="flex items-center justify-between">
          <p className="kicker">Review</p>
          <p className="text-sm font-semibold tabular-nums">
            {index + 1}/{queue.length}
          </p>
        </div>
        <div
          className="mt-4 h-[3px] w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--rule)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(index / queue.length) * 100}%`,
              backgroundColor: 'var(--accent)',
            }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div key={entry.id} className="flex flex-1 flex-col justify-center py-8 animate-fadeIn">
          <div className="mb-6 flex items-center gap-3">
            <DeckTag name={item.deckName} accent={item.accent} />
            <span className="text-[11px]" style={{ color: 'var(--faint)' }}>
              next up: {INTERVALS[stage]}d
            </span>
          </div>

          <h1
            className="display text-balance"
            style={{ fontSize: 'clamp(2.2rem, 12vw, 3.6rem)', lineHeight: 0.96 }}
            lang={item.lang}
          >
            {entry.word}
          </h1>
          <p
            className="mt-3 text-[13px]"
            style={{ color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}
          >
            /{entry.pron}/
          </p>

          <div className="mt-5">
            <SpeakButton text={entry.word} lang={item.lang} size="sm" />
          </div>

          {revealed ? (
            <div className="mt-7 animate-riseIn">
              <p className="text-[17px] leading-[1.5]">{entry.definition}</p>
              {entry.synonyms?.length ? (
                <div className="mt-3">
                  <Synonyms words={entry.synonyms} />
                </div>
              ) : null}
              {entry.examples[0] ? (
                <figure className="mt-4 border-l-2 pl-4" style={{ borderColor: 'var(--rule)' }}>
                  <blockquote
                    className="text-[15px] leading-[1.5]"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--muted)' }}
                  >
                    {splitExample(entry.examples[0], item.lang)[0]}
                  </blockquote>
                </figure>
              ) : null}
            </div>
          ) : (
            <p className="mt-7 text-[15px]" style={{ color: 'var(--faint)' }}>
              Say the definition out loud, then check yourself.
            </p>
          )}
        </div>

        <div className="pb-6">
          {revealed ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn h-16"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
                onClick={() => answer(false)}
              >
                <CloseIcon size={18} />
                Missed it
              </button>
              <button
                type="button"
                className="btn h-16"
                style={{
                  backgroundColor: 'var(--accent-2)',
                  borderColor: 'var(--accent-2)',
                  color: 'var(--on-accent)',
                }}
                onClick={() => answer(true)}
              >
                <CheckIcon size={18} />
                Got it
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary h-16 w-full"
              onClick={() => setRevealed(true)}
            >
              Show definition
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
