import assert from 'node:assert/strict';
import test from 'node:test';

import type { LessonRequest } from '@edukriti/contracts';
import {
  buildAdaptation,
  buildAdaptationWithAi,
  buildAssessment,
  buildAssessmentWithAi,
  buildDeterministicLessonPlan,
  buildLearningReport,
  captionAt,
  evaluateAssessmentAnswer,
  evaluateAssessmentAnswerWithAi,
  evaluateCheckpoint,
  evaluateCheckpointWithAi,
  generateLessonPlanWithAi,
  lessonMinutes,
  lessonProgress,
  speechChunks,
  speechLocale,
  teachingVoiceScore,
} from './index.ts';
import type { AiProvider } from '@edukriti/ai';

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

test('splits narration into natural speaking phrases and prefers neural regional voices', () => {
  assert.deepEqual(speechChunks('First idea. Why does it work? Try it now!'), ['First idea.', 'Why does it work?', 'Try it now!']);
  assert.ok(teachingVoiceScore('Microsoft Neerja Online (Natural)', 'en-IN', 'english') > teachingVoiceScore('Generic English', 'en-US', 'english'));
  assert.ok(teachingVoiceScore('Microsoft Swara Online (Natural)', 'hi-IN', 'hindi') > teachingVoiceScore('Generic Hindi', 'hi-IN', 'hindi'));
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

test('generateLessonPlanWithAi uses AI provider and falls back to deterministic on failure', async () => {
  const plan = buildDeterministicLessonPlan(request, [], 'lesson', '2026-09-04T15:00:00Z');
  const mockProvider: AiProvider = {
    name: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    async generateStructured() {
      return plan;
    },
    async generateText() { return ''; },
    async *stream() { yield ''; },
    async embed() { return []; },
  };

  const aiPlan = await generateLessonPlanWithAi(mockProvider, request, []);
  assert.equal(aiPlan.title, plan.title);

  const failingProvider: AiProvider = {
    name: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    async generateStructured() {
      throw new Error('AI Provider network failure');
    },
    async generateText() { return ''; },
    async *stream() { yield ''; },
    async embed() { return []; },
  };

  const fallbackPlan = await generateLessonPlanWithAi(failingProvider, request, []);
  assert.ok(fallbackPlan.segments.length > 0);
  assert.equal(fallbackPlan.learnerId, request.learnerId);
});

test('evaluateCheckpointWithAi evaluates response via provider and falls back on error', async () => {
  const mockProvider: AiProvider = {
    name: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    async generateStructured() {
      return {
        checkpointId: 'cp-ai',
        isCorrect: true,
        confidence: 0.95,
        understoodConcepts: ['Voltage'],
        misconception: null,
        feedback: 'Excellent explanation!',
        nextAction: 'continue',
      };
    },
    async generateText() { return ''; },
    async *stream() { yield ''; },
    async embed() { return []; },
  };

  const context = { id: 'cp-ai', targetConcept: 'Voltage', language: 'english' as const };
  const evalResult = await evaluateCheckpointWithAi(mockProvider, context, 'Voltage is electrical potential difference.');
  assert.equal(evalResult.isCorrect, true);
  assert.equal(evalResult.confidence, 0.95);

  const failingProvider: AiProvider = {
    ...mockProvider,
    async generateStructured() { throw new Error('Offline'); },
  };
  const fallbackEval = await evaluateCheckpointWithAi(failingProvider, context, 'Electric current pushes voltage.');
  assert.equal(typeof fallbackEval.isCorrect, 'boolean');
});

test('buildAssessmentWithAi creates dynamic questions for non-electricity topics', async () => {
  const mockProvider: AiProvider = {
    name: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    async generateStructured() {
      return {
        questions: [
          {
            type: 'mcq',
            prompt: 'What organelle performs photosynthesis?',
            choices: [
              { id: 'a', text: 'Chloroplast' },
              { id: 'b', text: 'Mitochondria' },
              { id: 'c', text: 'Ribosome' },
            ],
            expectedAnswer: 'a',
            targetConcept: 'Chloroplast function',
          },
          {
            type: 'mcq',
            prompt: 'What gas is released during photosynthesis?',
            choices: [
              { id: 'a', text: 'Carbon Dioxide' },
              { id: 'b', text: 'Oxygen' },
            ],
            expectedAnswer: 'b',
            targetConcept: 'Photosynthesis products',
          },
          {
            type: 'short_answer',
            prompt: 'Explain the light-dependent reactions in your own words.',
            expectedAnswer: 'light chlorophyll atp thylakoid water oxygen',
            targetConcept: 'Light-dependent reactions',
          },
        ],
      };
    },
    async generateText() { return ''; },
    async *stream() { yield ''; },
    async embed() { return []; },
  };

  const plan = buildDeterministicLessonPlan({ ...request, topic: 'Photosynthesis' }, [], 'bio-lesson', '2026-09-04T15:00:00Z');
  const questions = await buildAssessmentWithAi(mockProvider, plan);
  assert.equal(questions.length, 3);
  assert.equal(questions[0]?.targetConcept, 'Chloroplast function');
  assert.equal(questions[2]?.type, 'short_answer');
});

test('buildDeterministicLessonPlan supports expanded curriculum topics without placeholder text', () => {
  const topics = [
    'Photosynthesis and light reactions',
    'Chemical bonding and covalent molecules',
    'Calculus and derivatives',
    'Plate tectonics and earthquakes',
  ];

  for (const topic of topics) {
    const plan = buildDeterministicLessonPlan({ ...request, topic, durationMinutes: 20 });
    assert.equal(plan.segments.length, 4);
    assert.equal(plan.segments.some((s) => s.title.includes('Foundations of')), false);
  }
});

test('buildAssessment handles Newton laws with tailored physics questions', () => {
  const plan = buildDeterministicLessonPlan({ ...request, topic: 'Newton Laws of Motion', durationMinutes: 20 });
  const questions = buildAssessment(plan);
  assert.equal(questions.length, 3);
  assert.equal(questions[0]?.targetConcept, 'Newton’s First Law');
  assert.equal(questions[1]?.targetConcept, 'Newton’s Second Law');
});

