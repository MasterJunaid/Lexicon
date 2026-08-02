'use client';

import Link from 'next/link';
import { useState } from 'react';
import { speak } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { ChevronLeft, HeartIcon, SpeakerIcon } from './Icons';

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
