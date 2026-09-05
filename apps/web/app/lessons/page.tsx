import { env } from 'cloudflare:workers';
import { ArrowLeft, ArrowRight, BookOpen, Plus, Target } from 'lucide-react';

type LessonRow = {
  id: string;
  title: string;
  language: string;
  durationMinutes: number;
  status: string;
  progress: number;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonsPage() {
  let lessons: LessonRow[] = [];
  if (env.DB) {
    try {
      const stored = await env.DB.prepare("SELECT l.id, l.title, l.language, l.duration_minutes AS durationMinutes, l.status, COALESCE(r.score_percent, 0) AS progress FROM lessons l LEFT JOIN learning_reports r ON r.lesson_id = l.id ORDER BY l.created_at DESC LIMIT 30").all<LessonRow>();
      lessons = stored.results;
    } catch {
      lessons = [];
    }
  }

  return <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Dashboard</a>
        <div className="flex flex-wrap gap-2"><a href="/progress" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold text-primary hover:bg-primary/5"><Target className="size-4" /> Progress dashboard</a><a href="/lessons/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/80"><Plus className="size-4" /> Create lesson</a></div>
      </div>
      <header className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">My lessons</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em]">Continue learning</h1><p className="mt-2 text-muted-foreground">Open any lesson card to continue from where you stopped.</p></header>
      {lessons.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2">{lessons.map((lesson) => {
        const completed = lesson.status === 'completed';
        const href = `/lessons/${lesson.id}/${completed ? 'report' : 'classroom'}`;
        const Icon = completed ? Target : BookOpen;
        return <a key={lesson.id} href={href} className="group rounded-2xl border bg-card p-5 shadow-[0_10px_32px_rgb(40_50_75/5%)] transition hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20">
          <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block font-heading font-bold">{lesson.title}</span><span className="mt-1 block text-xs capitalize text-muted-foreground">{lesson.language} · {lesson.durationMinutes} min · {lesson.status}</span></span><ArrowRight className="mt-2 size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div>
          <span className="mt-5 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(8, lesson.progress)}%` }} /></span>
        </a>;
      })}</div> : <section className="mt-7 rounded-3xl border border-dashed bg-card p-10 text-center"><BookOpen className="mx-auto size-8 text-primary" /><h2 className="mt-4 font-heading text-xl font-bold">No lessons yet</h2><p className="mt-2 text-sm text-muted-foreground">Create your first AI-led lesson to see it here.</p><a href="/lessons/new" className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Create first lesson</a></section>}
    </div>
  </main>;
}
