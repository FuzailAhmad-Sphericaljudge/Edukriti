import { lessonPlanGenerationResponseSchema, lessonRequestSchema } from '@edukriti/contracts';
import { rankChunks, type RankableChunk } from '@edukriti/rag';
import type { LessonEvidence } from '@edukriti/teaching-engine';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';
import { generateLessonPlan } from '@/lib/lesson-provider';

type StoredChunk = RankableChunk & { sourceId: string };

export async function POST(request: Request) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Lesson storage is not available in this environment.');
  const parsed = lessonRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'INVALID_LESSON_REQUEST', 'Check the topic, learner preferences, and learning goal.', parsed.error.issues);

  try {
    let evidence: LessonEvidence[] = [];
    if (parsed.data.sourceId) {
      const chunks = await env.DB.prepare(
        'SELECT id, source_id AS sourceId, chunk_index AS `index`, page_start AS pageStart, page_end AS pageEnd, token_count AS tokenCount, content AS text FROM source_chunks WHERE source_id = ? ORDER BY chunk_index ASC LIMIT 1000',
      ).bind(parsed.data.sourceId).all<StoredChunk>();
      evidence = rankChunks(chunks.results, `${parsed.data.topic ?? ''} ${parsed.data.goal}`, 10).map((chunk) => ({
        sourceId: chunk.sourceId,
        chunkId: chunk.id,
        page: chunk.pageStart,
        text: chunk.text,
      }));
      if (evidence.length === 0) return apiError(422, 'INSUFFICIENT_EVIDENCE', 'The uploaded material does not contain enough evidence for this learning goal.');
    }

    const lessonId = crypto.randomUUID();
    const generated = await generateLessonPlan(parsed.data, evidence, lessonId, {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    });
    const response = lessonPlanGenerationResponseSchema.parse({
      plan: generated.plan,
      grounded: evidence.length > 0,
      provider: generated.provider,
    });

    await env.DB.batch([
      env.DB.prepare(
        'INSERT OR IGNORE INTO learners (id, display_name, level, preferred_language, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(parsed.data.learnerId, 'Demo Learner', parsed.data.level, parsed.data.language, generated.plan.createdAt, generated.plan.createdAt),
      env.DB.prepare(
        'INSERT INTO lessons (id, learner_id, source_id, topic, title, language, duration_minutes, status, plan_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(lessonId, parsed.data.learnerId, parsed.data.sourceId ?? null, parsed.data.topic ?? null, generated.plan.title, parsed.data.language, parsed.data.durationMinutes, 'ready', JSON.stringify(response), generated.plan.createdAt),
    ]);

    return Response.json(response, { status: 201 });
  } catch (error) {
    return apiError(500, 'LESSON_GENERATION_FAILED', error instanceof Error ? error.message : 'Lesson generation failed.');
  }
}
