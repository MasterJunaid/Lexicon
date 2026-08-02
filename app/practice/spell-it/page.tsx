'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SpeakButton } from '@/components/Bits';
import { NotEnoughWords, PracticeResult, PracticeShell } from '@/components/practice/Shell';
import { buildSpell, normalizeSpelling, practicePool } from '@/lib/practice';
import { speak } from '@/lib/speech';
import { useStore } from '@/lib/store';

const ROUND = 8;

export default function SpellItPage() {
  const { items, state, ready, queueForReview, logPractice } = useStore();
  const pool = useMemo(
    () => practicePool(items, state.seen, state.saved, state.srs),
    [items, state.seen, state.saved, state.srs]
  );

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const prompts = useMemo(() => buildSpell(pool, ROUND, seed), [pool, seed]);

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [verdict, setVerdict] = useState<'right' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<{ word: string; definition: string }[]>([]);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = prompts[index];

  useEffect(() => {
    if (!prompt || done) return;
    const id = window.setTimeout(() => {
      speak(prompt.word, prompt.lang, state.settings.speechRate);
      inputRef.current?.focus();
    }, 320);
    return () => window.clearTimeout(id);
  }, [prompt, done, state.settings.speechRate]);

  const restart = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1e9));
    setIndex(0);
    setValue('');
    setVerdict(null);
    setScore(0);
    setMissed([]);
    setDone(false);
  }, []);

  if (!ready) return <main className="min-h-[100dvh]" />;
  if (pool.length < 4) return <NotEnoughWords />;

  const submit = () => {
    if (!prompt || verdict) return;
    const correct = normalizeSpelling(value) === normalizeSpelling(prompt.word);
    setVerdict(correct ? 'right' : 'wrong');
    const nextScore = correct ? score + 1 : score;
    if (correct) {
      setScore(nextScore);
    } else {
      queueForReview(prompt.entryId);
      setMissed((m) => [...m, { word: prompt.word, definition: prompt.definition }]);
    }
    window.setTimeout(
      () => {
        if (index + 1 >= prompts.length) {
          setDone(true);
          logPractice('spell-it', nextScore);
          return;
        }
        setIndex((i) => i + 1);
        setValue('');
        setVerdict(null);
      },
      correct ? 700 : 1600
    );
  };

  if (done) {
    return (
      <PracticeShell title="Spell it" progress={1}>
        <PracticeResult
          score={score}
          total={prompts.length}
          best={state.highScores['spell-it']}
          onRetry={restart}
          missed={missed}
        />
      </PracticeShell>
    );
  }

  if (!prompt) {
    return (
      <PracticeShell title="Spell it" progress={0}>
        <div className="flex flex-1 items-center justify-center text-sm" style={{ color: 'var(--muted)' }}>
          Building a round…
        </div>
      </PracticeShell>
    );
  }

  return (
    <PracticeShell
      title="Spell it"
      progress={index / prompts.length}
      right={
        <span>
          {index + 1}/{prompts.length}
        </span>
      }
    >
      <div key={prompt.entryId} className="flex flex-1 flex-col animate-fadeIn">
        <div className="flex flex-1 flex-col justify-center py-6">
          <p className="kicker mb-4">Listen, then type it</p>
          <div className="mb-6">
            <SpeakButton text={prompt.word} lang={prompt.lang} label="Replay the word" />
          </div>
          <p
            className="text-balance text-[19px] leading-[1.45]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {prompt.definition}
          </p>
        </div>

        <div className="pb-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <input
              ref={inputRef}
              className="field text-center text-[22px]"
              style={{
                fontFamily: 'var(--font-display)',
                borderColor:
                  verdict === 'right'
                    ? 'var(--accent-2)'
                    : verdict === 'wrong'
                      ? 'var(--accent)'
                      : 'var(--rule)',
              }}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="type the word"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              disabled={verdict !== null}
              lang={prompt.lang}
              aria-label="Your spelling"
            />

            <div className="mt-3 h-6 text-center text-[14px]">
              {verdict === 'right' ? (
                <span style={{ color: 'var(--accent-2)' }}>Correct.</span>
              ) : verdict === 'wrong' ? (
                <span style={{ color: 'var(--accent)' }}>
                  It was <strong style={{ fontFamily: 'var(--font-display)' }}>{prompt.word}</strong>
                </span>
              ) : null}
            </div>

            <button
              type="submit"
              className="btn btn-primary mt-3 w-full py-4"
              disabled={!value.trim() || verdict !== null}
              style={{ opacity: !value.trim() || verdict !== null ? 0.5 : 1 }}
            >
              Check
            </button>
          </form>
        </div>
      </div>
    </PracticeShell>
  );
}
