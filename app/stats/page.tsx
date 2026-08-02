'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { PageHeader } from '@/components/Bits';
import { FlameIcon, GearIcon } from '@/components/Icons';
import { addDays } from '@/lib/dates';
import { isGraduated, masteredCount } from '@/lib/srs';
import { useStore } from '@/lib/store';
import type { PracticeMode } from '@/lib/types';

const MODE_NAMES: Record<PracticeMode, string> = {
  'definition-match': 'Definition match',
  'fill-blank': 'Fill the blank',
  pairs: 'Pairs',
  'spell-it': 'Spell it',
  'speed-round': 'Speed round',
};

export default function StatsPage() {
  const { state, decks, today, ready } = useStore();

  const perDeck = useMemo(
    () =>
      decks.map((deck) => {
        const total = deck.entries.length;
        const seen = deck.entries.filter((e) => state.seen[e.id]).length;
        const mastered = deck.entries.filter((e) => {
          const card = state.srs[e.id];
          return card && isGraduated(card);
        }).length;
        return { deck, total, seen, mastered };
      }),
    [decks, state.seen, state.srs]
  );

  const last14 = useMemo(() => {
    const days: { date: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = addDays(today, -i);
      const log = state.days[date];
      days.push({ date, total: log ? log.words + log.practice * 3 + log.reviews : 0 });
    }
    return days;
  }, [state.days, today]);

  if (!ready) return <main className="min-h-[100dvh]" />;

  const peak = Math.max(1, ...last14.map((d) => d.total));
  const totalSeen = Object.keys(state.seen).length;
  const mastered = masteredCount(state.srs);
  const inQueue = Object.values(state.srs).filter((c) => !isGraduated(c)).length;

  return (
    <main className="pad-nav min-h-[100dvh]">
      <PageHeader
        kicker="Progress"
        title="The numbers."
        right={
          <Link
            href="/settings"
            aria-label="Settings"
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border rule"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <GearIcon size={19} />
          </Link>
        }
      />

      <div className="mx-auto max-w-lg space-y-4 px-5">
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Current streak"
            value={state.streak}
            suffix={state.streak === 1 ? 'day' : 'days'}
            icon={<FlameIcon size={18} filled={state.streak > 0} />}
          />
          <Stat label="Longest streak" value={state.longestStreak} suffix="days" />
          <Stat label="Words seen" value={totalSeen} />
          <Stat label="Mastered" value={mastered} suffix="graduated" />
        </div>

        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-3">Last 14 days</p>
          <div className="flex h-20 items-end gap-1.5">
            {last14.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${Math.max(3, (day.total / peak) * 68)}px`,
                    backgroundColor: day.total
                      ? day.date === today
                        ? 'var(--accent)'
                        : 'var(--accent-2)'
                      : 'var(--rule)',
                    opacity: day.total ? 1 : 0.6,
                  }}
                  title={`${day.date}: ${day.total}`}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px]" style={{ color: 'var(--faint)' }}>
            Words viewed, practice rounds, and reviews, weighted together.
          </p>
        </section>

        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-4">Per deck</p>
          <ul className="space-y-4">
            {perDeck.map(({ deck, total, seen, mastered: deckMastered }) => (
              <li key={deck.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-semibold">{deck.name}</p>
                  <p className="text-[12px] tabular-nums" style={{ color: 'var(--faint)' }}>
                    {seen}/{total} seen · {deckMastered} mastered
                  </p>
                </div>
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--rule)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${total ? (seen / total) * 100 : 0}%`,
                      backgroundColor: deck.accent,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-4">Practice</p>
          <ul className="space-y-2.5">
            {(Object.keys(MODE_NAMES) as PracticeMode[]).map((mode) => (
              <li key={mode} className="flex items-baseline justify-between">
                <span className="text-[14px]" style={{ color: 'var(--muted)' }}>
                  {MODE_NAMES[mode]}
                </span>
                <span className="text-[15px] font-semibold tabular-nums">
                  {state.highScores[mode] ?? '—'}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t rule pt-3 text-[12px]" style={{ color: 'var(--faint)' }}>
            {state.practiceRuns} round{state.practiceRuns === 1 ? '' : 's'} played · {inQueue} card
            {inQueue === 1 ? '' : 's'} still in the review ladder
          </p>
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card-surface rounded-card p-4">
      <div className="flex items-center gap-2">
        {icon ? <span style={{ color: 'var(--accent)' }}>{icon}</span> : null}
        <p className="kicker">{label}</p>
      </div>
      <p className="display mt-2 text-4xl tabular-nums">{value}</p>
      {suffix ? (
        <p className="text-[12px]" style={{ color: 'var(--faint)' }}>
          {suffix}
        </p>
      ) : null}
    </div>
  );
}
