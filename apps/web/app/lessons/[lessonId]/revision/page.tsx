import { lessonPlanGenerationResponseSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

import { RevisionStudio } from '@/components/revision-studio';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RevisionPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const row = env.DB ? await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(lessonId).first<{ planJson: string }>() : null;
  const parsed = row ? lessonPlanGenerationResponseSchema.safeParse(JSON.parse(row.planJson)) : null;
  if (!parsed?.success) return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md rounded-3xl border bg-card p-8 text-center"><BookOpen className="mx-auto size-8 text-primary" /><h1 className="mt-4 text-2xl font-bold">Revision studio unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Create a lesson first so Edukriti can prepare notes and flashcards.</p><a href="/lessons/new" className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Create lesson</a></div></main>;
  const plan = parsed.data.plan;
  return <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-foreground sm:px-8"><div className="mx-auto max-w-5xl"><a href={`/lessons/${lessonId}/classroom`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to classroom</a><header className="mt-6 overflow-hidden rounded-[30px] bg-[#15223f] p-7 text-white shadow-xl sm:p-9"><div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-300 text-slate-950"><Sparkles className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-300">Revision studio</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{plan.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Review concise notes, test your recall with flashcards, and follow a focused seven-day plan.</p></div></div><div className="mt-6 flex flex-wrap gap-3"><a href={`/lessons/${lessonId}/practice`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-200"><Sparkles className="size-4" /> Start adaptive practice</a><a href={`/lessons/${lessonId}/concept-map`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-bold text-white transition hover:bg-white/10"><BookOpen className="size-4" /> Open concept map</a></div></header><RevisionStudio plan={plan} /></div></main>;
}
