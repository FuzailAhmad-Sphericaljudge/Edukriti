import { lessonPlanGenerationResponseSchema, sourceIngestionResponseSchema } from '@edukriti/contracts';

import { POST as createLesson } from '../route';
import { POST as ingestSource } from '../../sources/route';

function value(form: FormData, name: string, fallback = '') {
  const current = form.get(name);
  return typeof current === 'string' ? current.trim() : fallback;
}

function setupRedirect(request: Request, form: FormData, message: string) {
  const url = new URL('/lessons/new', request.url);
  for (const name of ['mode', 'level', 'language', 'duration', 'goal']) {
    const current = value(form, name);
    if (current) url.searchParams.set(name, current);
  }
  url.searchParams.set('error', message);
  return Response.redirect(url, 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const goal = value(form, 'goal');
  if (goal.length < 2) return setupRedirect(request, form, 'Enter a topic or learning goal first.');

  try {
    let sourceId: string | undefined;
    if (value(form, 'mode', 'topic') === 'upload') {
      const file = form.get('file');
      if (!(file instanceof File) || file.size === 0) return setupRedirect(request, form, 'Choose a PDF or text file first.');
      const upload = new FormData();
      upload.set('file', file);
      upload.set('learnerId', 'demo-learner');
      const uploadResponse = await ingestSource(new Request(new URL('/api/sources', request.url), { method: 'POST', body: upload }));
      const uploadBody = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error('Material processing failed.');
      sourceId = sourceIngestionResponseSchema.parse(uploadBody).source.id;
    }

    const lessonResponse = await createLesson(new Request(new URL('/api/lessons', request.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        learnerId: 'demo-learner',
        topic: goal,
        sourceId,
        level: value(form, 'level', 'beginner'),
        language: value(form, 'language', 'hinglish'),
        durationMinutes: Number(value(form, 'duration', '20')),
        style: 'simple_examples',
        goal,
      }),
    }));
    const lessonBody = await lessonResponse.json();
    if (!lessonResponse.ok) throw new Error('Lesson planning failed.');
    const lesson = lessonPlanGenerationResponseSchema.parse(lessonBody);
    return Response.redirect(new URL(`/lessons/${lesson.plan.id}/plan`, request.url), 303);
  } catch (error) {
    return setupRedirect(request, form, error instanceof Error ? error.message : 'Could not create the lesson. Please try again.');
  }
}
