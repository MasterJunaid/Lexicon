'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { Tier } from '@/lib/types';

const EMPTY = {
  word: '',
  pos: 'n.',
  pron: '',
  definition: '',
  example1: '',
  example2: '',
  note: '',
  tier: 2 as Tier,
};

const POS_OPTIONS = ['n.', 'v.', 'adj.', 'adv.', 'phrase', 'interj.', 'pron.'];

export default function MyWordForm({ onAdded }: { onAdded?: () => void }) {
  const { addMyWord } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.word.trim() || !form.definition.trim()) return;
    addMyWord({
      word: form.word.trim(),
      pos: form.pos,
      pron: form.pron.trim() || form.word.trim().toLowerCase(),
      definition: form.definition.trim(),
      examples: [form.example1.trim(), form.example2.trim()].filter(Boolean),
      note: form.note.trim(),
      tier: form.tier,
    });
    setForm(EMPTY);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
    onAdded?.();
  };

  return (
    <form onSubmit={submit} className="card-surface rounded-card p-5">
      <p className="kicker mb-1">Add your own</p>
      <p className="mb-4 text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>
        Your word, your definition, your example. Unlimited and included in the feed, practice,
        and export.
      </p>

      <div className="space-y-3">
        <input
          className="field"
          placeholder="Word or phrase"
          value={form.word}
          onChange={(e) => set('word', e.target.value)}
          required
          aria-label="Word"
        />

        <div className="flex gap-3">
          <select
            className="field w-32"
            value={form.pos}
            onChange={(e) => set('pos', e.target.value)}
            aria-label="Part of speech"
          >
            {POS_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            className="field flex-1"
            placeholder="Pronunciation (optional)"
            value={form.pron}
            onChange={(e) => set('pron', e.target.value)}
            aria-label="Pronunciation respelling"
          />
        </div>

        <textarea
          className="field min-h-[84px] resize-y"
          placeholder="Your definition — write it the way you'd explain it"
          value={form.definition}
          onChange={(e) => set('definition', e.target.value)}
          required
          aria-label="Definition"
        />

        <textarea
          className="field min-h-[68px] resize-y"
          placeholder="Example sentence — one you'd actually write"
          value={form.example1}
          onChange={(e) => set('example1', e.target.value)}
          aria-label="First example"
        />

        <textarea
          className="field min-h-[68px] resize-y"
          placeholder="Second example (optional)"
          value={form.example2}
          onChange={(e) => set('example2', e.target.value)}
          aria-label="Second example"
        />

        <input
          className="field"
          placeholder="Usage note (optional)"
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          aria-label="Usage note"
        />

        <div className="flex items-center gap-3">
          <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
            Difficulty
          </span>
          <div className="flex gap-2">
            {[1, 2, 3].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => set('tier', tier as Tier)}
                className="h-9 w-9 rounded-full border text-[13px] font-semibold"
                style={{
                  backgroundColor: form.tier === tier ? 'var(--ink)' : 'var(--bg)',
                  borderColor: form.tier === tier ? 'var(--ink)' : 'var(--rule)',
                  color: form.tier === tier ? 'var(--bg)' : 'var(--muted)',
                }}
                aria-pressed={form.tier === tier}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-5 w-full py-4">
        {saved ? 'Added' : 'Add to My Words'}
      </button>
    </form>
  );
}
