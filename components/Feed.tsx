'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { feedOrder, freshFirst } from '@/lib/daily';
import { hashString, seededShuffle } from '@/lib/random';
import { useLearnableItems, useStore } from '@/lib/store';
import WordCard from './WordCard';

const PAGE = 12;

export default function Feed() {
  const { today, state, markSeen, ready, items: allItems, clearKnown } = useStore();
  const items = useLearnableItems();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [limit, setLimit] = useState(PAGE);
  const [shuffleKey, setShuffleKey] = useState(0);

  // Which words were unseen when the session started. Frozen, so scrolling
  // (which marks words seen) can't reorder the feed under your thumb.
  const [seenAtOpen, setSeenAtOpen] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (ready && seenAtOpen === null) setSeenAtOpen(state.seen);
  }, [ready, seenAtOpen, state.seen]);

  const order = useMemo(() => {
    if (!items.length) return [];
    const base = feedOrder(items, today);
    const [first, ...rest] = [base.slice(0, items.length), ...chunk(base.slice(items.length), items.length)];
    const opening = freshFirst(first, seenAtOpen ?? {});
    const merged = [...opening, ...rest.flat()];
    if (shuffleKey === 0) return merged;
    return seededShuffle(merged, hashString(`${today}-reshuffle-${shuffleKey}`));
  }, [items, today, shuffleKey, seenAtOpen]);

  const visible = order.slice(0, limit);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(index);
            const id = (entry.target as HTMLElement).dataset.entry;
            if (id) markSeen(id);
            if (index >= limit - 4) setLimit((l) => Math.min(l + PAGE, order.length));
          }
        }
      },
      { root: node, threshold: [0.61] }
    );
    node.querySelectorAll('[data-index]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // `ready` matters: before hydration the container isn't rendered, so the
    // observer has nothing to attach to and must be set up again afterwards.
  }, [ready, visible.length, limit, order.length, markSeen]);

  if (!ready) {
    return <div className="h-[100dvh]" />;
  }

  if (!items.length) {
    const allKnown = allItems.length > 0;
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center px-8 text-center">
        <h1 className="display text-4xl">{allKnown ? 'You know them all' : 'No decks on'}</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          {allKnown
            ? 'Every word in your active decks is marked as known. Switch another deck on, add your own words, or put the known ones back.'
            : 'Every deck is switched off, so there is nothing to scroll. Turn one back on and the feed fills up again.'}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/settings" className="btn btn-primary">
            Open settings
          </Link>
          {allKnown ? (
            <button type="button" className="btn btn-ghost" onClick={clearKnown}>
              Put known words back
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="snap-feed no-scrollbar h-[100dvh] overflow-y-auto"
      aria-label="Word feed"
    >
      {visible.map((item, index) => (
        <div key={`${item.entry.id}-${index}`} data-index={index} data-entry={item.entry.id}>
          <WordCard item={item} index={index} active={index === activeIndex} />
        </div>
      ))}

      <div className="snap-card flex h-[100dvh] flex-col items-center justify-center px-8 text-center">
        <p className="kicker">End of the pass</p>
        <h2 className="display mt-3 text-4xl">That&rsquo;s the deck.</h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          You&rsquo;ve scrolled everything in today&rsquo;s order. Reshuffle for a different
          run, or go practise what you just read.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShuffleKey((k) => k + 1);
              setLimit(PAGE);
              containerRef.current?.scrollTo({ top: 0 });
            }}
          >
            Reshuffle the feed
          </button>
          <Link href="/practice" className="btn btn-ghost">
            Go to practice
          </Link>
        </div>
      </div>
    </div>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
