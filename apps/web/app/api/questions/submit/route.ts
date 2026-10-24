import { practiceSubmissionSchema } from '@edukriti/contracts';
import { apiError } from '../../../../lib/api-error.ts';
import { evaluateSubmission } from '../../../../lib/practice-provider.ts';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = practiceSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, 'INVALID_SUBMISSION', 'Invalid practice submission payload', parsed.error.issues);
    }

    const evaluation = evaluateSubmission(parsed.data);

    return Response.json(evaluation);
  } catch (error) {
    return apiError(
      500,
      'EVALUATION_FAILED',
      error instanceof Error ? error.message : 'Failed to evaluate practice submission',
    );
  }
}

