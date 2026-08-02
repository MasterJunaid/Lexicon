'use client';

import Link from 'next/link';
import { useState } from 'react';
import { splitExample } from '@/lib/format';
import { speak } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { CheckIcon, ChevronLeft, HeartIcon, SpeakerIcon } from './Icons';

export function DeckTag({ name, accent }: { name: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{
        color: accent,
        backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      {name}
    </span>
  );
}

export function TierDots({ tier }: { tier: number }) {
  return (
    <span className="flex items-center gap-1" title={`Difficulty ${tier} of 3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: n <= tier ? 'var(--muted)' : 'transparent',
            border: `1px solid ${n <= tier ? 'var(--muted)' : 'var(--rule)'}`,
          }}
        />
      ))}
    </span>
  );
}

export function SpeakButton({
  text,
  lang,
  size = 'md',
  label = 'Play pronunciation',
}: {
  text: string;
  lang: string;
  size?: 'sm' | 'md';
  label?: string;
}) {
  const { state } = useStore();
  const [pulsing, setPulsing] = useState(false);
  const dimension = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';

  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        speak(text, lang, state.settings.speechRate);
        setPulsing(true);
        window.setTimeout(() => setPulsing(false), 340);
      }}
      className={`${dimension} inline-flex items-center justify-center rounded-full border rule transition-transform active:scale-95 ${
        pulsing ? 'animate-pop' : ''
      }`}
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <SpeakerIcon size={size === 'sm' ? 17 : 20} />
    </button>
  );
}

export function SaveButton({
  entryId,
  size = 'md',
}: {
  entryId: string;
  size?: 'sm' | 'md';
}) {
  const { isSaved, toggleSave } = useStore();
  const saved = isSaved(entryId);
  const dimension = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? 'Remove from Lexicon' : 'Save to Lexicon'}
      onClick={(event) => {
        event.stopPropagation();
        toggleSave(entryId);
      }}
      className={`${dimension} inline-flex items-center justify-center rounded-full border transition-transform active:scale-95 ${
        saved ? 'animate-pop' : ''
      }`}
      style={{
        backgroundColor: saved ? 'var(--accent)' : 'var(--surface)',
        borderColor: saved ? 'var(--accent)' : 'var(--rule)',
        color: saved ? 'var(--on-accent)' : 'var(--ink)',
      }}
    >
      <HeartIcon size={size === 'sm' ? 17 : 20} filled={saved} />
    </button>
  );
}

export function KnowButton({
  entryId,
  size = 'md',
}: {
  entryId: string;
  size?: 'sm' | 'md';
}) {
  const { isKnown, toggleKnown } = useStore();
  const known = isKnown(entryId);
  const dimension = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';

  return (
    <button
      type="button"
      aria-pressed={known}
      aria-label={known ? 'Put this back in the feed' : 'I know this word'}
      title={known ? 'Known — tap to undo' : 'I know this'}
      onClick={(event) => {
        event.stopPropagation();
        toggleKnown(entryId);
      }}
      className={`${dimension} inline-flex items-center justify-center rounded-full border transition-transform active:scale-95 ${
        known ? 'animate-pop' : ''
      }`}
      style={{
        backgroundColor: known ? 'var(--accent-2)' : 'var(--surface)',
        borderColor: known ? 'var(--accent-2)' : 'var(--rule)',
        color: known ? 'var(--on-accent)' : 'var(--ink)',
      }}
    >
      <CheckIcon size={size === 'sm' ? 17 : 20} />
    </button>
  );
}

export function Synonyms({ words }: { words?: string[] }) {
  if (!words?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className="text-[13px]"
        style={{ color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}
        aria-hidden
      >
        ≈
      </span>
      <span className="sr-only">Close in meaning to:</span>
      {words.map((word) => (
        <span
          key={word}
          className="rounded-full border rule px-2.5 py-1 text-[12px]"
          style={{ color: 'var(--muted)', backgroundColor: 'var(--surface)' }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

export function Conversation({ lines, lang }: { lines?: string[]; lang?: string }) {
  if (!lines?.length) return null;
  return (
    <div className="rounded-2xl px-4 py-3.5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}>
      <p className="kicker mb-2.5">Out loud</p>
      <ul className="space-y-2.5">
        {lines.map((line, i) => {
          const at = line.indexOf(': ');
          const who = at > 0 ? line.slice(0, at) : null;
          const said = at > 0 ? line.slice(at + 2) : line;
          const [source, gloss] = splitExample(said, lang ?? 'en-US');
          return (
            <li key={i} className="text-[14px] leading-[1.45]">
              {who ? (
                <span
                  className="mr-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: 'var(--faint)' }}
                >
                  {who}
                </span>
              ) : null}
              <span style={{ color: 'var(--ink)' }} lang={gloss ? lang : undefined}>
                {source}
              </span>
              {gloss ? (
                <span className="block text-[12.5px]" style={{ color: 'var(--faint)' }}>
                  {gloss}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  back,
  right,
}: {
  kicker?: string;
  title: string;
  back?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="pad-top px-5 pb-4">
      <div className="mx-auto flex max-w-lg items-start justify-between gap-3">
        <div className="min-w-0">
          {back ? (
            <Link
              href={back}
              className="mb-2 inline-flex items-center gap-1 text-sm"
              style={{ color: 'var(--faint)' }}
            >
              <ChevronLeft size={16} />
              Back
            </Link>
          ) : null}
          {kicker ? <p className="kicker mb-1.5">{kicker}</p> : null}
          <h1 className="display text-[34px] leading-none">{title}</h1>
        </div>
        {right}
      </div>
    </header>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card-surface mx-auto max-w-lg rounded-card px-6 py-10 text-center">
      <p className="display text-2xl">{title}</p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
        {body}
      </p>
    </div>
  );
}
