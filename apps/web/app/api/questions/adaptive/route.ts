import { z } from 'zod';
import { apiError } from '../../../../lib/api-error.ts';
import { getAdaptiveQuestion } from '../../../../lib/practice-provider.ts';

const adaptiveRequestSchema = z.object({
  profiles: z.record(
    z.string(),
    z.object({
      conceptId: z.string(),
      theta: z.number(),
      attempts: z.number().int(),
      correctCount: z.number().int(),
      lastAttemptDate: z.string().optional(),
      consecutiveCorrect: z.number().int(),
      intervalDays: z.number().int(),
      nextReviewDate: z.string().optional(),
      isWeakConcept: z.boolean().optional(),
    }),
  ).optional().default({}),
  targetSubject: z.string().optional(),
  targetConceptIds: z.array(z.string()).optional(),
  weakConceptIds: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = adaptiveRequestSchema.safeParse(body || {});

    if (!parsed.success) {
      return apiError(400, 'INVALID_ADAPTIVE_REQUEST', 'Invalid adaptive selection parameters', parsed.error.issues);
    }

    const result = getAdaptiveQuestion(
      parsed.data.profiles,
      parsed.data.targetSubject,
      parsed.data.targetConceptIds,
      parsed.data.weakConceptIds,
    );

    return Response.json(result);
  } catch (error) {
    return apiError(
      500,
      'ADAPTIVE_SELECTION_FAILED',
      error instanceof Error ? error.message : 'Failed to select adaptive question',
    );
  }
}
