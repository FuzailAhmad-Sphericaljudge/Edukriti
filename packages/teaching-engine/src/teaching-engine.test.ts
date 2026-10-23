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
  evaluateSafeMath,
  extractQuantities,
  verifyNumericalAnswer,
  buildStepByStepNumericalSolution,
  normalizeToSiUnits,
  GOLDEN_EVAL_SET,
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

test('evaluateSafeMath correctly computes math expressions without code execution', () => {
  assert.equal(evaluateSafeMath('12 / 4'), 3);
  assert.equal(evaluateSafeMath('0.5 * 10 * 4^2'), 80);
  assert.equal(evaluateSafeMath('sqrt(16) + 5'), 9);
  // Rejects unsafe code
  assert.equal(evaluateSafeMath('alert(1)'), null);
  assert.equal(evaluateSafeMath('process.exit()'), null);
});

test('extractQuantities parses physical units from problem statement', () => {
  const problem = 'A circuit has a 12V battery and a 4 ohm resistor. Find the current.';
  const q = extractQuantities(problem);
  assert.equal(q.V, 12);
  assert.equal(q.R, 4);

  const kinematics = 'A 5 kg mass accelerates at 2 m/s^2 for 3 seconds.';
  const kq = extractQuantities(kinematics);
  assert.equal(kq.m, 5);
  assert.equal(kq.a, 2);
  assert.equal(kq.t, 3);
});

test('verifyNumericalAnswer verifies correct solutions and catches arithmetic mistakes', () => {
  const problem = 'A circuit has a 12V battery and a 4 ohm resistor. Calculate current.';
  const correct = 'Using Ohm Law, I = V / R = 12 / 4 = 3 A.';
  const verified = verifyNumericalAnswer(problem, correct);
  assert.equal(verified.isVerified, true);
  assert.equal(verified.computedValue, 3);
  assert.equal(verified.expectedValue, 3);

  const incorrect = 'Using Ohm Law, I = V / R = 12 / 4 = 5 A.';
  const failed = verifyNumericalAnswer(problem, incorrect);
  assert.equal(failed.isVerified, false);
  assert.equal(failed.computedValue, 3);
  assert.equal(failed.expectedValue, 5);
});

test('buildStepByStepNumericalSolution generates structured steps and recomputed result', () => {
  const problem = 'A force acts on a 10 kg object accelerating it at 3 m/s^2. Calculate the force.';
  const solution = buildStepByStepNumericalSolution(problem);
  assert.equal(solution.isSolved, true);
  assert.equal(solution.formula, 'F = m * a');
  assert.equal(solution.steps.length, 3);
  assert.equal(solution.steps[2]?.result, '30');
  assert.equal(solution.steps[2]?.unit, 'N');
  assert.ok(solution.finalAnswer.includes('30 N'));
});

test('golden eval set contains over 100 questions covering all required subjects and intents', () => {
  assert.ok(GOLDEN_EVAL_SET.length >= 100);
  const subjects = new Set(GOLDEN_EVAL_SET.map((q) => q.subject));
  assert.ok(subjects.has('physics'));
  assert.ok(subjects.has('chemistry'));
  assert.ok(subjects.has('mathematics'));
  assert.ok(subjects.has('biology'));
  assert.ok(subjects.has('computer_science'));
  assert.ok(subjects.has('history_polity'));

  for (const item of GOLDEN_EVAL_SET) {
    assert.ok(item.id.length > 0);
    assert.ok(item.question.length > 5);
    assert.ok(item.expectedKeyFacts.length > 0);
  }
});

test('numerical solver accurately solves resistance given voltage and current', () => {
  const problem = 'Calculate the resistance if a 24V supply causes a current of 6A.';
  const sol = buildStepByStepNumericalSolution(problem);
  assert.equal(sol.isSolved, true);
  assert.ok(sol.finalAnswer.includes('4 Ω') || sol.finalAnswer.includes('4 ohms'));
  const verification = verifyNumericalAnswer(problem, sol.finalAnswer, sol.steps);
  assert.equal(verification.isVerified, true);
  assert.equal(verification.computedValue, 4);
});

test('normalizeToSiUnits correctly converts km/h, mA, kW, grams, and minutes to SI base units', () => {
  assert.equal(normalizeToSiUnits(72, 'km/h').value, 20);
  assert.equal(normalizeToSiUnits(72, 'km/h').siUnit, 'm/s');

  assert.equal(normalizeToSiUnits(500, 'mA').value, 0.5);
  assert.equal(normalizeToSiUnits(500, 'mA').siUnit, 'A');

  assert.equal(normalizeToSiUnits(2.5, 'kW').value, 2500);
  assert.equal(normalizeToSiUnits(2.5, 'kW').siUnit, 'W');

  assert.equal(normalizeToSiUnits(250, 'g').value, 0.25);
  assert.equal(normalizeToSiUnits(250, 'g').siUnit, 'kg');

  assert.equal(normalizeToSiUnits(3, 'min').value, 180);
  assert.equal(normalizeToSiUnits(3, 'min').siUnit, 's');
});

test('extractQuantities normalizes non-SI unit prefixes to canonical variables', () => {
  const quantities = extractQuantities('A 500g ball moves at 72 km/h under 500 mA current for 2 minutes');
  assert.equal(quantities.m, 0.5); // 500g -> 0.5 kg
  assert.equal(quantities.v, 20); // 72 km/h -> 20 m/s
  assert.equal(quantities.I, 0.5); // 500 mA -> 0.5 A
  assert.equal(quantities.t, 120); // 2 minutes -> 120 s
});


