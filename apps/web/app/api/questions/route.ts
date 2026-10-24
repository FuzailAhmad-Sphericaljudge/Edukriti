import { questionBankQuerySchema } from '@edukriti/contracts';
import { apiError } from '../../../lib/api-error.ts';
import { queryPracticeBank, getQuestionBankStats } from '../../../lib/practice-provider.ts';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const parsed = questionBankQuerySchema.safeParse({
      subject: searchParams.subject || undefined,
      conceptId: searchParams.conceptId || undefined,
      grade: searchParams.grade || undefined,
      difficulty: searchParams.difficulty || undefined,
      questionType: searchParams.questionType || undefined,
      verifiedOnly: searchParams.verifiedOnly === 'true',
      search: searchParams.search || undefined,
      page: searchParams.page ? parseInt(searchParams.page, 10) : 1,
      pageSize: searchParams.pageSize ? parseInt(searchParams.pageSize, 10) : 10,
    });

    if (!parsed.success) {
      return apiError(400, 'INVALID_QUERY', 'Invalid question bank query parameters', parsed.error.issues);
    }

    const result = queryPracticeBank(parsed.data);
    const stats = getQuestionBankStats();

    return Response.json({
      ...result,
      stats,
    });
  } catch (error) {
    return apiError(
      500,
      'QUESTION_QUERY_FAILED',
      error instanceof Error ? error.message : 'Failed to query question bank',
    );
  }
}
