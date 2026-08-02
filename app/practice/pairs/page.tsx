'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { NotEnoughWords, PracticeResult, PracticeShell } from '@/components/practice/Shell';
import { buildPairs, practicePool } from '@/lib/practice';
import { useLearnableItems, useStore } from '@/lib/store';

const SIZE = 5;
const SOFT_LIMIT = 60;

export default function PairsPage() {
  const { state, ready, queueForReview, logPractice, byId } = useStore();
  const items = useLearnableItems();
  const pool = useMemo(
    () => practicePool(items, state.seen, state.saved, state.srs),
    [items, state.seen, state.saved, state.srs]
  );

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const round = useMemo(() => buildPairs(pool, SIZE, seed), [pool, seed]);

  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState<{ word: string; definition: string }[]>([]);

  const total = round.words.length;

  useEffect(() => {
    if (done || !total) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [done, total]);

  const score = Math.max(0, 100 - elapsed - mistakes * 8);

  useEffect(() => {
    if (!total || done || matched.length < total) return;
    setDone(true);
    logPractice('pairs', Math.max(0, 100 - elapsed - mistakes * 8));
  }, [matched.length, total, done, elapsed, mistakes, logPractice]);

  const restart = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1e9));
    setSelected(null);
    setMatched([]);
    setMistakes(0);
    setElapsed(0);
    setDone(false);
    setMissed([]);
    setWrongPair(null);
  }, []);

  if (!ready) return <main className="min-h-[100dvh]" />;
  if (pool.length < SIZE) return <NotEnoughWords />;

  const chooseDefinition = (entryId: string) => {
    if (!selected || matched.includes(entryId)) return;
    if (selected === entryId) {
      setMatched((m) => [...m, entryId]);
      setSelected(null);
      return;
    }
    setMistakes((m) => m + 1);
    setWrongPair(entryId);
    queueForReview(selected);
    const item = byId.get(selected);
    if (item) {
      setMissed((prev) =>
        prev.some((p) => p.word === item.entry.word)
          ? prev
          : [...prev, { word: item.entry.word, definition: item.entry.definition }]
      );
    }
    window.setTimeout(() => {
      setWrongPair(null);
      setSelected(null);
    }, 500);
  };

  if (done) {
    return (
      <PracticeShell title="Pairs" progress={1}>
        <PracticeResult
          score={score}
          total={100}
          best={state.highScores.pairs}
          unit="points"
          onRetry={restart}
          missed={missed}
        />
      </PracticeShell>
    );
  }

  return (
    <PracticeShell
      title="Pairs"
      progress={matched.length / Math.max(1, total)}
      right={
        <span style={{ color: elapsed > SOFT_LIMIT ? 'var(--accent)' : 'var(--ink)' }}>
          {elapsed}s
        </span>
      }
    >
      <div className="flex flex-1 flex-col py-6">
        <p className="kicker mb-3">Tap a word, then its meaning</p>

        <div className="flex flex-wrap gap-2">
          {round.words.map((w) => {
            const isMatched = matched.includes(w.entryId);
            const isSelected = selected === w.entryId;
            return (
              <button
                key={w.entryId}
                type="button"
                disabled={isMatched}
                onClick={() => setSelected(isSelected ? null : w.entryId)}
                className="rounded-full border px-4 py-2.5 text-[16px] transition-all duration-200 active:scale-95"
                style={{
                  fontFamily: 'var(--font-display)',
                  backgroundColor: isSelected ? 'var(--ink)' : 'var(--surface)',
                  borderColor: isSelected ? 'var(--ink)' : 'var(--rule)',
                  color: isSelected ? 'var(--bg)' : 'var(--ink)',
                  opacity: isMatched ? 0.28 : 1,
                  textDecoration: isMatched ? 'line-through' : 'none',
                }}
                lang={w.lang}
              >
                {w.word}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex-1 space-y-2.5">
          {round.definitions.map((d) => {
            const isMatched = matched.includes(d.entryId);
            const isWrong = wrongPair === d.entryId;
            return (
              <button
                key={d.entryId}
                type="button"
                disabled={isMatched || !selected}
                onClick={() => chooseDefinition(d.entryId)}
                className={`w-full rounded-2xl border px-4 py-3.5 text-left text-[14px] leading-snug transition-all duration-200 ${
                  isWrong ? 'animate-shake' : ''
                }`}
                style={{
                  backgroundColor: isMatched
                    ? 'color-mix(in srgb, var(--accent-2) 16%, var(--surface))'
                    : 'var(--surface)',
                  borderColor: isWrong
                    ? 'var(--accent)'
                    : isMatched
                      ? 'var(--accent-2)'
                      : 'var(--rule)',
                  color: isMatched ? 'var(--muted)' : 'var(--ink)',
                  opacity: !selected && !isMatched ? 0.75 : 1,
                }}
              >
                {d.text}
              </button>
            );
          })}
        </div>

        <p className="pb-2 text-center text-[12px]" style={{ color: 'var(--faint)' }}>
          {matched.length}/{total} matched · {mistakes} mistake{mistakes === 1 ? '' : 's'} · score
          falls with time
        </p>
      </div>
    </PracticeShell>
  );
}
