import { assessmentAttemptResponseSchema, learningReportRequestSchema, learningReportSchema, lessonPlanGenerationResponseSchema } from '@edukriti/contracts';
import { buildAssessment, buildLearningReport } from '@edukriti/teaching-engine';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';

export async function POST(request: Request) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Report storage is not available.');
  const parsed = learningReportRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'INVALID_REPORT_REQUEST', 'A valid lesson ID is required.');
  const existing = await env.DB.prepare('SELECT report_json AS reportJson FROM learning_reports WHERE lesson_id = ? LIMIT 1').bind(parsed.data.lessonId).first<{ reportJson: string }>();
  if (existing) return Response.json(learningReportSchema.parse(JSON.parse(existing.reportJson)), { headers: { 'X-Idempotent-Replay': 'true' } });
  const lessonRow = await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(parsed.data.lessonId).first<{ planJson: string }>();
  if (!lessonRow) return apiError(404, 'LESSON_NOT_FOUND', 'This lesson could not be found.');
  const lesson = lessonPlanGenerationResponseSchema.safeParse(JSON.parse(lessonRow.planJson));
  if (!lesson.success) return apiError(500, 'INVALID_STORED_LESSON', 'The stored lesson could not be validated.');
  const questionIds = new Set(buildAssessment(lesson.data.plan).map((question) => question.id));
  const attemptRows = await env.DB.prepare('SELECT checkpoint_id AS questionId, evaluation_json AS evaluationJson FROM checkpoint_attempts WHERE lesson_id = ? ORDER BY created_at DESC').bind(parsed.data.lessonId).all<{ questionId: string; evaluationJson: string }>();
  const attemptsByQuestion = new Map<string, ReturnType<typeof assessmentAttemptResponseSchema.parse>>();
  for (const row of attemptRows.results) {
    if (!questionIds.has(row.questionId) || attemptsByQuestion.has(row.questionId)) continue;
    const attempt = assessmentAttemptResponseSchema.safeParse(JSON.parse(row.evaluationJson));
    if (attempt.success) attemptsByQuestion.set(row.questionId, attempt.data);
  }
  if (attemptsByQuestion.size !== questionIds.size) return apiError(409, 'ASSESSMENT_INCOMPLETE', 'Answer every final assessment question before creating the report.');
  const report = buildLearningReport(lesson.data.plan, [...attemptsByQuestion.values()]);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO learning_reports (id, lesson_id, learner_id, score_percent, report_json, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(`${parsed.data.lessonId}-report`, parsed.data.lessonId, lesson.data.plan.learnerId, report.scorePercent, JSON.stringify(report), report.completedAt),
    env.DB.prepare("UPDATE lessons SET status = 'completed', completed_at = ? WHERE id = ?").bind(report.completedAt, parsed.data.lessonId),
  ]);
  return Response.json(report, { status: 201 });
}
