import { checkpointAttemptRequestSchema, checkpointAttemptResponseSchema, lessonPlanGenerationResponseSchema } from '@edukriti/contracts';
import { buildAdaptation, evaluateCheckpoint } from '@edukriti/teaching-engine';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';

export async function POST(request: Request) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Checkpoint storage is not available in this environment.');
  const parsed = checkpointAttemptRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'INVALID_CHECKPOINT_ATTEMPT', 'Enter a response before submitting.', parsed.error.issues);

  const existing = await env.DB.prepare('SELECT evaluation_json AS evaluationJson FROM checkpoint_attempts WHERE id = ? AND lesson_id = ? LIMIT 1')
    .bind(parsed.data.clientRequestId, parsed.data.lessonId).first<{ evaluationJson: string }>();
  if (existing) {
    const replay = checkpointAttemptResponseSchema.safeParse(JSON.parse(existing.evaluationJson));
    if (replay.success) return Response.json(replay.data, { headers: { 'X-Idempotent-Replay': 'true' } });
  }

  const row = await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(parsed.data.lessonId).first<{ planJson: string }>();
  if (!row) return apiError(404, 'LESSON_NOT_FOUND', 'This lesson could not be found.');
  const lesson = lessonPlanGenerationResponseSchema.safeParse(JSON.parse(row.planJson));
  if (!lesson.success) return apiError(500, 'INVALID_STORED_LESSON', 'The stored lesson could not be validated.');
  const checkpoint = lesson.data.plan.segments.flatMap((segment) => segment.checkpoint ? [segment.checkpoint] : []).find((item) => item.id === parsed.data.checkpointId);
  if (!checkpoint) return apiError(404, 'CHECKPOINT_NOT_FOUND', 'This checkpoint is not part of the lesson.');

  const evaluation = evaluateCheckpoint({ id: checkpoint.id, targetConcept: checkpoint.targetConcept, language: lesson.data.plan.language }, parsed.data.response);
  const result = checkpointAttemptResponseSchema.parse({
    attemptId: parsed.data.clientRequestId,
    evaluation,
    adaptation: buildAdaptation({ id: checkpoint.id, targetConcept: checkpoint.targetConcept, language: lesson.data.plan.language }, evaluation),
    attemptedAt: new Date().toISOString(),
  });

  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO checkpoint_attempts (id, lesson_id, checkpoint_id, response, evaluation_json, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(result.attemptId, parsed.data.lessonId, checkpoint.id, parsed.data.response, JSON.stringify(result), result.attemptedAt),
      env.DB.prepare("UPDATE lessons SET status = 'teaching' WHERE id = ? AND status = 'ready'").bind(parsed.data.lessonId),
    ]);
  } catch {
    const replay = await env.DB.prepare('SELECT evaluation_json AS evaluationJson FROM checkpoint_attempts WHERE id = ? AND lesson_id = ? LIMIT 1')
      .bind(parsed.data.clientRequestId, parsed.data.lessonId).first<{ evaluationJson: string }>();
    if (replay) return Response.json(checkpointAttemptResponseSchema.parse(JSON.parse(replay.evaluationJson)), { headers: { 'X-Idempotent-Replay': 'true' } });
    return apiError(500, 'CHECKPOINT_SAVE_FAILED', 'The checkpoint result could not be saved. Please retry.');
  }

  return Response.json(result, { status: 201 });
}
