import { questionReportRequestSchema } from '@edukriti/contracts';
import { apiError } from '../../../../lib/api-error.ts';
import { reportQuestion, getReportedCount } from '../../../../lib/practice-provider.ts';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = questionReportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, 'INVALID_REPORT_REQUEST', 'Invalid question report payload', parsed.error.issues);
    }

    const reportId = reportQuestion(
      parsed.data.questionId,
      parsed.data.issueType,
      parsed.data.description,
    );

    return Response.json({
      reportId,
      success: true,
      message: 'Question feedback received and flagged for curriculum review.',
      totalReports: getReportedCount(),
    });
  } catch (error) {
    return apiError(
      500,
      'REPORT_FAILED',
      error instanceof Error ? error.message : 'Failed to report question issue',
    );
  }
}
