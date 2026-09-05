import { assessmentSchema, lessonPlanGenerationResponseSchema } from '@edukriti/contracts';
import { buildAssessment } from '@edukriti/teaching-engine';
import { env } from 'cloudflare:workers';
import { ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

import { AssessmentPlayer } from '@/components/assessment-player';
import { Button } from '@/components/ui/button';

export default async function AssessmentPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const row = env.DB ? await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(lessonId).first<{ planJson: string }>() : null;
  const lesson = row ? lessonPlanGenerationResponseSchema.safeParse(JSON.parse(row.planJson)) : null;
  if (!lesson?.success) return <Unavailable lessonId={lessonId} message="This lesson is not ready for assessment." />;
  const checkpointIds = lesson.data.plan.segments.flatMap((segment) => segment.checkpoint ? [segment.checkpoint.id] : []);
  const attempts = env.DB ? await env.DB.prepare('SELECT checkpoint_id AS checkpointId FROM checkpoint_attempts WHERE lesson_id = ?').bind(lessonId).all<{ checkpointId: string }>() : { results: [] };
  const completed = new Set(attempts.results.map((attempt) => attempt.checkpointId));
  if (checkpointIds.some((id) => !completed.has(id))) return <Unavailable lessonId={lessonId} message="Complete every classroom checkpoint before taking the final assessment." />;
  const questions = buildAssessment(lesson.data.plan).map(({ expectedAnswer: _answer, targetConcept: _concept, ...question }) => question);
  const assessment = assessmentSchema.parse({ lessonId, questions });
  return <AssessmentPlayer assessment={assessment} lessonTitle={lesson.data.plan.title} />;
}

function Unavailable({ lessonId, message }: { lessonId: string; message: string }) {
  return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md rounded-3xl border bg-card p-8 text-center"><ClipboardCheck className="mx-auto size-8 text-primary" /><h1 className="mt-4 text-2xl font-bold">Assessment locked</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p><Button className="mt-6" render={<Link href={`/lessons/${lessonId}/classroom`} />}>Return to classroom</Button></div></main>;
}
