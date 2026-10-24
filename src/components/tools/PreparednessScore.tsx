import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Trash2 } from 'lucide-react';
import {
  ANSWER_LABELS,
  CATEGORIES,
  calculateScore,
  categoryComplete,
  emptyAnswers,
  isAnswer,
  parseSavedScore,
  scoreSummaryText,
  type Answer,
  type Answers,
  type SavedScore,
} from '../../lib/calculators/preparedness';
import { ToolActions, removeStorage } from './ui';

const RESULT_KEY = 'stayprepped:preparedness-score:v1';
const ANSWERS: Answer[] = [0, 1, 2, 3];

export default function PreparednessScore() {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<SavedScore | null>(null);
  const [view, setView] = useState<'quiz' | 'result'>('quiz');
  const [showMissing, setShowMissing] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Load the last saved result, if any.
  useEffect(() => {
    try {
      const s = parseSavedScore(window.localStorage.getItem(RESULT_KEY));
      if (s) {
        setSaved(s);
        setAnswers(s.answers);
        setView('result');
      }
    } catch {
      setStorageOk(false);
    }
  }, []);

  // Move focus to the step heading when the step or view changes (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, view]);

  const cat = CATEGORIES[step];
  const isLast = step === CATEGORIES.length - 1;
  const complete = categoryComplete(answers, cat.id);

  const choose = (qi: number, v: Answer) => {
    setAnswers((a) => {
      const next = { ...a, [cat.id]: [...a[cat.id]] };
      next[cat.id][qi] = v;
      return next;
    });
  };

  const next = () => {
    if (!complete) {
      setShowMissing(true);
      return;
    }
    setShowMissing(false);
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  const finish = () => {
    const record: SavedScore = { v: 1, savedAt: new Date().toISOString(), answers };
    try {
      window.localStorage.setItem(RESULT_KEY, JSON.stringify(record));
      setStorageOk(true);
    } catch {
      setStorageOk(false);
    }
    setSaved(record);
    setView('result');
  };

  const restart = () => {
    setAnswers(emptyAnswers());
    setStep(0);
    setView('quiz');
    setShowMissing(false);
  };

  const clearResult = () => {
    removeStorage(RESULT_KEY);
    setSaved(null);
    restart();
  };

  if (view === 'result') {
    const r = calculateScore(answers);
    return (
      <section className="panel results grid gap-7" aria-labelledby="score-result-title">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="score-result-title" ref={headingRef} tabIndex={-1} className="text-xl">
            Your preparedness score
          </h2>
          <ToolActions textFile={{ name: 'preparedness-score.txt', content: () => scoreSummaryText(r) }} />
        </div>

        <div aria-live="polite" className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <p className="stat">
            <span className="stat-value" style={{ fontSize: 'clamp(3rem, 2rem + 5vw, 5rem)' }}>
              {r.overall}
              <span className="muted" style={{ fontSize: '0.4em' }}>
                {' '}
                / 100
              </span>
            </span>
          </p>
          <div className="measure">
            <p className="font-head text-2xl font-bold">{r.band.label}</p>
            <p>{r.band.summary}</p>
          </div>
        </div>
        {saved && (
          <p className="field-help">
            {storageOk
              ? `Saved on this device on ${new Date(saved.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Only you can see it.`
              : 'Your browser blocked saving, so this result will be lost when you leave the page.'}
          </p>
        )}

        <div>
          <h3 className="mb-3">By category</h3>
          <ul className="grid gap-3">
            {r.categories.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(8rem,12rem)_1fr_3.5rem] items-center gap-3">
                <span>{c.label}</span>
                <span className="bar" aria-hidden="true">
                  <span style={{ width: `${c.score * 10}%` }} />
                </span>
                <span className="text-right tabular-nums">
                  {c.score.toFixed(1)}
                  <span className="sr-only"> out of 10</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2">Your strengths</h3>
            {r.strengths.length ? (
              <ul className="grid gap-2">
                {r.strengths.map((s) => (
                  <li key={s.id} className="flex gap-2">
                    <Check size={20} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
                    <span>
                      <strong>{s.label}</strong> ({s.score.toFixed(1)}/10)
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No strengths yet. That is fine; everyone starts somewhere.</p>
            )}
          </div>
          <div>
            <h3 className="mb-2">Your biggest gaps, and one next step each</h3>
            {r.gaps.length ? (
              <ol className="grid gap-4" style={{ listStyle: 'decimal', paddingLeft: '1.3rem' }}>
                {r.gaps.map((g) => (
                  <li key={g.id}>
                    <strong>{g.label}</strong> ({g.score.toFixed(1)}/10)
                    <p>{g.nextStep}</p>
                    <p className="mt-1 flex flex-wrap gap-x-4">
                      {g.links.map((l) => (
                        <a key={l.href} href={l.href}>
                          {l.label}
                        </a>
                      ))}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No gaps: you answered yes to everything. Keep your supplies rotated.</p>
            )}
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-2 border-t border-rule pt-5">
          <button type="button" className="btn btn-secondary" onClick={() => { setStep(0); setView('quiz'); }}>
            <ArrowLeft size={18} aria-hidden="true" /> Review my answers
          </button>
          <button type="button" className="btn btn-ghost" onClick={restart}>
            <RotateCcw size={18} aria-hidden="true" /> Start again
          </button>
          {saved && (
            <button type="button" className="btn btn-ghost" onClick={clearResult}>
              <Trash2 size={18} aria-hidden="true" /> Clear my result
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="panel grid gap-6" aria-labelledby="score-step-title">
      <nav aria-label="Score categories" className="no-print">
        <ol className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c, i) => {
            const done = categoryComplete(answers, c.id);
            const reachable = i <= step || CATEGORIES.slice(0, i).every((p) => categoryComplete(answers, p.id));
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    minHeight: '2rem',
                    padding: '0.15rem 0.6rem',
                    background: i === step ? 'var(--primary)' : done ? 'var(--surface-2)' : 'transparent',
                    color: i === step ? 'var(--primary-ink)' : 'var(--text)',
                    borderColor: i === step ? 'var(--primary)' : 'var(--rule)',
                  }}
                  aria-current={i === step ? 'step' : undefined}
                  disabled={!reachable}
                  onClick={() => {
                    setShowMissing(false);
                    setStep(i);
                  }}
                >
                  {done && i !== step && <Check size={14} aria-hidden="true" />}
                  {c.label}
                  {done && <span className="sr-only"> (answered)</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div>
        <p className="muted">
          Category {step + 1} of {CATEGORIES.length}
        </p>
        <h2 id="score-step-title" ref={headingRef} tabIndex={-1} className="text-2xl">
          {cat.label}
        </h2>
      </div>

      <div className="grid gap-6">
        {cat.questions.map((q, qi) => {
          const val = answers[cat.id][qi];
          const missing = showMissing && !isAnswer(val);
          return (
            <fieldset key={qi} aria-describedby={missing ? `q-${cat.id}-${qi}-err` : undefined}>
              <legend style={{ fontWeight: 400 }}>
                <span className="font-bold">{q}</span>
              </legend>
              <div className="choice-row mt-1">
                {ANSWERS.map((a) => (
                  <label key={a} className="choice">
                    <input type="radio" name={`q-${cat.id}-${qi}`} value={a} checked={val === a} onChange={() => choose(qi, a)} />
                    <span>{ANSWER_LABELS[a]}</span>
                  </label>
                ))}
              </div>
              {missing && (
                <p id={`q-${cat.id}-${qi}-err`} className="field-error mt-1">
                  Choose an answer for this question.
                </p>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-rule pt-5">
        <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ArrowLeft size={18} aria-hidden="true" /> Back
        </button>
        <button type="button" className={isLast ? 'btn btn-primary' : 'btn btn-secondary'} onClick={next}>
          {isLast ? 'See my score' : 'Next category'} {!isLast && <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </div>
      {showMissing && !complete && (
        <p className="field-error" role="alert">
          Answer all three questions to continue. If you are unsure, choose the closest option.
        </p>
      )}
      {saved && (
        <p className="field-help">
          You have a saved result.{' '}
          <button type="button" className="underline" style={{ color: 'var(--link)' }} onClick={() => { setAnswers(saved.answers); setView('result'); }}>
            View my saved result
          </button>
        </p>
      )}
    </section>
  );
}
