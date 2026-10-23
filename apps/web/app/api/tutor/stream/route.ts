import {
  lessonPlanGenerationResponseSchema,
  tutorRequestSchema,
  type LessonPlan,
} from '@edukriti/contracts';
import { env } from 'cloudflare:workers';

import { streamTutorQuestion } from '@/lib/tutor-provider';

export async function POST(request: Request) {
  const parsed = tutorRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: { code: 'INVALID_TUTOR_QUESTION', message: 'Ask a clear question for Aarohi.' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
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
      // Proceed with general knowledge base
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of streamTutorQuestion(plan, parsed.data, {
          geminiApiKey: env?.GEMINI_API_KEY,
          geminiModel: env?.GEMINI_MODEL || env?.LLM_MODEL,
          openaiApiKey: env?.OPENAI_API_KEY,
          openaiModel: env?.OPENAI_MODEL || env?.LLM_MODEL,
          provider: env?.LLM_PROVIDER as 'gemini' | 'openai' | 'deterministic' | undefined,
        })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Streaming error occurred.';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', code: 'STREAM_FAILED', message: errMsg })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
