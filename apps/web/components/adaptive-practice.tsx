'use client';

import type { LessonPlan } from '@edukriti/contracts';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  CircleX,
  Flame,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';

type PracticeQuestion = {
  id: string;
  concept: string;
  objective: string;
  explanation: string;
  choices: Array<{ id: string; text: string }>;
  correctId: string;
  isWeakFocus: boolean;
};

function matchesConcept(title: string, weakConcepts: string[]) {
  const normalized = title.toLowerCase();
  return weakConcepts.some((concept) => {
    const weak = concept.toLowerCase();
    return weak.includes(normalized) || normalized.includes(weak);
  });
}

function buildQuestions(plan: LessonPlan, weakConcepts: string[]) {
  const ordered = [...plan.segments].sort(
    (left, right) =>
      Number(matchesConcept(right.title, weakConcepts)) -
      Number(matchesConcept(left.title, weakConcepts)),
  );

  return ordered.map((segment, index): PracticeQuestion => {
    const distractors = ordered
      .filter((item) => item.id !== segment.id)
      .map((item) => item.objective)
      .slice(0, 2);
    const fallback = [
      'It is only a term to memorise and has no practical effect.',
      'It works independently from every other idea in the lesson.',
    ];
    const choiceTexts = [
      segment.objective,
      ...distractors,
      ...fallback,
    ].slice(0, 3);
    const correctPosition = (index + 1) % choiceTexts.length;
    const rotated = [
      ...choiceTexts.slice(-correctPosition),
      ...choiceTexts.slice(0, -correctPosition),
    ];
    const choices = rotated.map((text, choiceIndex) => ({
      id: String.fromCharCode(97 + choiceIndex),
      text,
    }));
    return {
      id: `${segment.id}-practice`,
      concept: segment.title,
      objective: segment.objective,
      explanation: segment.narration,
      choices,
      correctId: choices.find((choice) => choice.text === segment.objective)!.id,
      isWeakFocus: matchesConcept(segment.title, weakConcepts),
    };
  });
}

export function AdaptivePractice({
  plan,
  weakConcepts,
}: {
  plan: LessonPlan;
  weakConcepts: string[];
}) {
  const questions = useMemo(
    () => buildQuestions(plan, weakConcepts),
    [plan, weakConcepts],
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [supportMode, setSupportMode] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const question = questions[questionIndex]!;
  const complete = completedCount === questions.length;
  const mastery = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
  const difficulty = supportMode ? 'Support' : streak >= 2 ? 'Challenge' : 'Core';

  function checkAnswer() {
    if (!selected) {
      setError('Choose an answer first.');
      return;
    }
    const isCorrect = selected === question.correctId;
    setChecked(true);
    setLastCorrect(isCorrect);
    setError('');
    if (isCorrect) {
      setCorrectCount((value) => value + 1);
      setStreak((value) => value + 1);
      setSupportMode(false);
    } else {
      setStreak(0);
      setSupportMode(true);
    }
  }

  function retry() {
    setSelected('');
    setChecked(false);
    setRevealed(false);
    setError('');
  }

  function nextQuestion() {
    const nextCompleted = completedCount + 1;
    setCompletedCount(nextCompleted);
    setSelected('');
    setChecked(false);
    setRevealed(false);
    setError('');
    if (nextCompleted < questions.length) {
      setQuestionIndex((value) => value + 1);
    }
  }

  function restart() {
    setQuestionIndex(0);
    setSelected('');
    setChecked(false);
    setLastCorrect(false);
    setCorrectCount(0);
    setCompletedCount(0);
    setStreak(0);
    setSupportMode(false);
    setRevealed(false);
    setError('');
  }

  if (complete) {
    return (
      <section className="mt-7 rounded-[30px] border bg-white p-7 text-center shadow-[0_18px_60px_rgb(30_42_70/9%)] sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-700">
          <Sparkles className="size-7" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">
          Practice complete
        </p>
        <h2 className="mt-2 font-heading text-3xl font-bold">
          {mastery}% mastery
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {mastery >= 75
            ? 'You handled these concepts well. Try the final assessment or create a harder follow-up lesson.'
            : 'Aarohi found concepts worth revisiting. Repeat this set—the easier cues will help rebuild them step by step.'}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <RotateCcw className="size-4" /> Practice again
          </button>
          <a
            href={`/lessons/${plan.id}/assessment`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold transition hover:bg-slate-50"
          >
            Final assessment <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    );
  }

  const prompt =
    difficulty === 'Support'
      ? `Use the lesson clue: which statement matches ${question.concept}?`
      : difficulty === 'Challenge'
        ? `Which explanation would best teach ${question.concept} to another learner?`
        : `Which statement best explains ${question.concept}?`;

  return (
    <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="rounded-[28px] border bg-white p-6 shadow-[0_16px_55px_rgb(30_42_70/8%)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
            Question {questionIndex + 1} of {questions.length}
          </span>
          {question.isWeakFocus && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Target className="size-3.5" /> Focus from your report
            </span>
          )}
        </div>

        <h2 className="mt-5 font-heading text-2xl font-bold leading-snug">
          {prompt}
        </h2>
        {supportMode && (
          <p className="mt-3 flex gap-2 rounded-xl bg-sky-50 p-3 text-sm leading-6 text-sky-950">
            <Lightbulb className="mt-1 size-4 shrink-0 text-sky-600" />
            Hint: focus on the lesson objective, not just the definition.
          </p>
        )}

        <div className="mt-6 grid gap-3">
          {question.choices.map((choice) => {
            const chosen = selected === choice.id;
            const showCorrect = revealed && choice.id === question.correctId;
            return (
              <button
                key={choice.id}
                type="button"
                disabled={checked}
                onClick={() => {
                  setSelected(choice.id);
                  setError('');
                }}
                className={`flex items-center gap-4 rounded-2xl border p-4 text-left text-sm font-medium transition ${showCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-950' : chosen ? 'border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-100' : 'hover:border-indigo-200 hover:bg-slate-50'} disabled:cursor-default`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold uppercase ${showCorrect ? 'bg-emerald-600 text-white' : chosen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {choice.id}
                </span>
                {choice.text}
              </button>
            );
          })}
        </div>

        {checked && (
          <div className={`mt-6 rounded-2xl border p-5 ${lastCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-orange-200 bg-orange-50 text-orange-950'}`}>
            <div className="flex items-center gap-2 font-bold">
              {lastCorrect ? <Check className="size-5 text-emerald-600" /> : <CircleX className="size-5 text-orange-600" />}
              {lastCorrect ? 'Correct—difficulty will adapt up' : 'Not yet—Aarohi switched to support mode'}
            </div>
            <p className="mt-2 text-sm leading-6 opacity-80">
              {lastCorrect
                ? question.objective
                : revealed
                  ? question.explanation
                  : 'Try again with a clearer clue, or reveal the lesson explanation before moving on.'}
            </p>
          </div>
        )}
        {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-7 flex flex-wrap justify-end gap-3">
          {!checked && (
            <button type="button" onClick={checkAnswer} className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700">
              <Check className="size-4" /> Check answer
            </button>
          )}
          {checked && !lastCorrect && !revealed && (
            <>
              <button type="button" onClick={() => setRevealed(true)} className="h-11 rounded-xl border bg-white px-5 text-sm font-semibold transition hover:bg-slate-50">
                Reveal explanation
              </button>
              <button type="button" onClick={retry} className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                <RotateCcw className="size-4" /> Try with hint
              </button>
            </>
          )}
          {checked && (lastCorrect || revealed) && (
            <button type="button" onClick={nextQuestion} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              {questionIndex === questions.length - 1 ? 'See mastery result' : 'Next concept'} <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-[24px] bg-[#15223f] p-5 text-white shadow-lg">
          <BrainCircuit className="size-6 text-sky-300" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-white/55">Live adaptation</p>
          <h3 className="mt-2 font-heading text-xl font-bold">{difficulty} level</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {supportMode
              ? 'Aarohi added a clue after the last answer.'
              : streak >= 2
                ? 'Your correct streak unlocked a teaching challenge.'
                : 'Aarohi is checking your core understanding.'}
          </p>
        </section>
        <section className="rounded-[24px] border bg-white p-5">
          <Progress value={(completedCount / questions.length) * 100}>
            <ProgressLabel>Session progress</ProgressLabel>
            <ProgressValue>{completedCount}/{questions.length}</ProgressValue>
          </Progress>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-orange-50 p-3 text-sm font-semibold text-orange-900">
            <span className="inline-flex items-center gap-2"><Flame className="size-4 text-orange-500" /> Correct streak</span>
            <span>{streak}</span>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
            <span>Current mastery</span>
            <span>{mastery}%</span>
          </div>
        </section>
      </aside>
    </div>
  );
}
