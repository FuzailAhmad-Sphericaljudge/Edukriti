import { ArrowLeft, Sparkles } from 'lucide-react';

import { LessonSetupForm } from '@/components/lesson-setup-form';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

export default async function NewLesson({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to dashboard</a>
        <div className="mb-8 flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="size-5" /></div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">Create lesson</p>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">Design your learning session</h1>
            <p className="mt-2 text-muted-foreground">Select a STEM topic or upload lecture slides/documents. Edukriti builds a personalized prerequisite-first lesson with interactive visual manifests.</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-muted-foreground">Quick Presets:</span>
              <a
                href="/lessons/new?goal=Electricity%20and%20circuits%20using%20Ohm%E2%80%99s%20law&duration=20&variantMode=standard"
                className="rounded-full border bg-card px-3 py-1 font-medium hover:border-primary hover:text-primary transition"
              >
                ⚡ Electricity (20m Standard)
              </a>
              <a
                href="/lessons/new?goal=Newton%20laws%20of%20motion%20and%20inertia&duration=5&variantMode=practical"
                className="rounded-full border bg-card px-3 py-1 font-medium hover:border-primary hover:text-primary transition"
              >
                🍎 Newton Laws (5m Practical)
              </a>
              <a
                href="/lessons/new?goal=Photosynthesis%20light%20reactions%20and%20ATP%20production&duration=20&variantMode=exam_focused"
                className="rounded-full border bg-card px-3 py-1 font-medium hover:border-primary hover:text-primary transition"
              >
                🌿 Photosynthesis (20m Exam Prep)
              </a>
              <a
                href="/lessons/new?goal=Chemical%20bonding%20ionic%20and%20covalent%20structures&duration=60&variantMode=standard"
                className="rounded-full border bg-card px-3 py-1 font-medium hover:border-primary hover:text-primary transition"
              >
                ⚛️ Chemical Bonding (60m Deep Dive)
              </a>
            </div>
          </div>
        </div>
        <LessonSetupForm
          initialMode={valueOf(params.mode, 'topic') === 'upload' ? 'upload' : 'topic'}
          initialLevel={valueOf(params.level, 'beginner')}
          initialLanguage={valueOf(params.language, 'hinglish')}
          initialDuration={valueOf(params.duration, '20')}
          initialVariantMode={valueOf(params.variantMode || params.variant, 'standard')}
          initialGoal={valueOf(params.goal, '')}
          initialError={valueOf(params.error, '')}
        />
      </div>
    </main>
  );
}
