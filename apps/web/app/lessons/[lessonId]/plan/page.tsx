import { lessonPlanGenerationResponseSchema, type LessonPlan } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Code2, FileText, GitBranch, LineChart, Map, Sigma, Sparkles, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ShareLessonButton } from '@/components/share-lesson-button';

const visualIcons = {
  diagram: GitBranch,
  equation: Sigma,
  graph: LineChart,
  timeline: Clock3,
  map: Map,
  code: Code2,
  illustration: Sparkles,
  key_points: FileText,
} satisfies Record<LessonPlan['segments'][number]['visualType'], typeof Sparkles>;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonPlanPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const row = env.DB
    ? await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(lessonId).first<{ planJson: string }>()
    : null;
  const parsed = row ? lessonPlanGenerationResponseSchema.safeParse(JSON.parse(row.planJson)) : null;

  if (!parsed?.success) {
    return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md rounded-3xl border bg-card p-8 text-center"><BookOpen className="mx-auto size-8 text-primary" /><h1 className="mt-4 text-2xl font-bold">Lesson plan unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Create a new lesson so Edukriti can build a validated teaching plan.</p><a href="/lessons/new" className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Create lesson</a></div></main>;
  }

  const { plan, grounded, provider } = parsed.data;
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <a href="/lessons/new" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Create another lesson</a>

        <header className="relative overflow-hidden rounded-[30px] border border-primary/15 bg-[#eef4ff] p-7 sm:p-9">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge className="bg-primary text-primary-foreground">Lesson ready</Badge><Badge variant="outline" className="bg-white/60">{grounded ? 'Source grounded' : 'Topic based'}</Badge><Badge variant="outline" className="bg-white/60">{provider === 'openai' ? 'Live AI plan' : 'Reliable demo plan'}</Badge></div><ShareLessonButton title={plan.title} /></div>
            <h1 className="mt-5 max-w-3xl font-heading text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-4xl">{plan.title}</h1>
            <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Clock3 className="size-4 text-primary" /> {plan.durationMinutes} minutes</span><span className="flex items-center gap-2"><BookOpen className="size-4 text-primary" /> {plan.segments.length} teaching segments</span><span className="flex items-center gap-2"><Target className="size-4 text-primary" /> {plan.objectives.length} outcomes</span></div>
          </div>
        </header>

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.13em] text-primary">Teaching sequence</p><h2 className="mt-1 font-heading text-2xl font-bold tracking-[-0.03em]">Your personalized lesson</h2></div>
            <ol className="space-y-4">
              {plan.segments.map((segment, index) => {
                const VisualIcon = visualIcons[segment.visualType];
                return (
                  <li key={segment.id} className="rounded-[22px] border bg-card p-5 shadow-[0_10px_35px_rgb(40_50_75/5%)] sm:p-6">
                    <div className="flex gap-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-heading text-lg font-bold tracking-[-0.02em]">{segment.title}</h3><p className="mt-1 text-sm text-muted-foreground">{segment.objective}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{segment.estimatedMinutes} min</span></div>
                        <p className="mt-4 rounded-xl bg-muted/70 p-4 text-sm leading-6">{segment.narration}</p>
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-primary/20 p-3"><VisualIcon className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-xs font-bold capitalize text-primary">{segment.visualType.replace('_', ' ')}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{segment.visualBrief}</p></div></div>
                        {segment.checkpoint && <div className="mt-3 flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-amber-950"><Target className="mt-0.5 size-4 shrink-0" /><div><p className="text-xs font-bold uppercase tracking-wide">Understanding checkpoint</p><p className="mt-1 text-sm">{segment.checkpoint.prompt}</p></div></div>}
                        {segment.citations.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{segment.citations.map((citation) => <span key={citation.chunkId} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Source · page {citation.page ?? '—'}</span>)}</div>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[22px] border bg-card p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Learning outcomes</p><ul className="mt-4 space-y-3">{plan.objectives.map((objective) => <li key={objective} className="flex gap-2 text-sm leading-5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{objective}</li>)}</ul></section>
            <section className="sticky top-6 rounded-[22px] bg-[#15223f] p-5 text-white shadow-[0_16px_42px_rgb(21_34_63/18%)]"><Sparkles className="size-5 text-amber-300" /><h2 className="mt-4 font-heading text-xl font-bold">Ready for class</h2><p className="mt-2 text-sm leading-6 text-white/65">The teaching sequence, visuals, questions, and source evidence are prepared.</p><a href={`/lessons/${lessonId}/classroom?start=${lessonId}`} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#15223f] transition hover:bg-sky-50">Enter AI classroom <Sparkles className="size-4" /></a></section>
            <a href={`/lessons/${lessonId}/revision`} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/5"><FileText className="size-4" /> Open revision studio</a>
            <a href={`/lessons/${lessonId}/practice`} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"><Target className="size-4" /> Adaptive practice</a>
            <a href={`/lessons/${lessonId}/concept-map`} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/5"><GitBranch className="size-4" /> Concept map</a>
          </aside>
        </div>
      </div>
    </main>
  );
}
