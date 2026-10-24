'use client';

import type { LessonPlan } from '@edukriti/contracts';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  HelpCircle,
  Layers3,
  NotebookTabs,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function shortNote(text: string) {
  return text.length > 260 ? `${text.slice(0, 257).trim()}...` : text;
}

export function RevisionStudio({ plan }: { plan: LessonPlan }) {
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<number | 'all'>('all');
  const [completedPrompts, setCompletedPrompts] = useState<Record<string, boolean>>({});

  const spacedItems = useMemo(() => {
    if (plan.spacedRevision && plan.spacedRevision.length > 0) {
      return plan.spacedRevision;
    }
    // Fallback if spacedRevision was not populated
    return plan.segments.flatMap((segment, i) => [
      {
        intervalDays: 1 as const,
        concept: segment.title,
        prompt: `Day 1 Recall: Explain ${segment.title} without looking at notes.`,
        format: 'concept_check' as const,
      },
      {
        intervalDays: (i % 2 === 0 ? 3 : 7) as 3 | 7,
        concept: segment.title,
        prompt: `Application: How does ${segment.title} apply in everyday life?`,
        format: 'quick_problem' as const,
      },
      {
        intervalDays: 14 as const,
        concept: segment.title,
        prompt: `Retention Check: What is the most common mistake made in ${segment.title}?`,
        format: 'flashcard' as const,
      },
    ]);
  }, [plan.spacedRevision, plan.segments]);

  const filteredSpacedItems = useMemo(() => {
    if (selectedInterval === 'all') return spacedItems;
    return spacedItems.filter((item) => item.intervalDays === selectedInterval);
  }, [spacedItems, selectedInterval]);

  const flashcards = useMemo(() => {
    return plan.segments.map((segment) => ({
      front: segment.checkpoint?.prompt ?? `Explain ${segment.title} in your own words.`,
      back: segment.narration,
      concept: segment.title,
    }));
  }, [plan.segments]);

  const studyDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    if (index === 5) return { title: 'Mixed recall practice', task: `Review all ${plan.segments.length} concepts, then answer every checkpoint without notes.` };
    if (index === 6) return { title: 'Final check and next step', task: 'Take the final assessment, review weak concepts, and create your recommended next lesson from the learning report.' };
    const segment = plan.segments[index % plan.segments.length]!;
    return {
      title: index >= plan.segments.length ? `Revisit: ${segment.title}` : segment.title,
      task: index >= plan.segments.length ? `Recall the idea from memory, then compare with your notes and create one new example.` : `${segment.objective} Practice with the checkpoint or one self-made example.`,
    };
  }), [plan]);

  function toggleCompleted(key: string) {
    setCompletedPrompts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function downloadNotes() {
    const content = [
      plan.title,
      '='.repeat(plan.title.length),
      '',
      'LEARNING OBJECTIVES',
      ...plan.objectives.map((objective, index) => `${index + 1}. ${objective}`),
      '',
      'REVISION NOTES',
      ...plan.segments.flatMap((segment, index) => [
        `--- Segment ${index + 1}: ${segment.title} ---`,
        `Objective: ${segment.objective}`,
        `Summary: ${segment.narration}`,
        segment.checkpoint ? `Checkpoint Question: ${segment.checkpoint.prompt}` : '',
        '',
      ]).filter(Boolean),
      'SPACED REPETITION SCHEDULE (1, 3, 7, 14 Days)',
      ...spacedItems.map((item, index) =>
        `[Day ${item.intervalDays}] [${item.format.toUpperCase()}] ${item.concept}: ${item.prompt}`
      ),
      '',
      'NEXT STEP',
      'Take the final assessment and check your personalized learning report.',
    ].join('\n');

    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'edukriti'}-revision-notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const card = flashcards[cardIndex]!;

  return (
    <Tabs defaultValue="spaced" className="mt-7">
      <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-white p-1.5 shadow-sm">
        <TabsTrigger value="spaced" className="min-h-10 px-4">
          <Clock className="size-4" /> Spaced Revision (1d, 3d, 7d, 14d)
        </TabsTrigger>
        <TabsTrigger value="notes" className="min-h-10 px-4">
          <NotebookTabs className="size-4" /> Smart notes
        </TabsTrigger>
        <TabsTrigger value="flashcards" className="min-h-10 px-4">
          <Layers3 className="size-4" /> Flashcards
        </TabsTrigger>
        <TabsTrigger value="planner" className="min-h-10 px-4">
          <CalendarDays className="size-4" /> 7-day plan
        </TabsTrigger>
      </TabsList>

      {/* Spaced Revision Tab */}
      <TabsContent value="spaced" className="mt-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                <Zap className="size-3" /> Cognitive Spaced Retention
              </span>
              <span className="text-xs text-muted-foreground">
                Tied to Concept Knowledge Graph
              </span>
            </div>
            <h2 className="mt-1 font-heading text-2xl font-bold">Scientific Spaced Revision</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Review concepts at 1, 3, 7, and 14 day intervals to flatten the forgetting curve.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadNotes}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Download className="size-4" /> Download Schedule & Notes
          </button>
        </div>

        {/* Interval filter buttons */}
        <div className="flex flex-wrap gap-2">
          {(['all', 1, 3, 7, 14] as const).map((interval) => {
            const isSelected = selectedInterval === interval;
            const count = interval === 'all'
              ? spacedItems.length
              : spacedItems.filter((i) => i.intervalDays === interval).length;
            return (
              <button
                key={String(interval)}
                type="button"
                onClick={() => setSelectedInterval(interval)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 border hover:bg-slate-50'
                }`}
              >
                {interval === 'all' ? 'All Intervals' : `Day ${interval}`}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List of prompts */}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {filteredSpacedItems.map((item, idx) => {
            const key = `${item.intervalDays}-${item.concept}-${idx}`;
            const isDone = Boolean(completedPrompts[key]);
            const badgeColor =
              item.intervalDays === 1
                ? 'bg-amber-100 text-amber-800'
                : item.intervalDays === 3
                ? 'bg-blue-100 text-blue-800'
                : item.intervalDays === 7
                ? 'bg-purple-100 text-purple-800'
                : 'bg-emerald-100 text-emerald-800';

            return (
              <div
                key={key}
                className={`flex flex-col justify-between rounded-[22px] border p-5 shadow-sm transition ${
                  isDone ? 'border-emerald-200 bg-emerald-50/50 opacity-80' : 'bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold ${badgeColor}`}>
                      Day {item.intervalDays} Revisit
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {item.format.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="mt-3 font-heading text-base font-bold text-slate-900">
                    {item.concept}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {item.prompt}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="size-3.5" /> Self-test recall
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCompleted(key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    {isDone ? 'Mastered' : 'Mark Reviewed'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </TabsContent>

      {/* Smart Notes Tab */}
      <TabsContent value="notes" className="mt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold">Automatic revision notes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Key ideas from your personalized teaching sequence.</p>
          </div>
          <button
            type="button"
            onClick={downloadNotes}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Download className="size-4" /> Download notes
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {plan.segments.map((segment, index) => (
            <article key={segment.id} className="rounded-[22px] border bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold">{segment.title}</h3>
                  <p className="mt-1 text-sm font-medium text-primary">{segment.objective}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{shortNote(segment.narration)}</p>
              {segment.checkpoint && (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                  <strong>Recall:</strong> {segment.checkpoint.prompt}
                </p>
              )}
            </article>
          ))}
        </div>
      </TabsContent>

      {/* Flashcards Tab */}
      <TabsContent value="flashcards" className="mt-5">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>Card {cardIndex + 1} of {flashcards.length}</span>
            <span className="font-medium text-slate-800">{card.concept}</span>
          </div>
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            className={`grid min-h-72 w-full place-items-center rounded-[28px] border p-8 text-center shadow-lg transition ${
              revealed
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-700 text-white'
            }`}
          >
            <div>
              <p className={`text-xs font-bold uppercase tracking-[0.14em] ${revealed ? 'text-emerald-700' : 'text-white/60'}`}>
                {revealed ? 'Answer' : 'Question — tap to reveal'}
              </p>
              <p className="mt-5 font-heading text-xl font-bold leading-8 sm:text-2xl">
                {revealed ? card.back : card.front}
              </p>
            </div>
          </button>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setCardIndex((index) => (index - 1 + flashcards.length) % flashcards.length);
                setRevealed(false);
              }}
              className="h-10 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setRevealed(false)}
              className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white"
              aria-label="Hide flashcard answer"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCardIndex((index) => (index + 1) % flashcards.length);
                setRevealed(false);
              }}
              className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Next card
            </button>
          </div>
        </div>
      </TabsContent>

      {/* 7-Day Plan Tab */}
      <TabsContent value="planner" className="mt-5">
        <div className="mb-5">
          <h2 className="font-heading text-2xl font-bold">Your 7-day learning plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">Short daily sessions that move from learning to recall and assessment.</p>
        </div>
        <ol className="grid gap-3">
          {studyDays.map((day, index) => (
            <li key={`${day.title}-${index}`} className="flex gap-4 rounded-[20px] border bg-white p-5">
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-2xl font-heading font-bold ${
                  index === 6 ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Day {index + 1}</p>
                <h3 className="mt-1 font-heading text-lg font-bold">{day.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{day.task}</p>
              </div>
              {index === 6 && <CheckCircle2 className="ml-auto size-5 shrink-0 text-emerald-500" />}
            </li>
          ))}
        </ol>
      </TabsContent>
    </Tabs>
  );
}
