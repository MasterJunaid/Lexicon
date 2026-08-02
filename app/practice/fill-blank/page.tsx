'use client';

import { useCallback, useMemo } from 'react';
import McqRunner from '@/components/practice/McqRunner';
import { NotEnoughWords } from '@/components/practice/Shell';
import { buildFillBlank, practicePool } from '@/lib/practice';
import { useLearnableItems, useStore } from '@/lib/store';

export default function FillBlankPage() {
  const { state, ready } = useStore();
  const items = useLearnableItems();
  const pool = useMemo(
    () => practicePool(items, state.seen, state.saved, state.srs),
    [items, state.seen, state.saved, state.srs]
  );
  const build = useCallback((seed: number) => buildFillBlank(pool, 10, seed), [pool]);

  if (!ready) return <main className="min-h-[100dvh]" />;
  if (pool.length < 4) return <NotEnoughWords />;

  return <McqRunner mode="fill-blank" title="Fill the blank" build={build} />;
}
