'use client';

import type { LessonPlan } from '@edukriti/contracts';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleStop,
  GitBranch,
  Lightbulb,
  Target,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function isWeakConcept(title: string, weakConcepts: string[]) {
  const normalizedTitle = title.toLowerCase();
  return weakConcepts.some((concept) => {
    const normalizedConcept = concept.toLowerCase();
    return (
      normalizedConcept.includes(normalizedTitle) ||
      normalizedTitle.includes(normalizedConcept)
    );
  });
}

export function ConceptMap({
  plan,
  weakConcepts,
}: {
  plan: LessonPlan;
  weakConcepts: string[];
}) {
  const [selectedId, setSelectedId] = useState(plan.segments[0]!.id);
  const [speaking, setSpeaking] = useState(false);
  const selectedIndex = plan.segments.findIndex(
    (segment) => segment.id === selectedId,
  );
  const selected = plan.segments[Math.max(0, selectedIndex)]!;
  const selectedIsWeak = isWeakConcept(selected.title, weakConcepts);
  const path = useMemo(
    () => plan.segments.slice(0, Math.max(0, selectedIndex) + 1),
    [plan.segments, selectedIndex],
  );

  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    [],
  );

  function toggleSpeech() {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selected.narration);
    utterance.lang = plan.language === 'hindi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
      <section className="overflow-hidden rounded-[28px] border bg-white p-6 shadow-[0_16px_55px_rgb(30_42_70/8%)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
              Visual learning path
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold">
              How the concepts connect
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-indigo-500" /> Core concept</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-500" /> Needs practice</span>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-5 text-center">
          <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-indigo-600 text-white">
            <GitBranch className="size-5" />
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">Lesson goal</p>
          <h3 className="mt-1 font-heading text-xl font-bold">{plan.title}</h3>
        </div>

        <div className="mx-auto h-8 w-px bg-gradient-to-b from-indigo-300 to-slate-200" />

        <div className="grid gap-3">
          {plan.segments.map((segment, index) => {
            const active = segment.id === selected.id;
            const weak = isWeakConcept(segment.title, weakConcepts);
            return (
              <div key={segment.id}>
                <button
                  type="button"
                  onClick={() => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    setSpeaking(false);
                    setSelectedId(segment.id);
                  }}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${active ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : weak ? 'border-amber-300 bg-amber-50 hover:border-amber-400' : 'bg-white hover:border-indigo-200 hover:bg-slate-50'}`}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-2xl font-heading text-sm font-bold ${weak ? 'bg-amber-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-base font-bold">{segment.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">{segment.objective}</span>
                  </span>
                  {weak ? <Target className="size-5 shrink-0 text-amber-600" /> : <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />}
                </button>
                {index < plan.segments.length - 1 && (
                  <div className="flex h-8 items-center justify-center" aria-hidden="true">
                    <ArrowRight className="size-4 rotate-90 text-indigo-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <section className="rounded-[28px] bg-[#15223f] p-6 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize text-sky-200">
              {selected.visualType.replace('_', ' ')} concept
            </span>
            {selectedIsWeak && <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-slate-950">Focus area</span>}
          </div>
          <h2 className="mt-5 font-heading text-2xl font-bold">{selected.title}</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">{selected.narration}</p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-300"><Lightbulb className="size-4" /> Visual explanation</div>
            <p className="mt-2 text-sm leading-6 text-white/65">{selected.visualBrief}</p>
          </div>
          {selected.checkpoint && (
            <div className="mt-4 rounded-2xl bg-sky-400/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-300">Check yourself</p>
              <p className="mt-2 text-sm leading-6 text-white/75">{selected.checkpoint.prompt}</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSpeech}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#15223f] transition hover:bg-sky-50"
          >
            {speaking ? <CircleStop className="size-4" /> : <Volume2 className="size-4" />}
            {speaking ? 'Stop explanation' : 'Hear this concept'}
          </button>
        </section>

        <section className="rounded-[24px] border bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">Prerequisite path</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {path.map((segment, index) => (
              <div key={segment.id} className="contents">
                <button type="button" onClick={() => setSelectedId(segment.id)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${segment.id === selected.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>{segment.title}</button>
                {index < path.length - 1 && <ArrowRight className="size-3 text-indigo-300" />}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Earlier concepts build the foundation for the selected idea.</p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <a href={`/lessons/${plan.id}/practice`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-bold text-amber-950 transition hover:bg-amber-300"><Target className="size-4" /> Practice concepts</a>
          <a href={`/lessons/${plan.id}/classroom`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold transition hover:bg-slate-50"><BookOpen className="size-4" /> Open classroom</a>
        </div>
      </aside>
    </div>
  );
}
