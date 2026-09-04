import { learningReportSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Report storage is not available.');
  const { lessonId } = await params;
  const row = await env.DB.prepare('SELECT report_json AS reportJson FROM learning_reports WHERE lesson_id = ? LIMIT 1').bind(lessonId).first<{ reportJson: string }>();
  if (!row) return apiError(404, 'REPORT_NOT_FOUND', 'This learning report could not be found.');
  return Response.json(learningReportSchema.parse(JSON.parse(row.reportJson)));
}
