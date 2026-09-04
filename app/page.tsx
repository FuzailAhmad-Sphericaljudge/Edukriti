import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Clock3,
  Languages,
  Mic2,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LessonEntryActions } from '@/components/lesson-entry-actions';

const recentLessons = [
  {
    title: 'Electricity & Circuits',
    meta: 'Class 8 · Hinglish · 20 min',
    progress: 68,
    accent: 'bg-amber-100 text-amber-800',
    icon: BrainCircuit,
  },
  {
    title: 'Introduction to React',
    meta: 'Beginner · English · 60 min',
    progress: 32,
    accent: 'bg-sky-100 text-sky-800',
    icon: BookOpen,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 lg:px-9">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_24px_rgb(29_78_216/24%)]">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold tracking-[-0.03em]">Edukriti</p>
              <p className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Learn with clarity</p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Primary navigation">
            <a className="text-foreground" href="#dashboard">Home</a>
            <a className="transition-colors hover:text-foreground" href="#lessons">My lessons</a>
            <a className="transition-colors hover:text-foreground" href="#progress">Progress</a>
          </nav>

          <button className="grid size-10 place-items-center rounded-full bg-[#efe7d5] text-sm font-bold text-[#765524]" aria-label="Open learner profile">FJ</button>
        </div>
      </header>

      <div id="dashboard" className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-9 lg:py-10">
        <section>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge variant="secondary" className="mb-3 bg-primary/8 text-primary">Friday learning plan</Badge>
              <h1 className="font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Good evening, Fuzail.</h1>
              <p className="mt-2 max-w-xl text-muted-foreground">What would you like your personal AI teacher to help you understand today?</p>
            </div>
            <Button size="lg" className="h-11 rounded-xl px-4 shadow-[0_10px_24px_rgb(29_78_216/20%)]">
              <Plus data-icon="inline-start" /> Create lesson
            </Button>
          </div>

          <section className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[#eef4ff] p-6 sm:p-8" aria-labelledby="create-heading">
            <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative grid gap-7 md:grid-cols-[1fr_270px] md:items-center">
              <div>
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><Mic2 className="size-3.5" /></span>
                  Your AI classroom
                </div>
                <h2 id="create-heading" className="max-w-2xl font-heading text-2xl font-bold leading-tight tracking-[-0.035em] sm:text-3xl">
                  Turn any topic or study material into a lesson made for you.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Choose your level, language, and available time. Your teacher will explain, ask questions, and adapt when you need help.
                </p>
                <LessonEntryActions />
              </div>

              <div className="relative mx-auto grid aspect-square w-full max-w-[250px] place-items-center">
                <div className="absolute inset-3 rounded-full border border-dashed border-primary/20" />
                <div className="absolute left-0 top-12 rounded-2xl border border-white bg-white/90 p-3 shadow-sm"><Languages className="size-5 text-primary" /></div>
                <div className="absolute bottom-8 right-0 rounded-2xl border border-white bg-white/90 p-3 shadow-sm"><Target className="size-5 text-[#d2763b]" /></div>
                <div className="grid size-36 place-items-center rounded-full bg-gradient-to-br from-primary to-[#7248cc] shadow-[0_24px_60px_rgb(29_78_216/28%)]">
                  <div className="grid size-28 place-items-center rounded-full border-4 border-white/25 bg-white/15 text-center text-white">
                    <span className="font-heading text-4xl font-bold">AI</span>
                    <span className="-mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">Teacher</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="lessons" className="mt-9" aria-labelledby="recent-heading">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="recent-heading" className="font-heading text-xl font-bold tracking-[-0.025em]">Continue learning</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your recent personalized lessons</p>
              </div>
              <Button variant="ghost">View all <ArrowRight data-icon="inline-end" /></Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {recentLessons.map((lesson) => {
                const Icon = lesson.icon;
                return (
                  <article key={lesson.title} className="rounded-2xl border bg-card p-5 shadow-[0_10px_32px_rgb(40_50_75/5%)] transition-transform hover:-translate-y-0.5">
                    <div className="flex items-start gap-4">
                      <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${lesson.accent}`}><Icon className="size-5" /></div>
                      <div className="min-w-0 flex-1"><h3 className="font-heading font-bold tracking-[-0.02em]">{lesson.title}</h3><p className="mt-1 text-xs text-muted-foreground">{lesson.meta}</p></div>
                      <Button variant="ghost" size="icon-sm" aria-label={`Continue ${lesson.title}`}><ArrowRight /></Button>
                    </div>
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs font-medium"><span>Lesson progress</span><span className="text-muted-foreground">{lesson.progress}%</span></div>
                      <Progress value={lesson.progress} className="[&_[data-slot=progress-track]]:h-1.5" />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        <aside id="progress" className="space-y-5">
          <section className="rounded-[24px] border bg-card p-6 shadow-[0_12px_35px_rgb(40_50_75/5%)]">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Weekly goal</p><h2 className="mt-1 font-heading text-xl font-bold">3 of 5 lessons</h2></div>
              <div className="grid size-11 place-items-center rounded-2xl bg-[#fff1dc] text-[#b65f24]"><TrendingUp className="size-5" /></div>
            </div>
            <Progress value={60} className="mt-5 [&_[data-slot=progress-indicator]]:bg-[#d2763b] [&_[data-slot=progress-track]]:h-2" />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Two more lessons and you complete this week&apos;s goal.</p>
          </section>

          <section className="rounded-[24px] border bg-[#15223f] p-6 text-white shadow-[0_16px_42px_rgb(21_34_63/18%)]">
            <div className="flex items-center justify-between"><Badge className="bg-white/10 text-white">Recommended next</Badge><Clock3 className="size-4 text-white/55" /></div>
            <h2 className="mt-5 font-heading text-xl font-bold tracking-[-0.025em]">Ohm&apos;s Law in action</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">Strengthen the relationship between voltage, current, and resistance with a visual 12-minute lesson.</p>
            <Button variant="secondary" className="mt-5 w-full rounded-xl bg-white text-[#15223f] hover:bg-white/90">Begin lesson <ArrowRight data-icon="inline-end" /></Button>
          </section>

          <section className="rounded-[24px] border bg-card p-6">
            <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Target className="size-5" /></div><div><p className="text-xs text-muted-foreground">Strong area</p><p className="font-heading font-bold">Current & voltage</p></div></div>
            <div className="my-4 h-px bg-border" />
            <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-amber-100 text-amber-700"><BrainCircuit className="size-5" /></div><div><p className="text-xs text-muted-foreground">Needs practice</p><p className="font-heading font-bold">Resistance</p></div></div>
          </section>
        </aside>
      </div>
    </main>
  );
}
