import { tutorFeedbackSchema } from '@edukriti/contracts';
import { apiError } from '../../../../lib/api-error.ts';

export async function POST(request: Request) {
  const parsed = tutorFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, 'INVALID_TUTOR_FEEDBACK', 'Provide valid tutor feedback.', parsed.error.issues);
  }

  // Log feedback payload for continuous pedagogical quality metrics
  console.log(
    `[TUTOR_FEEDBACK] id=${parsed.data.id} rating=${parsed.data.rating} snippet="${parsed.data.questionSnippet}"`,
  );

  return Response.json({
    success: true,
    feedbackId: parsed.data.id,
    receivedAt: new Date().toISOString(),
  });
}
