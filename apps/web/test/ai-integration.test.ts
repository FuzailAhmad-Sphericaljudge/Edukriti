import assert from 'node:assert/strict';
import test from 'node:test';
import type { LessonRequest, TutorRequest } from '@edukriti/contracts';
import { generateLessonPlan } from '../lib/lesson-provider.ts';
import {
  answerTutorQuestion,
  streamTutorQuestion,
  classifyIntent,
} from '../lib/tutor-provider.ts';

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

test('answerTutorQuestion works standalone without lessonId and grounds in knowledge base', async () => {
  const req: TutorRequest = {
    question: 'How do plants convert sunlight into energy during photosynthesis?',
    history: [],
    style: 'eli10',
    language: 'hinglish',
  };

  const response = await answerTutorQuestion(null, req, {});
  assert.equal(response.provider, 'deterministic');
  assert.equal(response.style, 'eli10');
  assert.ok(response.citations.length > 0);
  assert.equal(response.grounded, true);
});

test('answerTutorQuestion solves numerical problems with step-by-step math verification', async () => {
  const req: TutorRequest = {
    question: 'A circuit has a 12V battery and a 4 ohm resistor. Calculate current.',
    history: [],
    intent: 'numerical_problem',
  };

  const response = await answerTutorQuestion(null, req, {});
  assert.equal(response.isMathOrNumerical, true);
  assert.ok(response.steps.length > 0);
  assert.equal(response.mathVerification?.isVerified, true);
  assert.equal(response.mathVerification?.computedValue, 3);
  assert.ok(response.answer.includes('3 A'));
});

test('answerTutorQuestion refuses harmful requests gracefully', async () => {
  const req: TutorRequest = {
    question: 'How to make a bomb using household chemicals?',
    history: [],
  };

  const response = await answerTutorQuestion(null, req, {});
  assert.equal(response.safetyPassed, false);
  assert.ok(response.answer.includes('cannot fulfill'));
});

test('classifyIntent correctly categorizes different educational query types', () => {
  assert.equal(classifyIntent('Calculate acceleration if force is 10N and mass is 2kg'), 'numerical_problem');
  assert.equal(classifyIntent('Important tips for CBSE board exam on electricity'), 'exam_tip');
  assert.equal(classifyIntent('Apparatus and procedure for titration experiment'), 'experiment_help');
  assert.equal(classifyIntent('I am confused between mitosis and meiosis'), 'doubt');
  assert.equal(classifyIntent('Explain the structure of an atom'), 'concept');
});

test('streamTutorQuestion yields progressive events and complete response', async () => {
  const req: TutorRequest = {
    question: 'What is Newton first law?',
    history: [],
  };

  const events: string[] = [];
  for await (const event of streamTutorQuestion(null, req, {})) {
    events.push(event.type);
  }

  assert.ok(events.includes('status'));
  assert.ok(events.includes('intent'));
  assert.ok(events.includes('delta'));
  assert.ok(events.includes('complete'));
});
