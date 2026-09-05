'use client';

import { assessmentAttemptResponseSchema, type Assessment, type AssessmentAttemptResponse } from '@edukriti/contracts';
import { ArrowLeft, ArrowRight, Check, CircleX, Loader2, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export function AssessmentPlayer({ assessment, lessonTitle }: { assessment: Assessment; lessonTitle: string }) {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, AssessmentAttemptResponse>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');
  const requestIds = useRef<Record<string, string>>({});
  const question = assessment.questions[questionIndex]!;
  const result = results[question.id];
  const answer = answers[question.id] ?? '';
  const isLast = questionIndex === assessment.questions.length - 1;
  const progress = Math.round(((questionIndex + (result ? 1 : 0)) / assessment.questions.length) * 100);

  const changeAnswer = (value: string) => {
    setAnswers((current) => ({ ...current, [question.id]: value }));
    delete requestIds.current[question.id];
    setError('');
  };

  const submit = async () => {
    if (!answer.trim()) { setError('Choose or enter an answer first.'); return; }
    const clientRequestId = requestIds.current[question.id] ?? crypto.randomUUID();
    requestIds.current[question.id] = clientRequestId;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: assessment.lessonId, questionId: question.id, response: answer, clientRequestId }) });
      if (!response.ok) throw new Error('Your answer could not be saved. Please retry.');
      const evaluation = assessmentAttemptResponseSchema.parse(await response.json());
      setResults((current) => ({ ...current, [question.id]: evaluation }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your answer could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    setError('');
    try {
      const response = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: assessment.lessonId }) });
      if (!response.ok) throw new Error('Your learning report could not be created.');
      router.push(`/lessons/${assessment.lessonId}/report`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your report could not be created.');
      setFinishing(false);
    }
  };

  return <main className="min-h-screen bg-[#f5f7fb] px-5 py-7 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4"><a href={`/lessons/${assessment.lessonId}/classroom`} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition hover:bg-slate-100"><ArrowLeft className="size-4" /> Back to classroom</a><Badge className="bg-indigo-100 text-indigo-700">Final assessment</Badge></div>
      <header className="mt-6 rounded-[28px] bg-[#14213d] p-6 text-white shadow-xl sm:p-8"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-amber-300 text-slate-950"><Sparkles className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-sky-300">Show what you learned</p><h1 className="mt-1 font-heading text-2xl font-bold">{lessonTitle}</h1></div></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between text-xs text-white/55"><span>Question {questionIndex + 1} of {assessment.questions.length}</span><span>{progress}% complete</span></div></header>

      <section className="mt-5 rounded-[28px] border bg-white p-6 shadow-[0_16px_55px_rgb(30_42_70/8%)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">{question.type === 'mcq' ? 'Choose one answer' : 'Explain in your own words'}</p>
        <h2 className="mt-3 font-heading text-2xl font-bold leading-snug">{question.prompt}</h2>
        {question.type === 'mcq' && question.choices ? <div className="mt-6 grid gap-3">{question.choices.map((choice) => <button key={choice.id} type="button" disabled={Boolean(result)} onClick={() => changeAnswer(choice.id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left text-sm font-medium transition ${answer === choice.id ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100' : 'hover:border-indigo-200 hover:bg-slate-50'} disabled:cursor-default`}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold uppercase ${answer === choice.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{choice.id}</span>{choice.text}</button>)}</div> : <Textarea value={answer} disabled={Boolean(result)} onChange={(event) => changeAnswer(event.target.value)} placeholder="Write a clear two or three sentence answer…" className="mt-6 min-h-32" />}

        {result && <div className={`mt-6 rounded-2xl border p-5 ${result.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-orange-200 bg-orange-50 text-orange-950'}`}><div className="flex items-center gap-2 font-bold">{result.isCorrect ? <Check className="size-5 text-emerald-600" /> : <CircleX className="size-5 text-orange-600" />}{result.isCorrect ? 'Correct' : 'Review needed'}</div><p className="mt-2 text-sm leading-6 opacity-80">{result.feedback}</p></div>}
        {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-7 flex justify-end">{!result ? <button type="button" onClick={submit} disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Check answer</button> : isLast ? <button type="button" onClick={finish} disabled={finishing} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{finishing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Create my report</button> : <button type="button" onClick={() => { setQuestionIndex((index) => index + 1); setError(''); }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700">Next question <ArrowRight className="size-4" /></button>}</div>
      </section>
    </div>
  </main>;
}
