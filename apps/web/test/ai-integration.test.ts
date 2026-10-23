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
