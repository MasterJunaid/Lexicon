'use client';

import { useState } from 'react';
import { splitExample } from '@/lib/format';
import type { FeedItem } from '@/lib/types';
import { DeckTag, SaveButton, SpeakButton } from './Bits';

export default function EntryRow({
  item,
  action,
}: {
  item: FeedItem;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { entry } = item;

  return (
    <li className="card-surface overflow-hidden rounded-card">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p
            className="truncate text-[19px] leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
            lang={item.lang}
          >
            {entry.word}
          </p>
          <p className="mt-1 truncate text-[13px]" style={{ color: 'var(--muted)' }}>
            {entry.definition}
          </p>
        </div>
        <DeckTag name={item.deckName} accent={item.accent} />
      </button>

      {open ? (
        <div className="border-t rule px-4 py-4 animate-fadeIn">
          <div className="flex items-baseline gap-3">
            <span
              className="text-[14px] italic"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)' }}
            >
              {entry.pos}
            </span>
            <span
              className="text-[12px]"
              style={{ color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}
            >
              /{entry.pron}/
            </span>
          </div>

          <p className="mt-3 text-[15px] leading-[1.5]">{entry.definition}</p>

          <div className="mt-4 space-y-3">
            {entry.examples.map((example, i) => {
              const [source, gloss] = splitExample(example, item.lang);
              return (
                <figure key={i} className="border-l-2 pl-3" style={{ borderColor: 'var(--rule)' }}>
                  <blockquote
                    className="text-[14px] leading-snug"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--muted)' }}
                  >
                    {source}
                  </blockquote>
                  {gloss ? (
                    <figcaption className="mt-0.5 text-[12px]" style={{ color: 'var(--faint)' }}>
                      {gloss}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>

          {entry.note ? (
            <p className="mt-4 text-[13px] leading-snug" style={{ color: 'var(--faint)' }}>
              <span className="kicker mr-2">Usage</span>
              {entry.note}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-2.5">
            <SpeakButton text={entry.word} lang={item.lang} size="sm" />
            <SaveButton entryId={entry.id} size="sm" />
            {action}
          </div>
        </div>
      ) : null}
    </li>
  );
}
