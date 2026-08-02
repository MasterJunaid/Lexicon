'use client';

import { useCallback, useMemo } from 'react';
import McqRunner from '@/components/practice/McqRunner';
import { NotEnoughWords } from '@/components/practice/Shell';
import { buildDefinitionMatch, practicePool } from '@/lib/practice';
import { useLearnableItems, useStore } from '@/lib/store';

export default function SpeedRoundPage() {
  const { state, ready } = useStore();
  const items = useLearnableItems();
  const pool = useMemo(
    () => practicePool(items, state.seen, state.saved, state.srs),
    [items, state.seen, state.saved, state.srs]
  );
  const build = useCallback((seed: number) => buildDefinitionMatch(pool, 60, seed), [pool]);

  if (!ready) return <main className="min-h-[100dvh]" />;
  if (pool.length < 4) return <NotEnoughWords />;

  return (
    <McqRunner
      mode="speed-round"
      title="Speed round"
      build={build}
      timeLimit={60}
      scoreUnit="answered"
    />
  );
}
