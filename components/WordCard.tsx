'use client';

import { useEffect, useState } from 'react';
import { splitExample } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { FeedItem } from '@/lib/types';
import {
  Conversation,
  DeckTag,
  KnowButton,
  SaveButton,
  SpeakButton,
  Synonyms,
  TierDots,
} from './Bits';
import { ChevronDown } from './Icons';

function displaySize(word: string): string {
  const n = word.length;
  if (n <= 6) return 'clamp(3.6rem, 19vw, 5.4rem)';
  if (n <= 9) return 'clamp(3rem, 15vw, 4.4rem)';
  if (n <= 13) return 'clamp(2.4rem, 11.5vw, 3.6rem)';
  if (n <= 18) return 'clamp(1.95rem, 9vw, 2.9rem)';
  return 'clamp(1.7rem, 7.5vw, 2.4rem)';
}

export default function WordCard({
  item,
  active,
  index,
}: {
  item: FeedItem;
  active: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { isKnown } = useStore();
  const { entry } = item;
  const known = isKnown(entry.id);

  useEffect(() => {
    if (!active) setExpanded(false);
  }, [active, entry.id]);

  return (
    <article
      className="snap-card relative flex h-[100dvh] w-full flex-col px-6"
      style={{ paddingBottom: 'calc(var(--nav-height) + env(safe-area-inset-bottom) + 8px)' }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="pad-top flex shrink-0 items-center justify-between">
        <DeckTag name={item.deckName} accent={item.accent} />
        <div className="flex items-center gap-3">
          <span className="kicker" style={{ letterSpacing: '0.1em' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <TierDots tier={entry.tier} />
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col py-4 ${expanded ? 'justify-start' : 'justify-center'}`}
      >
        <div
          key={entry.id}
          className={`flex min-h-0 flex-col ${expanded ? 'flex-1' : ''} ${
            active ? 'animate-riseIn' : ''
          }`}
        >
          <h2
            className="display text-balance"
            style={{ fontSize: displaySize(entry.word), lineHeight: 0.94 }}
            lang={item.lang}
          >
            {entry.word}
          </h2>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className="text-[15px] italic"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)' }}
            >
              {entry.pos}
            </span>
            <span
              className="text-[13px] tracking-wide"
              style={{ color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}
            >
              /{entry.pron}/
            </span>
          </div>

          <div className="my-5 h-px w-16" style={{ backgroundColor: 'var(--accent)' }} />

          <p className="max-w-prose text-[17px] leading-[1.55]" style={{ color: 'var(--ink)' }}>
            {entry.definition}
          </p>

          {entry.synonyms?.length ? (
            <div className="mt-4">
              <Synonyms words={entry.synonyms} />
            </div>
          ) : null}

          {expanded ? (
            <div
              className="no-scrollbar mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto pb-2 pr-1 animate-fadeIn"
              style={{
                overscrollBehavior: 'contain',
                // Softens the cut where the panel meets the action row, and
                // hints that there's more to scroll.
                WebkitMaskImage:
                  'linear-gradient(to bottom, #000 calc(100% - 28px), transparent 100%)',
                maskImage: 'linear-gradient(to bottom, #000 calc(100% - 28px), transparent 100%)',
              }}
              onClick={(event) => event.stopPropagation()}
            >
              {entry.examples.map((example, i) => {
                const [source, gloss] = splitExample(example, item.lang);
                return (
                  <figure
                    key={i}
                    className="border-l-2 pl-4"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    <blockquote
                      className="text-[15px] leading-[1.5]"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
                      lang={gloss ? item.lang : undefined}
                    >
                      {source}
                    </blockquote>
                    {gloss ? (
                      <figcaption
                        className="mt-1 text-[13px] leading-snug"
                        style={{ color: 'var(--faint)' }}
                      >
                        {gloss}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}

              <Conversation lines={entry.conversation} lang={item.lang} />

              {entry.note ? (
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
                >
                  <p className="kicker mb-1.5">Usage</p>
                  <p className="text-[14px] leading-[1.5]" style={{ color: 'var(--muted)' }}>
                    {entry.note}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {known ? (
        <p
          className="shrink-0 pb-2.5 text-[12.5px] animate-fadeIn"
          style={{ color: 'var(--accent-2)' }}
          role="status"
        >
          Known — dropping out of the feed. Tap the check to undo.
        </p>
      ) : null}

      <div className="flex shrink-0 items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <SpeakButton text={entry.word} lang={item.lang} />
          <SaveButton entryId={entry.id} />
          <KnowButton entryId={entry.id} />
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="flex items-center gap-1.5 text-[13px] font-medium"
          style={{ color: 'var(--faint)' }}
          aria-expanded={expanded}
        >
          {expanded ? 'Close' : 'Examples'}
          <span
            className="inline-flex transition-transform duration-300"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={16} />
          </span>
        </button>
      </div>
    </article>
  );
}
