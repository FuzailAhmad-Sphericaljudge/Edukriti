import { learningReportSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';
import { ArrowRight, Award, BrainCircuit, CheckCircle2, Home, RefreshCcw, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function LearningReportPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const row = env.DB ? await env.DB.prepare('SELECT report_json AS reportJson FROM learning_reports WHERE lesson_id = ? LIMIT 1').bind(lessonId).first<{ reportJson: string }>() : null;
  const parsed = row ? learningReportSchema.safeParse(JSON.parse(row.reportJson)) : null;
  if (!parsed?.success) return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md rounded-3xl border bg-card p-8 text-center"><Award className="mx-auto size-8 text-primary" /><h1 className="mt-4 text-2xl font-bold">Report not ready</h1><p className="mt-2 text-sm text-muted-foreground">Finish the final assessment to generate your learning report.</p><Button className="mt-6" render={<Link href={`/lessons/${lessonId}/assessment`} />}>Open assessment</Button></div></main>;
  const report = parsed.data;
  const scoreTone = report.scorePercent >= 75 ? 'text-emerald-600' : report.scorePercent >= 50 ? 'text-amber-600' : 'text-orange-600';

  return <main className="min-h-screen bg-[#f7f7f3] px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-5xl">
    <header className="overflow-hidden rounded-[30px] bg-[#14213d] p-7 text-white shadow-xl sm:p-10"><div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center"><div><Badge className="bg-emerald-400/15 text-emerald-300"><Sparkles className="mr-1 size-3.5" /> Lesson complete</Badge><h1 className="mt-5 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Your learning report</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/60">Built from your actual final-assessment answers, with focused next steps for revision.</p></div><div className="grid size-36 shrink-0 place-items-center rounded-full border-8 border-white/10 bg-white/5 text-center"><div><p className="font-heading text-4xl font-black">{report.scorePercent}%</p><p className="text-xs text-white/55">Final score</p></div></div></div></header>

    <div className="mt-6 grid gap-5 md:grid-cols-2">
      <section className="rounded-[24px] border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">Strengths</p><h2 className="font-heading text-xl font-bold">Concepts understood</h2></div></div><ul className="mt-5 space-y-3">{report.strongConcepts.length ? report.strongConcepts.map((concept) => <li key={concept} className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{concept}</li>) : <li className="text-sm text-muted-foreground">Keep practicing—the next attempt can turn these into strengths.</li>}</ul></section>
      <section className="rounded-[24px] border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-amber-100 text-amber-700"><BrainCircuit className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-600">Focus areas</p><h2 className="font-heading text-xl font-bold">Needs more practice</h2></div></div><ul className="mt-5 space-y-3">{report.weakConcepts.length ? report.weakConcepts.map((concept) => <li key={concept} className="rounded-xl bg-amber-50 p-3 text-sm">{concept}</li>) : <li className="text-sm text-muted-foreground">No weak concepts detected in this assessment.</li>}</ul></section>
    </div>

    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
      <section className="rounded-[24px] border bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">Personal revision plan</p><h2 className="mt-1 font-heading text-xl font-bold">What to do next</h2><ol className="mt-5 space-y-4">{report.revisionAdvice.map((advice, index) => <li key={advice} className="flex gap-3 text-sm leading-6"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{index + 1}</span>{advice}</li>)}</ol>{report.misconceptions.length > 0 && <div className="mt-6 rounded-2xl bg-orange-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-orange-700">Misconception to watch</p><p className="mt-2 text-sm leading-6 text-orange-950">{report.misconceptions[0]}</p></div>}</section>
      <aside className="rounded-[24px] bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white"><Target className="size-6 text-amber-300" /><p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-white/55">Recommended next</p><h2 className="mt-2 font-heading text-2xl font-bold">{report.recommendedNextTopic}</h2><p className={`mt-5 text-sm font-bold ${scoreTone === 'text-emerald-600' ? 'text-emerald-200' : 'text-amber-200'}`}>Your score: {report.scorePercent}%</p><Button className="mt-6 w-full bg-white text-indigo-700 hover:bg-white/90" render={<Link href="/lessons/new" />}>Create next lesson <ArrowRight /></Button></aside>
    </div>

    <div className="mt-6 flex flex-wrap justify-center gap-3"><Button variant="outline" render={<Link href={`/lessons/${lessonId}/classroom`} />}><RefreshCcw /> Replay lesson</Button><Button variant="ghost" render={<Link href="/" />}><Home /> Dashboard</Button></div>
  </div></main>;
}
