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
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">Create lesson</p><h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">Design your learning session</h1><p className="mt-2 text-muted-foreground">Upload your material and Edukriti will turn it into safe, searchable teaching context.</p></div>
        </div>
        <LessonSetupForm
          initialMode={valueOf(params.mode, 'topic') === 'upload' ? 'upload' : 'topic'}
          initialLevel={valueOf(params.level, 'beginner')}
          initialLanguage={valueOf(params.language, 'hinglish')}
          initialDuration={valueOf(params.duration, '20')}
          initialGoal={valueOf(params.goal, '')}
          initialError={valueOf(params.error, '')}
        />
      </div>
    </main>
  );
}
