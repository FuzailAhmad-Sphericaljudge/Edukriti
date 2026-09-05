import { lessonPlanGenerationResponseSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

import { LessonClassroom } from '@/components/lesson-classroom';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonClassroomPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const row = env.DB ? await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(lessonId).first<{ planJson: string }>() : null;
  const parsed = row ? lessonPlanGenerationResponseSchema.safeParse(JSON.parse(row.planJson)) : null;
  if (!parsed?.success) return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md rounded-3xl border bg-card p-8 text-center"><BookOpen className="mx-auto size-8 text-primary" /><h1 className="mt-4 text-2xl font-bold">Classroom unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Create a valid lesson plan before opening the classroom.</p><Button className="mt-6" render={<Link href="/lessons/new" />}>Create lesson</Button></div></main>;
  return <LessonClassroom lesson={parsed.data} />;
}
