import { z } from 'zod';
import { apiError } from '../../../../lib/api-error.ts';
import { generateParametricQuestion } from '@edukriti/questions';

const generateRequestSchema = z.object({
  familyId: z.string().min(1),
  seed: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = generateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, 'INVALID_GENERATE_REQUEST', 'familyId is required to generate question', parsed.error.issues);
    }

    const seed = parsed.data.seed ?? Math.floor(Math.random() * 1_000_000);
    const question = generateParametricQuestion(parsed.data.familyId, seed);

    return Response.json({
      question,
      seed,
    });
  } catch (error) {
    return apiError(
      500,
      'GENERATION_FAILED',
      error instanceof Error ? error.message : 'Failed to generate parametric question',
    );
  }
}
