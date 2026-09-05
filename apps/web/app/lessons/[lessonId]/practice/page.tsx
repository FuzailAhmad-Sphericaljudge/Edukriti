import {
  learningReportSchema,
  lessonPlanGenerationResponseSchema,
} from '@edukriti/contracts';
import { env } from 'cloudflare:workers';
import { ArrowLeft, BrainCircuit } from 'lucide-react';

import { AdaptivePractice } from '@/components/adaptive-practice';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PracticePage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const [lessonRow, reportRow] = env.DB
    ? await Promise.all([
        env.DB.prepare(
          'SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1',
        )
          .bind(lessonId)
          .first<{ planJson: string }>(),
        env.DB.prepare(
          'SELECT report_json AS reportJson FROM learning_reports WHERE lesson_id = ? LIMIT 1',
        )
          .bind(lessonId)
          .first<{ reportJson: string }>(),
      ])
    : [null, null];
  const lesson = lessonRow
    ? lessonPlanGenerationResponseSchema.safeParse(JSON.parse(lessonRow.planJson))
    : null;
  const report = reportRow
    ? learningReportSchema.safeParse(JSON.parse(reportRow.reportJson))
    : null;

  if (!lesson?.success) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-md rounded-3xl border bg-card p-8 text-center">
          <BrainCircuit className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Practice unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a lesson first so Aarohi can prepare adaptive questions.
          </p>
          <a href="/lessons/new" className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Create lesson
          </a>
        </div>
      </main>
    );
  }

  const plan = lesson.data.plan;
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <a href={`/lessons/${lessonId}/revision`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to revision studio
        </a>
        <header className="mt-6 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#15223f] to-[#27376c] p-7 text-white shadow-xl sm:p-9">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-300 text-slate-950">
              <BrainCircuit className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-300">Adaptive practice</p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Practice what matters most</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Aarohi changes the challenge after every answer and prioritizes weak concepts from your learning report.
              </p>
            </div>
          </div>
        </header>
        <AdaptivePractice plan={plan} weakConcepts={report?.success ? report.data.weakConcepts : []} />
      </div>
    </main>
  );
}
