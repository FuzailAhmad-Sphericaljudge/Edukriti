import { z } from 'zod';
import { apiError } from '../../../../lib/api-error.ts';
import { submitMockTestAssessment } from '../../../../lib/practice-provider.ts';

const mockTestSubmissionSchema = z.object({
  test: z.any(),
  answers: z.record(z.string(), z.string()),
  timeSpentSeconds: z.number().int().min(0),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = mockTestSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, 'INVALID_MOCK_TEST_SUBMISSION', 'Invalid mock test submission format', parsed.error.issues);
    }

    const result = submitMockTestAssessment(
      parsed.data.test,
      parsed.data.answers,
      parsed.data.timeSpentSeconds,
    );

    return Response.json(result);
  } catch (error) {
    return apiError(
      500,
      'MOCK_TEST_EVALUATION_FAILED',
      error instanceof Error ? error.message : 'Failed to evaluate mock test submission',
    );
  }
}

