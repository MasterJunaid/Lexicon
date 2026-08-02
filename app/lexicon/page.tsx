'use client';

import { useMemo, useState } from 'react';
import { Empty, PageHeader } from '@/components/Bits';
import EntryRow from '@/components/EntryRow';
import { PlusIcon, TrashIcon } from '@/components/Icons';
import MyWordForm from '@/components/MyWordForm';
import { useStore } from '@/lib/store';

type Tab = 'saved' | 'collections' | 'mine';

export default function LexiconPage() {
  const {
    state,
    byId,
    ready,
    createCollection,
    deleteCollection,
    toggleInCollection,
    deleteMyWord,
  } = useStore();
  const [tab, setTab] = useState<Tab>('saved');
  const [query, setQuery] = useState('');
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const savedItems = useMemo(
    () =>
      state.saved
        .map((id) => byId.get(id))
        .filter((i): i is NonNullable<typeof i> => Boolean(i))
        .filter((i) =>
          query
            ? `${i.entry.word} ${i.entry.definition}`.toLowerCase().includes(query.toLowerCase())
            : true
        ),
    [state.saved, byId, query]
  );

  const myItems = useMemo(
    () =>
      state.myWords
        .map((w) => byId.get(w.id))
        .filter((i): i is NonNullable<typeof i> => Boolean(i)),
    [state.myWords, byId]
  );

  if (!ready) return <main className="min-h-[100dvh]" />;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'saved', label: 'Saved', count: state.saved.length },
    { id: 'collections', label: 'Collections', count: state.collections.length },
    { id: 'mine', label: 'My Words', count: state.myWords.length },
  ];

  return (
    <main className="pad-nav min-h-[100dvh]">
      <PageHeader kicker="Your lexicon" title="Kept words." />

      <div className="mx-auto max-w-lg px-5">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex-1 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors"
              style={{
                backgroundColor: tab === t.id ? 'var(--ink)' : 'var(--surface)',
                borderColor: tab === t.id ? 'var(--ink)' : 'var(--rule)',
                color: tab === t.id ? 'var(--bg)' : 'var(--muted)',
              }}
              aria-pressed={tab === t.id}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums opacity-70">{t.count}</span>
            </button>
          ))}
        </div>

        {tab === 'saved' ? (
          <div className="mt-5">
            {state.saved.length ? (
              <>
                <input
                  className="field mb-4"
                  placeholder="Search saved words"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search saved words"
                />
                <ul className="space-y-2.5">
                  {savedItems.map((item) => (
                    <EntryRow
                      key={item.entry.id}
                      item={item}
                      action={
                        state.collections.length ? (
                          <select
                            className="field h-9 w-auto py-0 text-[12px]"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                toggleInCollection(e.target.value, item.entry.id);
                                e.target.value = '';
                              }
                            }}
                            aria-label={`Add ${item.entry.word} to a collection`}
                          >
                            <option value="">Add to…</option>
                            {state.collections.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.entryIds.includes(item.entry.id) ? '✓ ' : ''}
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : null
                      }
                    />
                  ))}
                </ul>
              </>
            ) : (
              <Empty
                title="Nothing saved yet"
                body="Heart a word anywhere in the app and it lands here — and in your review queue."
              />
            )}
          </div>
        ) : null}

        {tab === 'collections' ? (
          <div className="mt-5 space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!newName.trim()) return;
                createCollection(newName.trim());
                setNewName('');
              }}
            >
              <input
                className="field"
                placeholder="New collection — e.g. Q4 memo words"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                aria-label="New collection name"
              />
              <button type="submit" className="btn btn-primary shrink-0 px-4" aria-label="Create collection">
                <PlusIcon size={18} />
              </button>
            </form>

            {state.collections.length ? (
              <ul className="space-y-3">
                {state.collections.map((collection) => {
                  const open = openCollection === collection.id;
                  const entries = collection.entryIds
                    .map((id) => byId.get(id))
                    .filter((i): i is NonNullable<typeof i> => Boolean(i));
                  return (
                    <li key={collection.id} className="card-surface rounded-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setOpenCollection(open ? null : collection.id)}
                        >
                          <p className="display text-[20px]">{collection.name}</p>
                          <p className="text-[12px]" style={{ color: 'var(--faint)' }}>
                            {entries.length} word{entries.length === 1 ? '' : 's'}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCollection(collection.id)}
                          aria-label={`Delete ${collection.name}`}
                          style={{ color: 'var(--faint)' }}
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      {open ? (
                        entries.length ? (
                          <ul className="mt-3 space-y-2.5">
                            {entries.map((item) => (
                              <EntryRow
                                key={item.entry.id}
                                item={item}
                                action={
                                  <button
                                    type="button"
                                    className="text-[12px] underline"
                                    style={{ color: 'var(--faint)' }}
                                    onClick={() =>
                                      toggleInCollection(collection.id, item.entry.id)
                                    }
                                  >
                                    Remove
                                  </button>
                                }
                              />
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-[13px]" style={{ color: 'var(--faint)' }}>
                            Empty. Add words from the Saved tab.
                          </p>
                        )
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty
                title="No collections"
                body="Group saved words however you like — by memo, by book, by whatever you're writing this week."
              />
            )}
          </div>
        ) : null}

        {tab === 'mine' ? (
          <div className="mt-5 space-y-4">
            <MyWordForm />
            {myItems.length ? (
              <ul className="space-y-2.5">
                {myItems.map((item) => (
                  <EntryRow
                    key={item.entry.id}
                    item={item}
                    action={
                      <button
                        type="button"
                        className="ml-auto flex items-center gap-1 text-[12px]"
                        style={{ color: 'var(--faint)' }}
                        onClick={() => deleteMyWord(item.entry.id)}
                      >
                        <TrashIcon size={16} />
                        Delete
                      </button>
                    }
                  />
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
