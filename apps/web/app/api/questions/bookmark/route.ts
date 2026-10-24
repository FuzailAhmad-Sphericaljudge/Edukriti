import { z } from 'zod';
import { apiError } from '../../../../lib/api-error.ts';
import { toggleBookmark, getAllBookmarkedIds } from '../../../../lib/practice-provider.ts';

const bookmarkRequestSchema = z.object({
  questionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bookmarkRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, 'INVALID_BOOKMARK_REQUEST', 'questionId is required', parsed.error.issues);
    }

    const bookmarked = toggleBookmark(parsed.data.questionId);

    return Response.json({
      questionId: parsed.data.questionId,
      bookmarked,
      allBookmarks: getAllBookmarkedIds(),
    });
  } catch (error) {
    return apiError(
      500,
      'BOOKMARK_FAILED',
      error instanceof Error ? error.message : 'Failed to update bookmark',
    );
  }
}

export async function GET() {
  return Response.json({
    bookmarks: getAllBookmarkedIds(),
  });
}

