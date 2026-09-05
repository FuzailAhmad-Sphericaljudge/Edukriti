import { lessonPlanGenerationResponseSchema, tutorRequestSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';
import { answerTutorQuestion } from '@/lib/tutor-provider';

export async function POST(request: Request) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Tutor storage is not available in this environment.');
  const parsed = tutorRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'INVALID_TUTOR_QUESTION', 'Ask a clear question about this lesson.', parsed.error.issues);

  const row = await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(parsed.data.lessonId).first<{ planJson: string }>();
  if (!row) return apiError(404, 'LESSON_NOT_FOUND', 'This lesson could not be found.');
  const lesson = lessonPlanGenerationResponseSchema.safeParse(JSON.parse(row.planJson));
  if (!lesson.success) return apiError(500, 'INVALID_STORED_LESSON', 'The stored lesson could not be validated.');

  try {
    return Response.json(await answerTutorQuestion(lesson.data.plan, parsed.data, { apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL }));
  } catch (error) {
    return apiError(500, 'TUTOR_RESPONSE_FAILED', error instanceof Error ? error.message : 'The tutor could not answer right now.');
  }
}
