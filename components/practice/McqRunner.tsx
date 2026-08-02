'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import type { Question } from '@/lib/practice';
import type { PracticeMode } from '@/lib/types';
import { PracticeResult, PracticeShell } from './Shell';

interface Props {
  mode: PracticeMode;
  title: string;
  build: (seed: number) => Question[];
  /** Seconds. Omit for an untimed round. */
  timeLimit?: number;
  /** Scored as the count of correct answers by default. */
  scoreUnit?: string;
}

export default function McqRunner({ mode, title, build, timeLimit, scoreUnit }: Props) {
  const { state, queueForReview, logPractice } = useStore();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const questions = useMemo(() => build(seed), [build, seed]);

  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<{ word: string; definition: string }[]>([]);
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState(timeLimit ?? 0);

  const finish = useCallback(
    (finalScore: number) => {
      setDone(true);
      logPractice(mode, finalScore);
    },
    [logPractice, mode]
  );

  useEffect(() => {
    if (!timeLimit || done) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timeLimit, done]);

  useEffect(() => {
    if (timeLimit && remaining === 0 && !done) finish(score);
  }, [remaining, timeLimit, done, finish, score]);

  const question = questions[index];

  const advance = useCallback(
    (nextScore: number) => {
      if (index + 1 >= questions.length) {
        finish(nextScore);
        return;
      }
      setIndex((i) => i + 1);
      setChoice(null);
    },
    [index, questions.length, finish]
  );

  const answer = (option: number) => {
    if (choice !== null || !question) return;
    setChoice(option);
    const correct = option === question.answer;
    const nextScore = correct ? score + 1 : score;
    if (correct) {
      setScore(nextScore);
    } else {
      queueForReview(question.entryId);
      const [word, definition] = question.promptIsWord
        ? [question.prompt, question.reveal]
        : [question.options[question.answer], question.prompt];
      setMissed((m) =>
        m.some((x) => x.word === word) ? m : [...m, { word, definition }]
      );
    }
    window.setTimeout(() => advance(nextScore), correct ? 520 : 1150);
  };

  const restart = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setIndex(0);
    setChoice(null);
    setScore(0);
    setMissed([]);
    setDone(false);
    setRemaining(timeLimit ?? 0);
  };

  if (!questions.length) {
    return (
      <PracticeShell title={title} progress={0}>
        <div className="flex flex-1 items-center justify-center text-sm" style={{ color: 'var(--muted)' }}>
          Building a round…
        </div>
      </PracticeShell>
    );
  }

  if (done) {
    return (
      <PracticeShell title={title} progress={1}>
        <PracticeResult
          score={score}
          total={timeLimit ? Math.max(score, index) : questions.length}
          best={state.highScores[mode]}
          unit={scoreUnit}
          onRetry={restart}
          missed={missed}
        />
      </PracticeShell>
    );
  }

  const progress = timeLimit
    ? 1 - remaining / timeLimit
    : index / questions.length;

  return (
    <PracticeShell
      title={title}
      progress={progress}
      right={
        timeLimit ? (
          <span style={{ color: remaining <= 10 ? 'var(--accent)' : 'var(--ink)' }}>
            {remaining}s
          </span>
        ) : (
          <span>
            {index + 1}/{questions.length}
          </span>
        )
      }
    >
      <div key={question.key} className="flex flex-1 flex-col animate-fadeIn">
        <div className="flex flex-1 flex-col justify-center py-6">
          <p className="kicker mb-4">{question.kicker}</p>
          {question.promptIsWord ? (
            <h2
              className="display text-balance"
              style={{ fontSize: 'clamp(2.2rem, 11vw, 3.4rem)', lineHeight: 1 }}
              lang={question.lang}
            >
              {question.prompt}
            </h2>
          ) : (
            <p
              className="text-balance text-[21px] leading-[1.4]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {question.prompt}
            </p>
          )}
        </div>

        <div className="space-y-2.5 pb-4">
          {question.options.map((option, i) => {
            const isAnswer = i === question.answer;
            const picked = choice === i;
            const revealed = choice !== null;
            let background = 'var(--surface)';
            let border = 'var(--rule)';
            let color = 'var(--ink)';
            if (revealed && isAnswer) {
              background = 'color-mix(in srgb, var(--accent-2) 18%, var(--surface))';
              border = 'var(--accent-2)';
            } else if (revealed && picked) {
              background = 'color-mix(in srgb, var(--accent) 16%, var(--surface))';
              border = 'var(--accent)';
            } else if (revealed) {
              color = 'var(--faint)';
            }

            return (
              <button
                key={`${question.key}-${i}`}
                type="button"
                disabled={revealed}
                onClick={() => answer(i)}
                className={`w-full rounded-2xl border px-4 py-4 text-left text-[15px] leading-snug transition-all duration-200 active:scale-[0.99] ${
                  revealed && picked && !isAnswer ? 'animate-shake' : ''
                }`}
                style={{ backgroundColor: background, borderColor: border, color }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </PracticeShell>
  );
}
