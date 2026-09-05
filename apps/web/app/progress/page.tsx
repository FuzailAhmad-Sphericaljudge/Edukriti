import { learningReportSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type ProgressRow = {
  id: string;
  title: string;
  language: string;
  durationMinutes: number;
  status: string;
  createdAt: string;
  scorePercent: number | null;
  reportJson: string | null;
};

function topConcepts(values: string[], limit = 4) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProgressPage() {
  let rows: ProgressRow[] = [];
  if (env.DB) {
    try {
      const result = await env.DB.prepare(
        `SELECT l.id, l.title, l.language, l.duration_minutes AS durationMinutes,
          l.status, l.created_at AS createdAt, r.score_percent AS scorePercent,
          r.report_json AS reportJson
        FROM lessons l
        LEFT JOIN learning_reports r ON r.lesson_id = l.id
        ORDER BY l.created_at DESC
        LIMIT 30`,
      ).all<ProgressRow>();
      rows = result.results;
    } catch {
      rows = [];
    }
  }

  const reports = rows.flatMap((row) => {
    if (!row.reportJson) return [];
    try {
      const parsed = learningReportSchema.safeParse(JSON.parse(row.reportJson));
      return parsed.success ? [{ row, report: parsed.data }] : [];
    } catch {
      return [];
    }
  });
  const completedLessons = reports.length;
  const averageScore = completedLessons
    ? Math.round(
        reports.reduce((total, item) => total + item.report.scorePercent, 0) /
          completedLessons,
      )
    : 0;
  const studyMinutes = rows.reduce(
    (total, row) => total + row.durationMinutes,
    0,
  );
  const strongConcepts = topConcepts(
    reports.flatMap((item) => item.report.strongConcepts),
  );
  const weakConcepts = topConcepts(
    reports.flatMap((item) => item.report.weakConcepts),
  );
  const scoreTrend = [...reports].reverse().slice(-8);
  const nextLesson = rows.find((row) => row.status !== 'completed') ?? rows[0];

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </a>
          <a href="/lessons/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <Sparkles className="size-4" /> Create lesson
          </a>
        </div>

        <header className="mt-7 overflow-hidden rounded-[30px] bg-[#15223f] p-7 text-white shadow-xl sm:p-9">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div>
              <Badge className="bg-sky-400/15 text-sky-200">
                <TrendingUp className="mr-1 size-3.5" /> Learning analytics
              </Badge>
              <h1 className="mt-5 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                Your progress, in one place
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Scores, learning time, strengths, and focus areas update from your saved lessons and assessments.
              </p>
            </div>
            <div className="min-w-40 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Overall mastery</p>
              <p className="mt-2 font-heading text-4xl font-black">{averageScore}%</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Learning summary">
          <article className="rounded-[22px] border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Lessons created</p><BookOpen className="size-5 text-indigo-600" /></div>
            <p className="mt-3 font-heading text-3xl font-bold">{rows.length}</p>
          </article>
          <article className="rounded-[22px] border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Assessments finished</p><CheckCircle2 className="size-5 text-emerald-600" /></div>
            <p className="mt-3 font-heading text-3xl font-bold">{completedLessons}</p>
          </article>
          <article className="rounded-[22px] border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Learning time</p><Clock3 className="size-5 text-amber-600" /></div>
            <p className="mt-3 font-heading text-3xl font-bold">{studyMinutes}<span className="ml-1 text-base font-semibold text-muted-foreground">min</span></p>
          </article>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
          <section className="rounded-[26px] border bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-indigo-600">Mastery trend</p><h2 className="mt-1 font-heading text-2xl font-bold">Assessment scores</h2></div>
              <span className="text-sm font-semibold text-muted-foreground">Last {scoreTrend.length} results</span>
            </div>
            {scoreTrend.length ? (
              <figure className="mt-7 flex h-56 items-end gap-3 border-b border-l px-3 pb-3" aria-label={`Assessment scores: ${scoreTrend.map((item) => `${item.report.scorePercent} percent`).join(', ')}`}>
                {scoreTrend.map(({ row, report }, index) => (
                  <div key={row.id} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
                    <span className="mb-2 text-center text-xs font-bold text-slate-600">{report.scorePercent}%</span>
                    <div className="relative mx-auto w-full max-w-12 rounded-t-xl bg-gradient-to-t from-indigo-600 to-sky-400 transition group-hover:from-indigo-500" style={{ height: `${Math.max(8, report.scorePercent)}%` }} />
                    <span className="mt-2 truncate text-center text-[11px] text-muted-foreground">#{index + 1}</span>
                  </div>
                ))}
              </figure>
            ) : (
              <div className="mt-7 rounded-2xl border border-dashed bg-slate-50 p-8 text-center">
                <Target className="mx-auto size-7 text-indigo-500" />
                <h3 className="mt-3 font-heading text-lg font-bold">No score yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Finish one final assessment to start your mastery trend.</p>
              </div>
            )}
          </section>

          <aside className="rounded-[26px] bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg sm:p-7">
            <Flame className="size-6 text-amber-300" />
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-white/55">Recommended action</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">{nextLesson ? 'Continue your learning streak' : 'Start your first lesson'}</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">{nextLesson ? nextLesson.title : 'Choose any topic and Aarohi will build a personalized lesson for you.'}</p>
            <a href={nextLesson ? `/lessons/${nextLesson.id}/${nextLesson.status === 'completed' ? 'practice' : 'classroom'}` : '/lessons/new'} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">
              {nextLesson ? 'Continue now' : 'Create lesson'} <ArrowRight className="size-4" />
            </a>
          </aside>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section className="rounded-[24px] border bg-white p-6">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">Strengths</p><h2 className="font-heading text-xl font-bold">Concepts mastered</h2></div></div>
            <div className="mt-5 space-y-3">{strongConcepts.length ? strongConcepts.map(([concept, count]) => <div key={concept} className="rounded-xl bg-emerald-50 p-3"><div className="flex justify-between gap-3 text-sm font-semibold"><span>{concept}</span><span>{count}x</span></div><Progress value={Math.min(100, count * 25)} className="mt-2 [&_[data-slot=progress-indicator]]:bg-emerald-500" /></div>) : <p className="text-sm text-muted-foreground">Complete an assessment to identify your strongest concepts.</p>}</div>
          </section>
          <section className="rounded-[24px] border bg-white p-6">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-amber-100 text-amber-700"><BrainCircuit className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-600">Focus areas</p><h2 className="font-heading text-xl font-bold">Needs more practice</h2></div></div>
            <div className="mt-5 space-y-3">{weakConcepts.length ? weakConcepts.map(([concept, count]) => <div key={concept} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold"><span>{concept}</span><span className="rounded-full bg-white px-2 py-1 text-xs text-amber-800">{count} review{count === 1 ? '' : 's'}</span></div>) : <p className="text-sm text-muted-foreground">No repeated weak concepts detected yet.</p>}</div>
            {reports[0] && <a href={`/lessons/${reports[0].row.id}/practice`} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-amber-100 px-4 text-sm font-bold text-amber-900 transition hover:bg-amber-200"><Target className="size-4" /> Practice focus areas</a>}
          </section>
        </div>

        <section className="mt-5 rounded-[26px] border bg-white p-6 sm:p-7">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-indigo-600">Recent activity</p><h2 className="mt-1 font-heading text-2xl font-bold">Learning history</h2></div><a href="/lessons" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View all lessons</a></div>
          <div className="mt-5 grid gap-3">{rows.slice(0, 5).map((row) => <a key={row.id} href={`/lessons/${row.id}/${row.scorePercent === null ? 'classroom' : 'report'}`} className="flex items-center gap-4 rounded-2xl border p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${row.scorePercent === null ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.scorePercent === null ? <BookOpen className="size-5" /> : <TrendingUp className="size-5" />}</span><span className="min-w-0 flex-1"><span className="block truncate font-heading font-bold">{row.title}</span><span className="mt-1 block text-xs capitalize text-muted-foreground">{row.language} · {row.durationMinutes} min · {row.scorePercent === null ? 'Lesson ready' : `${row.scorePercent}% score`}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></a>)}</div>
        </section>
      </div>
    </main>
  );
}
