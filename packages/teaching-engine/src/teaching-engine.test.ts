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
  resolveConceptGraph,
  buildSpokenStyleNarration,
  buildCheckpointRubric,
  CONCEPT_KNOWLEDGE_GRAPH,
  evaluateCheckpointRubric,
  buildAdaptationV2,
} from './index.ts';
import { checkpointRubricSchema } from '@edukriti/contracts';
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

test('generateLessonPlanWithAi validates interactive visual manifests against vetted registry and sanitizes invalid params', async () => {
  const plan = buildDeterministicLessonPlan(request, [], 'lesson', '2026-09-04T15:00:00Z');
  // Plan with an invalid parameter value that violates Zod schema (e.g. voltage = 9999 when max is 100)
  const aiGeneratedWithBadParams = {
    ...plan,
    segments: plan.segments.map((s, idx) => (idx === 0 ? {
      ...s,
      interactive: {
        kind: 'sim' as const,
        id: 'circuit-builder-dc',
        params: { voltage: 9999, resistance: 4 }, // 9999 exceeds max 100
      },
    } : s)),
  };

  const mockProvider: AiProvider = {
    name: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    async generateStructured() {
      return aiGeneratedWithBadParams;
    },
    async generateText() { return ''; },
    async *stream() { yield ''; },
    async embed() { return []; },
  };

  const cleanedPlan = await generateLessonPlanWithAi(mockProvider, request, []);
  assert.ok(cleanedPlan.segments[0]?.interactive);
  // Must fall back to safe default params
  assert.equal(cleanedPlan.segments[0]?.interactive?.id, 'circuit-builder-dc');
  assert.ok(Number(cleanedPlan.segments[0]?.interactive?.params.voltage) <= 100);
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

test('buildStepByStepNumericalSolution introduces SI unit conversion step when non-SI units are detected', () => {
  const sol = buildStepByStepNumericalSolution('Calculate the resistance if a 24V supply causes a current of 500 mA.');
  assert.equal(sol.isSolved, true);
  assert.equal(sol.steps.length, 4);
  assert.equal(sol.steps[1]?.title, 'Standardize to SI Base Units');
  assert.ok(sol.steps[1]?.explanation.includes('500 mA = 0.5 A'));
  assert.equal(sol.steps[3]?.result, '48');
  assert.equal(sol.steps[3]?.unit, 'Ω');
});

test('resolveConceptGraph returns topological prerequisite order where fundamentals precede dependent concepts', () => {
  const nodes = resolveConceptGraph('Electric circuits and Ohm law', 4);
  assert.ok(nodes.length >= 3);
  const ids = nodes.map((n) => n.id);
  // Charge must precede Ohms law
  const chargeIdx = ids.indexOf('electric_charge');
  const voltageIdx = ids.indexOf('voltage_potential');
  const ohmIdx = ids.indexOf('ohms_law');
  assert.ok(chargeIdx !== -1);
  assert.ok(voltageIdx !== -1);
  assert.ok(ohmIdx !== -1);
  assert.ok(chargeIdx < ohmIdx, 'Electric charge must precede Ohm law');
  assert.ok(voltageIdx < ohmIdx, 'Voltage must precede Ohm law');
});

test('resolveConceptGraph resolves STEM topics across physics, chemistry, biology, math, and CS', () => {
  const physics = resolveConceptGraph('Newton laws of motion');
  assert.ok(physics.some((n) => n.id === 'newtons_first_law'));

  const chem = resolveConceptGraph('Chemical bonding and octet rule');
  assert.ok(chem.some((n) => n.id === 'octet_rule_bonding'));

  const math = resolveConceptGraph('Quadratic equations and roots');
  assert.ok(math.some((n) => n.id === 'quadratic_discriminant'));

  const bio = resolveConceptGraph('Photosynthesis in plant chloroplast');
  assert.ok(bio.some((n) => n.id === 'photosynthesis_light_reactions'));

  const cs = resolveConceptGraph('Binary search and big-o complexity');
  assert.ok(cs.some((n) => n.id === 'binary_search_complexity'));
});

test('buildSpokenStyleNarration creates rich spoken narration in English, Hindi, and Hinglish with exam and practical variants', () => {
  const node = CONCEPT_KNOWLEDGE_GRAPH.ohms_law;
  assert.ok(node, 'Ohm law node must exist');

  const enStandard = buildSpokenStyleNarration(node, 'english', 'standard');
  assert.ok(enStandard.includes('Ohm’s Law'));
  assert.ok(enStandard.includes('analogy'));
  assert.ok(enStandard.includes('misconception') || enStandard.includes('truth'));

  const hiExam = buildSpokenStyleNarration(node, 'hindi', 'exam_focused');
  assert.ok(hiExam.includes('नमस्ते'));
  assert.ok(hiExam.includes('परीक्षा'));
  assert.ok(hiExam.includes('मुख्य सिद्धांत'));

  const hinglishPractical = buildSpokenStyleNarration(node, 'hinglish', 'practical');
  assert.ok(hinglishPractical.includes('Hello'));
  assert.ok(hinglishPractical.includes('practical lab'));
  assert.ok(hinglishPractical.includes('How it Works'));
});

test('buildCheckpointRubric creates validated rubric schema with key ideas and misconceptions', () => {
  const node = CONCEPT_KNOWLEDGE_GRAPH.newtons_first_law;
  assert.ok(node);
  const rubric = buildCheckpointRubric(node, 'cp-test-newton-1');
  const validated = checkpointRubricSchema.parse(rubric);
  assert.equal(validated.checkpointId, 'cp-test-newton-1');
  assert.equal(validated.targetConcept, node.conceptName);
  assert.ok(validated.keyIdeas.length >= 2);
  assert.ok(validated.commonMisconceptions.length >= 1);
  assert.ok(validated.passingCriteria.length > 10);
});

test('buildDeterministicLessonPlan enriches lesson with concept graph nodes, interactive visual, rubrics, and spaced revision', () => {
  const plan = buildDeterministicLessonPlan({
    ...request,
    topic: 'Electric circuits and Ohm law',
    variantMode: 'practical',
  });

  assert.equal(plan.variantMode, 'practical');
  assert.ok(plan.prerequisiteConcepts.length > 0);
  assert.ok(plan.conceptGraphNodes.length > 0);
  assert.ok(plan.spacedRevision.length > 0);

  // Check interactive manifest attachment
  const segmentWithVisual = plan.segments.find((s) => s.interactive);
  assert.ok(segmentWithVisual, 'At least one segment must have interactive visual manifest');
  assert.equal(segmentWithVisual?.interactive?.id, 'circuit-builder-dc');
  assert.equal(segmentWithVisual?.interactive?.kind, 'sim');

  // Check rubric attachment on checkpoints
  const segmentWithCheckpoint = plan.segments.find((s) => s.checkpoint?.rubric);
  assert.ok(segmentWithCheckpoint?.checkpoint?.rubric, 'Checkpoint must include grading rubric');
  assert.ok(segmentWithCheckpoint.checkpoint.rubric.keyIdeas.length >= 1);
  assert.ok(segmentWithCheckpoint.checkpoint.rubric.passingCriteria.length > 0);
});

test('evaluateCheckpointRubric scores key ideas and identifies common misconceptions with matching strategies', () => {
  const context = {
    id: 'cp-ohm-1',
    targetConcept: 'Ohm’s Law & Electrical Resistance',
    language: 'english' as const,
  };

  // Misconception: increasing voltage increases resistance
  const evalMisconception = evaluateCheckpointRubric(
    context,
    'If you increase voltage, the resistance increases because R = V / I.',
  );
  assert.equal(evalMisconception.isCorrect, false);
  assert.ok(evalMisconception.misconception);
  assert.equal(evalMisconception.nextAction, 'visual_walkthrough');

  // Correct conceptual answer
  const evalCorrect = evaluateCheckpointRubric(
    context,
    'For ohmic conductors at constant temperature, resistance is an intrinsic physical property that remains constant, so doubling voltage doubles current.',
  );
  assert.equal(evalCorrect.isCorrect, true);
  assert.equal(evalCorrect.nextAction, 'continue');
  assert.ok(evalCorrect.rubricScore! >= 50);
});

test('buildAdaptationV2 supports 5 pedagogical strategies and escalates across remediation attempts', () => {
  const context = {
    id: 'cp-adapt-test',
    targetConcept: 'Ohm’s Law & Electrical Resistance',
    language: 'hinglish' as const,
  };

  const failedEval = evaluateCheckpointRubric(context, 'Increasing voltage increases resistance.');

  // Attempt 1: visual walkthrough recommended by Ohm rubric
  const adapt1 = buildAdaptationV2(context, failedEval, 1);
  assert.ok(adapt1);
  assert.equal(adapt1.remediationAttempt, 1);
  assert.equal(adapt1.strategy, 'visual_walkthrough');

  // Explicit strategy: worked_example
  const evalWorked = { ...failedEval, nextAction: 'worked_example' as const };
  const adaptWorked = buildAdaptationV2(context, evalWorked, 1);
  assert.equal(adaptWorked?.strategy, 'worked_example');
  assert.ok(adaptWorked?.explanation.includes('I = V / R'));

  // Explicit strategy: interactive
  const evalInteractive = { ...failedEval, nextAction: 'interactive' as const };
  const adaptInteractive = buildAdaptationV2(context, evalInteractive, 1);
  assert.equal(adaptInteractive?.strategy, 'interactive');
  assert.ok(adaptInteractive?.interactive);
  assert.equal(adaptInteractive?.interactive?.id, 'circuit-builder-dc');

  // Attempt 3 escalation: reverts to simpler prerequisite (Voltage & Electric Potential)
  const adapt3 = buildAdaptationV2(context, { ...failedEval, nextAction: 'new_analogy' as const }, 3);
  assert.equal(adapt3?.strategy, 'simpler_prerequisite');
  assert.equal(adapt3?.remediationAttempt, 3);
});

test('buildAssessment generates tailored assessments for all 4 canonical topics', () => {
  // React
  const reactPlan = buildDeterministicLessonPlan({ ...request, topic: 'React Components and Props' });
  const reactQuestions = buildAssessment(reactPlan);
  assert.equal(reactQuestions.length, 3);
  assert.ok(reactQuestions[0]?.targetConcept.includes('Props') || reactQuestions[0]?.targetConcept.includes('React'));

  // AI & ML
  const aiPlan = buildDeterministicLessonPlan({ ...request, topic: 'Artificial Intelligence and Machine Learning' });
  const aiQuestions = buildAssessment(aiPlan);
  assert.equal(aiQuestions.length, 3);
  assert.ok(aiQuestions[0]?.targetConcept.includes('Training') || aiQuestions[0]?.targetConcept.includes('Learning'));

  // Newton Laws
  const newtonPlan = buildDeterministicLessonPlan({ ...request, topic: 'Newton Laws of Motion' });
  const newtonQuestions = buildAssessment(newtonPlan);
  assert.equal(newtonQuestions.length, 3);
  assert.ok(newtonQuestions[0]?.targetConcept.includes('Newton'));

  // Electricity
  const electricPlan = buildDeterministicLessonPlan({ ...request, topic: 'Electricity and Ohm Law' });
  const electricQuestions = buildAssessment(electricPlan);
  assert.equal(electricQuestions.length, 3);
  assert.ok(electricQuestions[0]?.targetConcept.includes('Voltage') || electricQuestions[0]?.targetConcept.includes('Ohm'));
});

test('buildAssessment prioritizes questions targeting learner weak concepts', () => {
  const plan = buildDeterministicLessonPlan(request);
  const regularQuestions = buildAssessment(plan);
  const prioritizedQuestions = buildAssessment(plan, ['Resistance and Ohm’s Law']);

  assert.equal(regularQuestions[0]?.targetConcept, 'Voltage as the driving force');
  // With weak concept prioritized, Ohm's law question is placed first
  assert.equal(prioritizedQuestions[0]?.targetConcept, 'Resistance and Ohm’s Law');
});

test('resolveConceptGraph resolves new biology, chemistry, physics, and CS curriculum topics', () => {
  // Biology: Mitosis & DNA
  const bioNodes = resolveConceptGraph('Mitosis and DNA double helix base pairing', 3);
  assert.ok(bioNodes.length >= 2);
  const bioIds = bioNodes.map((n) => n.id);
  assert.ok(bioIds.includes('cell_division_mitosis'));
  assert.ok(bioIds.includes('dna_double_helix'));

  // Chemistry: Acid-Base Titration
  const chemNodes = resolveConceptGraph('Acid-base titration and neutralization curve', 3);
  assert.ok(chemNodes.length >= 2);
  const chemIds = chemNodes.map((n) => n.id);
  assert.ok(chemIds.includes('acid_base_titration'));
  assert.equal(chemNodes.find((n) => n.id === 'acid_base_titration')?.suggestedVisualId, 'acid-base-titration-lab');

  // Physics: Harmonic Motion & Pendulum
  const pendulumNodes = resolveConceptGraph('Simple harmonic motion and pendulum oscillations', 3);
  assert.ok(pendulumNodes.length >= 2);
  const pendulumIds = pendulumNodes.map((n) => n.id);
  assert.ok(pendulumIds.includes('pendulum_harmonic_motion'));
  assert.equal(pendulumNodes.find((n) => n.id === 'pendulum_harmonic_motion')?.suggestedVisualId, 'pendulum-harmonic-lab');

  // CS: Sorting Algorithms & Complexity
  const sortNodes = resolveConceptGraph('QuickSort and MergeSort algorithmic time complexity', 2);
  assert.ok(sortNodes.some((n) => n.id === 'sorting_algorithms_complexity' || n.id === 'binary_search_complexity'));

  // Earth Science: Tectonic Plates
  const earthNodes = resolveConceptGraph('Tectonic plate boundaries and earthquake ring of fire', 2);
  assert.ok(earthNodes.some((n) => n.id === 'tectonic_plates_boundaries'));
});

test('evaluates acid-base titration and pendulum misconceptions using specialized rubrics', () => {
  // Titration rubric test
  const titrationContext = {
    id: 'cp-titrate-1',
    targetConcept: 'Acid-Base Titration & Neutralization',
    language: 'english' as const,
  };
  const titrationEval = evaluateCheckpointRubric(
    titrationContext,
    'The equivalence point of all acid-base titrations is always at pH 7 because it is neutral.',
  );
  assert.equal(titrationEval.isCorrect, false);
  assert.ok(titrationEval.misconception);
  assert.equal(titrationEval.nextAction, 'worked_example');

  // Pendulum rubric test
  const pendulumContext = {
    id: 'cp-pendulum-1',
    targetConcept: 'Simple Harmonic Motion & The Pendulum',
    language: 'english' as const,
  };
  const pendulumEval = evaluateCheckpointRubric(
    pendulumContext,
    'A heavier pendulum bob swings faster and has a shorter period because of gravity.',
  );
  assert.equal(pendulumEval.isCorrect, false);
  assert.ok(pendulumEval.misconception);
  assert.equal(pendulumEval.nextAction, 'interactive');
});

test('verifies multilingual rubric feedback in Hindi and Hinglish with key idea acknowledgment', () => {
  // 1. Hindi correct
  const hindiContext = {
    id: 'cp-hindi-1',
    targetConcept: 'Ohm’s Law & Electrical Resistance',
    language: 'hindi' as const,
  };
  const hindiCorrect = evaluateCheckpointRubric(
    hindiContext,
    'Voltage is electrical pressure that drives current proportional to voltage and inversely to resistance.',
  );
  assert.equal(hindiCorrect.isCorrect, true);
  assert.ok(hindiCorrect.feedback.includes('उत्कृष्ट!'));
  assert.ok(hindiCorrect.feedback.includes('Ohm’s Law & Electrical Resistance'));

  // 2. Hindi with misconception
  const hindiMisconception = evaluateCheckpointRubric(
    hindiContext,
    'Increasing voltage increases electrical resistance across the resistor.',
  );
  assert.equal(hindiMisconception.isCorrect, false);
  assert.ok(hindiMisconception.feedback.includes('परंतु यहाँ एक सामान्य भ्रम है'));

  // 3. Hinglish correct
  const hinglishContext = {
    id: 'cp-hinglish-1',
    targetConcept: 'Ohm’s Law & Electrical Resistance',
    language: 'hinglish' as const,
  };
  const hinglishCorrect = evaluateCheckpointRubric(
    hinglishContext,
    'Current is the rate of flow of charge driven by voltage potential difference.',
  );
  assert.equal(hinglishCorrect.isCorrect, true);
  assert.ok(hinglishCorrect.feedback.includes('Bilkul sahi!'));

  // 4. Hinglish with misconception and partial acknowledgment
  const hinglishMisconception = evaluateCheckpointRubric(
    hinglishContext,
    'Current flows due to voltage potential difference, but current gets used up along the circuit wire.',
  );
  assert.equal(hinglishMisconception.isCorrect, false);
  assert.ok(hinglishMisconception.feedback.includes('Lekin yahan ek common confusion hai'));
  assert.ok(hinglishMisconception.feedback.includes('Aapne sahi'));
});







