import assert from 'node:assert/strict';
import test from 'node:test';
import type { LessonRequest, TutorRequest } from '@edukriti/contracts';
import { generateLessonPlan } from '../lib/lesson-provider.ts';
import { answerTutorQuestion } from '../lib/tutor-provider.ts';

const mockRequest: LessonRequest = {
  learnerId: 'learner-123',
  topic: 'Newton Laws of Motion',
  level: 'beginner',
  language: 'hinglish',
  durationMinutes: 20,
  style: 'simple_examples',
  goal: 'Understand inertia and action-reaction',
};

test('generateLessonPlan returns deterministic fallback when no API keys are provided', async () => {
  const result = await generateLessonPlan(mockRequest, [], 'lesson-123', {});
  assert.equal(result.provider, 'deterministic');
  assert.equal(result.plan.id, 'lesson-123');
  assert.equal(result.plan.segments.length, 4);
  assert.match(result.plan.title, /Newton/i);
});

test('answerTutorQuestion answers student question using fallback when offline', async () => {
  const planResult = await generateLessonPlan(mockRequest, [], 'lesson-123', {});
  const tutorReq: TutorRequest = {
    lessonId: 'lesson-123',
    question: 'Why does a ball stop rolling on grass?',
    history: [],
  };

  const response = await answerTutorQuestion(planResult.plan, tutorReq, {});
  assert.equal(response.provider, 'deterministic');
  assert.ok(response.answer.length > 20);
  assert.ok(response.followUpQuestion.length > 5);
});

test('generateLessonPlan routes to Gemini when GEMINI_API_KEY is configured', async () => {
  const originalFetch = globalThis.fetch;
  try {
    const plan = await generateLessonPlan(mockRequest, [], 'lesson-123', {});
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(plan.plan) }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const result = await generateLessonPlan(mockRequest, [], 'lesson-123', {
      geminiApiKey: 'test-gemini-key',
      provider: 'gemini',
    });
    assert.equal(result.provider, 'gemini');
    assert.equal(result.plan.id, 'lesson-123');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('answerTutorQuestion routes to Gemini when GEMINI_API_KEY is configured', async () => {
  const originalFetch = globalThis.fetch;
  try {
    const planResult = await generateLessonPlan(mockRequest, [], 'lesson-123', {});
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      answer: 'Friction between the grass and the ball creates an opposing force.',
                      followUpQuestion: 'What would happen on a frictionless ice surface?',
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const response = await answerTutorQuestion(
      planResult.plan,
      { lessonId: 'lesson-123', question: 'Why does it stop?', history: [] },
      { geminiApiKey: 'test-gemini-key', provider: 'gemini' },
    );

    assert.equal(response.provider, 'gemini');
    assert.match(response.answer, /friction/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
