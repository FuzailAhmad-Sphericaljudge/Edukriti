import { lessonPlanGenerationResponseSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Lesson storage is not available in this environment.');
  const { lessonId } = await params;
  const row = await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(lessonId).first<{ planJson: string }>();
  if (!row) return apiError(404, 'LESSON_NOT_FOUND', 'This lesson could not be found.');
  try {
    return Response.json(lessonPlanGenerationResponseSchema.parse(JSON.parse(row.planJson)));
  } catch {
    return apiError(500, 'INVALID_STORED_LESSON', 'The stored lesson could not be validated.');
  }
}
