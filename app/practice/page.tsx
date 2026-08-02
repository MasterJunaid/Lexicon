'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/Bits';
import { dueCardIds, MAX_REVIEWS_PER_DAY } from '@/lib/srs';
import { useStore } from '@/lib/store';
import type { PracticeMode } from '@/lib/types';

const MODES: {
  href: string;
  mode: PracticeMode;
  name: string;
  blurb: string;
  scored: boolean;
}[] = [
  {
    href: '/practice/definition-match',
    mode: 'definition-match',
    name: 'Definition match',
    blurb: 'Word to meaning and back again. Ten questions, both directions.',
    scored: false,
  },
  {
    href: '/practice/fill-blank',
    mode: 'fill-blank',
    name: 'Fill the blank',
    blurb: 'A real sentence with the word cut out. Pick what belongs there.',
    scored: false,
  },
  {
    href: '/practice/pairs',
    mode: 'pairs',
    name: 'Pairs',
    blurb: 'Five words, five definitions, one soft timer.',
    scored: true,
  },
  {
    href: '/practice/spell-it',
    mode: 'spell-it',
    name: 'Spell it',
    blurb: 'Hear the word, read the meaning, type it correctly.',
    scored: false,
  },
  {
    href: '/practice/speed-round',
    mode: 'speed-round',
    name: 'Speed round',
    blurb: 'Sixty seconds, rapid fire, high score tracked.',
    scored: true,
  },
];

export default function PracticeHub() {
  const { state, today, todayLog, byId } = useStore();
  const due = dueCardIds(state.srs, today).filter((id) => byId.has(id));
  const dueToday = Math.min(due.length, MAX_REVIEWS_PER_DAY);
  const goalPractice = state.settings.goalPractice;
  const donePractice = todayLog.practice + (todayLog.reviews > 0 ? 1 : 0);

  return (
    <main className="pad-nav min-h-[100dvh]">
      <PageHeader kicker="Practice" title="Five ways in." />

      <div className="mx-auto max-w-lg px-5">
        <Link
          href="/review"
          className="block rounded-card p-5 transition-transform active:scale-[0.99]"
          style={{
            backgroundColor: dueToday ? 'var(--accent)' : 'var(--surface)',
            color: dueToday ? 'var(--on-accent)' : 'var(--ink)',
            border: `1px solid ${dueToday ? 'var(--accent)' : 'var(--rule)'}`,
          }}
        >
          <div className="flex items-baseline justify-between">
            <p
              className="kicker"
              style={{ color: dueToday ? 'var(--on-accent)' : 'var(--faint)', opacity: 0.9 }}
            >
              Spaced repetition
            </p>
            <span className="display text-3xl tabular-nums">{dueToday}</span>
          </div>
          <p className="display mt-2 text-2xl">Review</p>
          <p className="mt-1 text-[13px] leading-snug" style={{ opacity: 0.85 }}>
            {dueToday
              ? `${dueToday} card${dueToday === 1 ? '' : 's'} due today on the 1/3/7/14/30 ladder.`
              : 'Nothing due right now. New-to-me words and practice misses land here.'}
          </p>
        </Link>

        <div
          className="mt-4 flex items-center justify-between rounded-2xl border rule px-4 py-3 text-[13px]"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <span style={{ color: 'var(--muted)' }}>Today&rsquo;s goal</span>
          <span className="font-semibold tabular-nums">
            {Math.min(todayLog.words, state.settings.goalWords)}/{state.settings.goalWords} words
            · {Math.min(donePractice, goalPractice)}/{goalPractice} practice
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {MODES.map((mode) => {
            const best = state.highScores[mode.mode];
            return (
              <li key={mode.href}>
                <Link
                  href={mode.href}
                  className="card-surface flex items-center justify-between gap-4 rounded-card px-5 py-4 transition-transform active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="display text-[22px]">{mode.name}</p>
                    <p
                      className="mt-1 text-[13px] leading-snug"
                      style={{ color: 'var(--muted)' }}
                    >
                      {mode.blurb}
                    </p>
                  </div>
                  {mode.scored && best ? (
                    <div className="shrink-0 text-right">
                      <p className="kicker">Best</p>
                      <p className="display text-2xl tabular-nums">{best}</p>
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
