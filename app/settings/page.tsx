'use client';

import { useRef, useState } from 'react';
import { PageHeader } from '@/components/Bits';
import { CheckIcon } from '@/components/Icons';
import { MY_WORDS_DECK_ID } from '@/lib/decks';
import { speak } from '@/lib/speech';
import { exportState } from '@/lib/storage';
import { useStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';

export default function SettingsPage() {
  const {
    state,
    decks,
    ready,
    setTheme,
    toggleDeck,
    setGoal,
    setSpeechRate,
    importJSON,
    resetAll,
  } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!ready) return <main className="min-h-[100dvh]" />;

  const download = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lexicon-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Exported.');
    window.setTimeout(() => setMessage(null), 2400);
  };

  const upload = async (file: File) => {
    try {
      importJSON(await file.text());
      setMessage('Imported. Everything has been replaced with that file.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read that file.');
    }
    window.setTimeout(() => setMessage(null), 4000);
  };

  return (
    <main className="pad-nav min-h-[100dvh]">
      <PageHeader kicker="Settings" title="Make it yours." />

      <div className="mx-auto max-w-lg space-y-4 px-5">
        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-4">Theme</p>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((theme) => {
              const active = state.settings.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setTheme(theme.id)}
                  className="rounded-2xl border p-3 text-left transition-transform active:scale-[0.98]"
                  style={{
                    borderColor: active ? 'var(--ink)' : 'var(--rule)',
                    borderWidth: active ? 2 : 1,
                  }}
                  aria-pressed={active}
                >
                  <div className="flex gap-1.5">
                    {theme.swatch.map((color) => (
                      <span
                        key={color}
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: color, borderColor: 'var(--rule)' }}
                      />
                    ))}
                  </div>
                  <p className="mt-2.5 text-[14px] font-semibold">{theme.name}</p>
                  <p className="mt-0.5 text-[11px] leading-snug" style={{ color: 'var(--faint)' }}>
                    {theme.blurb}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-1">Decks</p>
          <p className="mb-4 text-[13px]" style={{ color: 'var(--muted)' }}>
            Switched-off decks disappear from the feed, the daily word, and practice.
          </p>
          <ul className="space-y-1">
            {decks.map((deck) => {
              const on = state.settings.decksOn[deck.id] ?? deck.defaultOn;
              const count =
                deck.id === MY_WORDS_DECK_ID ? state.myWords.length : deck.entries.length;
              return (
                <li key={deck.id}>
                  <button
                    type="button"
                    onClick={() => toggleDeck(deck.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2.5 text-left"
                    role="switch"
                    aria-checked={on}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: deck.accent }}
                        />
                        <span className="text-[15px] font-semibold">{deck.name}</span>
                        <span className="text-[11px]" style={{ color: 'var(--faint)' }}>
                          {count}
                        </span>
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: 'var(--faint)' }}
                      >
                        {deck.tagline}
                      </span>
                    </span>
                    <span
                      className="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
                      style={{ backgroundColor: on ? 'var(--accent-2)' : 'var(--rule)' }}
                    >
                      <span
                        className="absolute top-1 h-5 w-5 rounded-full transition-all duration-200"
                        style={{
                          left: on ? 26 : 4,
                          backgroundColor: 'var(--surface)',
                        }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-4">Daily goal</p>
          <Stepper
            label="Words in the feed"
            value={state.settings.goalWords}
            min={1}
            max={20}
            onChange={(v) => setGoal(v, state.settings.goalPractice)}
          />
          <Stepper
            label="Practice rounds"
            value={state.settings.goalPractice}
            min={1}
            max={6}
            onChange={(v) => setGoal(state.settings.goalWords, v)}
          />
        </section>

        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-3">Pronunciation</p>
          <label className="flex items-center justify-between gap-4 text-[14px]">
            <span style={{ color: 'var(--muted)' }}>Speech rate</span>
            <span className="tabular-nums">{state.settings.speechRate.toFixed(2)}×</span>
          </label>
          <input
            type="range"
            min={0.6}
            max={1.3}
            step={0.02}
            value={state.settings.speechRate}
            onChange={(e) => setSpeechRate(Number(e.target.value))}
            className="mt-3 w-full"
            style={{ accentColor: 'var(--accent)' }}
            aria-label="Speech rate"
          />
          <button
            type="button"
            className="btn btn-ghost mt-3 w-full"
            onClick={() => speak('incrementality', 'en-US', state.settings.speechRate)}
          >
            Test the voice
          </button>
        </section>

        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-1">Your data</p>
          <p className="mb-4 text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>
            Everything lives in this browser&rsquo;s localStorage. Export before switching phones,
            clearing site data, or trying anything drastic.
          </p>
          <div className="flex gap-3">
            <button type="button" className="btn btn-primary flex-1 py-3.5" onClick={download}>
              Export JSON
            </button>
            <button
              type="button"
              className="btn btn-ghost flex-1 py-3.5"
              onClick={() => fileRef.current?.click()}
            >
              Import
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = '';
            }}
          />

          {message ? (
            <p
              className="mt-3 flex items-center gap-2 text-[13px]"
              style={{ color: 'var(--accent-2)' }}
              role="status"
            >
              <CheckIcon size={15} />
              {message}
            </p>
          ) : null}

          <div className="mt-5 border-t rule pt-4">
            {confirmReset ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn flex-1 py-3"
                  style={{
                    backgroundColor: 'var(--accent)',
                    borderColor: 'var(--accent)',
                    color: 'var(--on-accent)',
                  }}
                  onClick={() => {
                    resetAll();
                    setConfirmReset(false);
                    setMessage('Everything reset.');
                    window.setTimeout(() => setMessage(null), 2400);
                  }}
                >
                  Yes, erase everything
                </button>
                <button
                  type="button"
                  className="btn btn-ghost py-3"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="text-[13px] underline"
                style={{ color: 'var(--faint)' }}
                onClick={() => setConfirmReset(true)}
              >
                Reset all progress
              </button>
            )}
          </div>
        </section>

        <section className="card-surface rounded-card p-5">
          <p className="kicker mb-2">Daily nudge</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            There are no push notifications here by design. Set up the iOS Shortcuts automation in
            the README for a 9am reminder that opens straight to the Word of the Day.
          </p>
        </section>
      </div>
    </main>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[14px]" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-9 w-9 rounded-full border rule text-lg leading-none"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          –
        </button>
        <span className="w-6 text-center text-[16px] font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          className="h-9 w-9 rounded-full border rule text-lg leading-none"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
