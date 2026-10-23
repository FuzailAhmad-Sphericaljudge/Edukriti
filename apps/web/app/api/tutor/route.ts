import {
  lessonPlanGenerationResponseSchema,
  tutorRequestSchema,
  type LessonPlan,
} from '@edukriti/contracts';
import { env } from 'cloudflare:workers';

import { apiError } from '../../../lib/api-error.ts';
import { answerTutorQuestion } from '../../../lib/tutor-provider.ts';

export async function POST(request: Request) {
  const parsed = tutorRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, 'INVALID_TUTOR_QUESTION', 'Ask a clear question for Aarohi.', parsed.error.issues);
  }

  let plan: LessonPlan | null = null;
  if (parsed.data.lessonId && env?.DB) {
    try {
      const row = await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1')
        .bind(parsed.data.lessonId)
        .first<{ planJson: string }>();
      if (row) {
        const lesson = lessonPlanGenerationResponseSchema.safeParse(JSON.parse(row.planJson));
        if (lesson.success) {
          plan = lesson.data.plan;
        }
      }
    } catch {
      // Proceed with general knowledge base if lesson DB lookup fails
    }
  }

  try {
    const response = await answerTutorQuestion(plan, parsed.data, {
      geminiApiKey: env?.GEMINI_API_KEY,
      geminiModel: env?.GEMINI_MODEL || env?.LLM_MODEL,
      openaiApiKey: env?.OPENAI_API_KEY,
      openaiModel: env?.OPENAI_MODEL || env?.LLM_MODEL,
      provider: env?.LLM_PROVIDER as 'gemini' | 'openai' | 'deterministic' | undefined,
    });

    return Response.json(response);
  } catch (error) {
    return apiError(
      500,
      'TUTOR_RESPONSE_FAILED',
      error instanceof Error ? error.message : 'The tutor could not answer right now.',
    );
  }
}
