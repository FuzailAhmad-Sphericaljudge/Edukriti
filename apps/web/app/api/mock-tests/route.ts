import { mockTestRequestSchema } from '@edukriti/contracts';
import { apiError } from '../../../lib/api-error.ts';
import { generateMockTestAssessment } from '../../../lib/practice-provider.ts';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = mockTestRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, 'INVALID_MOCK_TEST_REQUEST', 'Invalid mock test request parameters', parsed.error.issues);
    }

    const test = generateMockTestAssessment(parsed.data);

    return Response.json(test);
  } catch (error) {
    return apiError(
      500,
      'MOCK_TEST_CREATION_FAILED',
      error instanceof Error ? error.message : 'Failed to generate mock test',
    );
  }
}

