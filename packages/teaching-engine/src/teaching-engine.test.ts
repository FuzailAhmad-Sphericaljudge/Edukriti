import assert from 'node:assert/strict';
import test from 'node:test';

import type { LessonRequest } from '@edukriti/contracts';
import { buildAdaptation, buildAssessment, buildDeterministicLessonPlan, buildLearningReport, captionAt, evaluateAssessmentAnswer, evaluateCheckpoint, lessonMinutes, lessonProgress, speechLocale } from './index.ts';

const request: LessonRequest = {
  learnerId: 'demo-learner',
  topic: 'Electricity',
  level: 'beginner',
  language: 'hinglish',
  durationMinutes: 20,
  style: 'simple_examples',
  goal: 'Understand current, voltage, and resistance',
};

test('adapts segment count and total time to the requested duration', () => {
  const shortPlan = buildDeterministicLessonPlan({ ...request, durationMinutes: 5 }, [], 'short', '2026-09-04T15:00:00Z');
  const deepPlan = buildDeterministicLessonPlan({ ...request, durationMinutes: 60 }, [], 'deep', '2026-09-04T15:00:00Z');
  assert.equal(shortPlan.segments.length, 2);
  assert.equal(deepPlan.segments.length, 6);
  assert.equal(lessonMinutes(shortPlan), 5);
  assert.equal(lessonMinutes(deepPlan), 60);
});

test('creates Hinglish teaching narration and checkpoints', () => {
  const plan = buildDeterministicLessonPlan(request, [], 'lesson', '2026-09-04T15:00:00Z');
  assert.match(plan.segments[0]!.narration, /Aaj hum/);
  assert.ok(plan.segments.some((segment) => segment.checkpoint));
});

test('carries retrieved evidence into citations', () => {
  const plan = buildDeterministicLessonPlan(request, [{ sourceId: 'source', chunkId: 'chunk', page: 4, text: 'Resistance opposes the flow of electric current.' }], 'lesson', '2026-09-04T15:00:00Z');
  assert.equal(plan.segments[0]!.citations[0]?.page, 4);
});

test('routes electricity explanations to equation visuals', () => {
  const plan = buildDeterministicLessonPlan(request, [], 'lesson', '2026-09-04T15:00:00Z');
  assert.equal(plan.segments[0]!.visualType, 'equation');
});

test('maps supported lesson languages to safe browser speech locales', () => {
  assert.equal(speechLocale('hindi'), 'hi-IN');
  assert.equal(speechLocale('hinglish'), 'en-IN');
  assert.equal(speechLocale('english'), 'en-IN');
});

test('selects active captions and clamps classroom progress', () => {
  assert.equal(captionAt('First idea. Second idea!', 14), 'Second idea!');
  assert.equal(lessonProgress(1, 4), 50);
  assert.equal(lessonProgress(10, 4), 100);
  assert.equal(lessonProgress(0, 0), 0);
});

test('evaluates checkpoint meaning instead of exact wording', () => {
  const evaluation = evaluateCheckpoint({ id: 'cp', targetConcept: 'Voltage as the driving force', language: 'hinglish' }, 'It is like pressure that pushes charges through the circuit.');
  assert.equal(evaluation.isCorrect, true);
  assert.equal(evaluation.nextAction, 'continue');
});

test('diagnoses a known misconception and changes the explanation', () => {
  const context = { id: 'cp', targetConcept: 'Electric charge and current', language: 'english' } as const;
  const evaluation = evaluateCheckpoint(context, 'Current gets used up by the bulb.');
  const adaptation = buildAdaptation(context, evaluation);
  assert.equal(evaluation.isCorrect, false);
  assert.match(evaluation.misconception ?? '', /consum/i);
  assert.equal(adaptation?.strategy, 'new_analogy');
  assert.match(adaptation?.explanation ?? '', /water pipe/i);
});

test('builds a three-question mixed final assessment for the demo lesson', () => {
  const plan = buildDeterministicLessonPlan(request, [], 'lesson', '2026-09-04T15:00:00Z');
  const assessment = buildAssessment(plan);
  assert.equal(assessment.length, 3);
  assert.deepEqual(assessment.map((question) => question.type), ['mcq', 'mcq', 'short_answer']);
});

test('scores actual assessment responses and builds a learning report', () => {
  const plan = buildDeterministicLessonPlan(request, [], 'lesson', '2026-09-04T15:00:00Z');
  const questions = buildAssessment(plan);
  const attempts = [
    evaluateAssessmentAnswer(plan, questions[0]!, 'a', '550e8400-e29b-41d4-a716-446655440000', '2026-09-04T16:00:00Z'),
    evaluateAssessmentAnswer(plan, questions[1]!, 'a', '550e8400-e29b-41d4-a716-446655440001', '2026-09-04T16:01:00Z'),
    evaluateAssessmentAnswer(plan, questions[2]!, 'Current is the flow of charge around a circuit.', '550e8400-e29b-41d4-a716-446655440002', '2026-09-04T16:02:00Z'),
  ];
  const report = buildLearningReport(plan, attempts, '2026-09-04T16:03:00Z');
  assert.equal(report.scorePercent, 67);
  assert.ok(report.strongConcepts.length > 0);
  assert.ok(report.weakConcepts.length > 0);
});
