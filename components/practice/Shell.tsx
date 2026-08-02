'use client';

import Link from 'next/link';
import { CloseIcon } from '@/components/Icons';

export function PracticeShell({
  title,
  progress,
  right,
  children,
}: {
  title: string;
  progress: number;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col px-5 pad-nav">
      <header className="pad-top mx-auto w-full max-w-lg">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/practice"
            aria-label="Leave practice"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border rule"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <CloseIcon size={17} />
          </Link>
          <p className="kicker">{title}</p>
          <div className="min-w-[36px] text-right text-sm font-semibold tabular-nums">
            {right}
          </div>
        </div>
        <div
          className="mt-4 h-[3px] w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--rule)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progress * 100))}%`,
              backgroundColor: 'var(--accent)',
              transitionTimingFunction: 'var(--ease-editorial)',
            }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">{children}</div>
    </main>
  );
}

export function PracticeResult({
  score,
  total,
  best,
  unit = 'correct',
  onRetry,
  missed,
}: {
  score: number;
  total: number;
  best?: number;
  unit?: string;
  onRetry: () => void;
  missed: { word: string; definition: string }[];
}) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const verdict =
    pct >= 90 ? 'Sharp.' : pct >= 70 ? 'Solid round.' : pct >= 40 ? 'Getting there.' : 'Rough one.';

  return (
    <div className="flex flex-1 flex-col justify-center py-8 animate-riseIn">
      <p className="kicker">Round complete</p>
      <h1 className="display mt-2 text-5xl">{verdict}</h1>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="display text-6xl tabular-nums" style={{ color: 'var(--accent)' }}>
          {score}
        </span>
        <span className="text-lg" style={{ color: 'var(--muted)' }}>
          / {total} {unit}
        </span>
      </div>

      {best !== undefined ? (
        <p className="mt-2 text-sm" style={{ color: 'var(--faint)' }}>
          Personal best: {best}
        </p>
      ) : null}

      {missed.length ? (
        <div className="card-surface mt-7 rounded-card p-5">
          <p className="kicker mb-3">Missed — now in your review queue</p>
          <ul className="space-y-3">
            {missed.slice(0, 6).map((m, i) => (
              <li key={`${m.word}-${i}`}>
                <p className="text-[17px]" style={{ fontFamily: 'var(--font-display)' }}>
                  {m.word}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>
                  {m.definition}
                </p>
              </li>
            ))}
          </ul>
          {missed.length > 6 ? (
            <p className="mt-3 text-[13px]" style={{ color: 'var(--faint)' }}>
              and {missed.length - 6} more — all queued for review.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        <button type="button" className="btn btn-primary h-13 py-4" onClick={onRetry}>
          Go again
        </button>
        <Link href="/practice" className="btn btn-ghost py-4">
          Back to practice
        </Link>
      </div>
    </div>
  );
}

export function NotEnoughWords() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <h1 className="display text-3xl">Not enough words on</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
        This mode needs at least a handful of active words to build a fair round. Switch another
        deck on and come back.
      </p>
      <Link href="/settings" className="btn btn-primary mt-6">
        Open settings
      </Link>
    </div>
  );
}
