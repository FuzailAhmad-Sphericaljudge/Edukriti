import { assessmentAttemptRequestSchema, assessmentAttemptResponseSchema, assessmentSchema, lessonPlanGenerationResponseSchema } from '@edukriti/contracts';
import { buildAssessment, buildAssessmentWithAi, evaluateAssessmentAnswerWithAi } from '@edukriti/teaching-engine';
import { createAiProvider } from '@edukriti/ai';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';

async function loadLesson(lessonId: string) {
  const row = await env.DB.prepare('SELECT plan_json AS planJson FROM lessons WHERE id = ? LIMIT 1').bind(lessonId).first<{ planJson: string }>();
  if (!row) return null;
  const parsed = lessonPlanGenerationResponseSchema.safeParse(JSON.parse(row.planJson));
  return parsed.success ? parsed.data : null;
}

export async function GET(request: Request) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Assessment storage is not available.');
  const lessonId = new URL(request.url).searchParams.get('lessonId');
  if (!lessonId) return apiError(400, 'LESSON_ID_REQUIRED', 'A lesson ID is required.');
  const lesson = await loadLesson(lessonId);
  if (!lesson) return apiError(404, 'LESSON_NOT_FOUND', 'This lesson could not be found.');
  const requiredCheckpoints = lesson.plan.segments.flatMap((segment) => segment.checkpoint ? [segment.checkpoint.id] : []);
  if (requiredCheckpoints.length) {
    const rows = await env.DB.prepare('SELECT checkpoint_id AS checkpointId FROM checkpoint_attempts WHERE lesson_id = ?').bind(lessonId).all<{ checkpointId: string }>();
    const completed = new Set(rows.results.map((row) => row.checkpointId));
    if (requiredCheckpoints.some((id) => !completed.has(id))) return apiError(409, 'LESSON_CHECKPOINTS_INCOMPLETE', 'Complete every lesson checkpoint before starting the final assessment.');
  }

  const aiProvider = createAiProvider({
    provider: env.LLM_PROVIDER as 'gemini' | 'openai' | 'deterministic' | undefined,
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL || env.LLM_MODEL,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL || env.LLM_MODEL,
  });

  const searchParams = new URL(request.url).searchParams;
  let weakConcepts = searchParams.getAll('weakConcept');
  if (weakConcepts.length === 0 && searchParams.has('weakConcepts')) {
    weakConcepts = (searchParams.get('weakConcepts') || '').split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (weakConcepts.length === 0 && lesson.plan.learnerId) {
    const learnerRow = await env.DB.prepare('SELECT weak_concepts AS weakConceptsJson FROM learners WHERE id = ? LIMIT 1')
      .bind(lesson.plan.learnerId)
      .first<{ weakConceptsJson: string }>();
    if (learnerRow?.weakConceptsJson) {
      try {
        const parsedJson = JSON.parse(learnerRow.weakConceptsJson);
        if (Array.isArray(parsedJson)) weakConcepts = parsedJson;
      } catch {
        // ignore parse error
      }
    }
  }

  const rawQuestions = await buildAssessmentWithAi(aiProvider, lesson.plan, weakConcepts);
  const questions = rawQuestions.map(({ expectedAnswer: _expected, targetConcept: _concept, ...question }) => question);
  return Response.json(assessmentSchema.parse({ lessonId, questions }));
}

export async function POST(request: Request) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Assessment storage is not available.');
  const parsed = assessmentAttemptRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'INVALID_ASSESSMENT_ANSWER', 'Choose or enter an answer before submitting.', parsed.error.issues);
  const existing = await env.DB.prepare('SELECT evaluation_json AS evaluationJson FROM checkpoint_attempts WHERE id = ? AND lesson_id = ? LIMIT 1').bind(parsed.data.clientRequestId, parsed.data.lessonId).first<{ evaluationJson: string }>();
  if (existing) {
    const replay = assessmentAttemptResponseSchema.safeParse(JSON.parse(existing.evaluationJson));
    if (replay.success) return Response.json(replay.data, { headers: { 'X-Idempotent-Replay': 'true' } });
  }
  const lesson = await loadLesson(parsed.data.lessonId);
  if (!lesson) return apiError(404, 'LESSON_NOT_FOUND', 'This lesson could not be found.');

  const aiProvider = createAiProvider({
    provider: env.LLM_PROVIDER as 'gemini' | 'openai' | 'deterministic' | undefined,
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL || env.LLM_MODEL,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL || env.LLM_MODEL,
  });

  const assessmentQuestions = await buildAssessmentWithAi(aiProvider, lesson.plan);
  const question =
    assessmentQuestions.find((item) => item.id === parsed.data.questionId) ||
    buildAssessment(lesson.plan).find((item) => item.id === parsed.data.questionId);
  if (!question) return apiError(404, 'ASSESSMENT_QUESTION_NOT_FOUND', 'This question is not part of the final assessment.');

  const result = await evaluateAssessmentAnswerWithAi(
    aiProvider,
    lesson.plan,
    question,
    parsed.data.response,
    parsed.data.clientRequestId,
  );
  try {
    await env.DB.prepare('INSERT INTO checkpoint_attempts (id, lesson_id, checkpoint_id, response, evaluation_json, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(result.attemptId, parsed.data.lessonId, question.id, parsed.data.response, JSON.stringify(result), result.attemptedAt).run();
  } catch {
    const replay = await env.DB.prepare('SELECT evaluation_json AS evaluationJson FROM checkpoint_attempts WHERE id = ? AND lesson_id = ? LIMIT 1').bind(parsed.data.clientRequestId, parsed.data.lessonId).first<{ evaluationJson: string }>();
    if (replay) return Response.json(assessmentAttemptResponseSchema.parse(JSON.parse(replay.evaluationJson)), { headers: { 'X-Idempotent-Replay': 'true' } });
    return apiError(500, 'ASSESSMENT_SAVE_FAILED', 'The answer could not be saved. Please retry.');
  }
  return Response.json(result, { status: 201 });
}
