import assert from 'node:assert/strict';
import test from 'node:test';

import { practiceQuestionSchema } from '@edukriti/contracts';
import {
  PARAMETRIC_TEMPLATES,
  getTemplateById,
  getTemplatesBySubject,
  getTemplatesByConcept,
  generateParametricQuestion,
  getParametricMetrics,
  getImportedQuestions,
  getImportedDatasetMetrics,
  getImportedQuestionsByConcept,
  verifyQuestionWithIndependentSolve,
  verifyQuestionDeterministically,
  compareAnswers,
  deduplicateQuestions,
  jaccardSimilarity,
  difficultyToRaschB,
  calculateProbabilityOfSuccess,
  updateLearnerTheta,
  calculateNextSpacedInterval,
  selectNextAdaptiveQuestion,
  createMockTest,
  evaluateMockTest,
  SeededRng,
} from './index.ts';

test('SeededRng produces deterministic pseudo-random sequences for same seed', () => {
  const rng1 = new SeededRng(12345);
  const rng2 = new SeededRng(12345);

  const seq1 = [rng1.nextInt(1, 100), rng1.nextFloat(0, 10, 2), rng1.choice(['x', 'y', 'z'])];
  const seq2 = [rng2.nextInt(1, 100), rng2.nextFloat(0, 10, 2), rng2.choice(['x', 'y', 'z'])];

  assert.deepEqual(seq1, seq2);

  // Different seed produces different output
  const rng3 = new SeededRng(99999);
  const seq3 = [rng3.nextInt(1, 100), rng3.nextFloat(0, 10, 2), rng3.choice(['x', 'y', 'z'])];
  assert.notDeepEqual(seq1, seq3);
});

test('PARAMETRIC_TEMPLATES contains at least 60 distinct template families', () => {
  assert.ok(PARAMETRIC_TEMPLATES.length >= 60, `Expected at least 60 templates, found ${PARAMETRIC_TEMPLATES.length}`);
  assert.equal(PARAMETRIC_TEMPLATES.length, 60);

  const familyIds = new Set<string>();
  for (const template of PARAMETRIC_TEMPLATES) {
    assert.ok(template.familyId, 'Template must have familyId');
    assert.ok(!familyIds.has(template.familyId), `Duplicate familyId found: ${template.familyId}`);
    familyIds.add(template.familyId);
  }
});

test('every parametric template generates valid PracticeQuestion conforming to Zod schema', () => {
  for (const template of PARAMETRIC_TEMPLATES) {
    const seed = 1001;
    const q = template.generate(seed);

    // Validate using runtime Zod contract
    const parsed = practiceQuestionSchema.parse(q);
    assert.equal(parsed.templateFamilyId, template.familyId);
    assert.equal(parsed.subject, template.subject);
    assert.ok(parsed.prompt.length > 10);
    assert.ok(parsed.solutionSteps.length >= 1);
    assert.equal(parsed.verified, true);

    // For MCQ questions, ensure all choices are unique and expectedAnswer exists
    if (parsed.type === 'mcq' && parsed.choices) {
      assert.ok(parsed.choices.length >= 2, `Template ${template.familyId} has < 2 choices`);
      const texts = new Set(parsed.choices.map((c) => c.text));
      assert.equal(texts.size, parsed.choices.length, `Duplicate choice text in template ${template.familyId}`);
      assert.ok(
        parsed.choices.some((c) => c.id === parsed.expectedAnswer),
        `Expected answer ${parsed.expectedAnswer} not found in choices for ${template.familyId}`,
      );
      assert.ok(
        parsed.distractorExplanations.length > 0,
        `Distractor explanations missing for ${template.familyId}`,
      );
    }

    // Verify combinations estimate > 0
    const combinations = template.estimateCombinations();
    assert.ok(combinations > 0, `Combinations estimate for ${template.familyId} should be > 0`);
  }
});

test('generateParametricQuestion reproduces exact question for same seed and varies with different seed', () => {
  const familyId = 'physics_ohms_law_current';

  const q1 = generateParametricQuestion(familyId, 555);
  const q2 = generateParametricQuestion(familyId, 555);
  const q3 = generateParametricQuestion(familyId, 777);

  assert.equal(q1.prompt, q2.prompt);
  assert.equal(q1.expectedAnswer, q2.expectedAnswer);
  assert.deepEqual(q1.choices, q2.choices);

  // Different seeds produce different parameter values
  assert.notEqual(q1.prompt, q3.prompt);
});

test('getTemplatesBySubject and getTemplatesByConcept retrieve expected subsets', () => {
  const mathTemplates = getTemplatesBySubject('mathematics');
  assert.equal(mathTemplates.length, 20);

  const physicsTemplates = getTemplatesBySubject('physics');
  assert.equal(physicsTemplates.length, 20);

  const chemTemplates = getTemplatesBySubject('chemistry');
  assert.equal(chemTemplates.length, 15);

  const bioTemplates = getTemplatesBySubject('biology');
  assert.equal(bioTemplates.length, 3);

  const csTemplates = getTemplatesBySubject('computer_science');
  assert.equal(csTemplates.length, 2);

  // Concept lookup
  const ohmsLawTemplates = getTemplatesByConcept('ohms_law');
  assert.ok(ohmsLawTemplates.length >= 1);
  assert.ok(ohmsLawTemplates.some((t) => t.familyId === 'physics_ohms_law_current'));
});

test('getParametricMetrics computes accurate registry numbers without hardcoded claims', () => {
  const metrics = getParametricMetrics();

  // Rule 4 Honest numbers: must match real template registry
  assert.equal(metrics.totalTemplateFamilies, 60);
  assert.equal(metrics.familyIds.length, 60);

  assert.equal(metrics.bySubject.mathematics, 20);
  assert.equal(metrics.bySubject.physics, 20);
  assert.equal(metrics.bySubject.chemistry, 15);
  assert.equal(metrics.bySubject.biology, 3);
  assert.equal(metrics.bySubject.computer_science, 2);

  // Over 50,000 combinatorial instances from parameter ranges
  assert.ok(
    metrics.totalCombinationsEstimate > 50_000,
    `Total combinations estimate was ${metrics.totalCombinationsEstimate}, expected > 50,000`,
  );
});

test('imported openly licensed question datasets conform to Zod schema and licensing requirements', () => {
  const imported = getImportedQuestions();
  assert.ok(imported.length >= 15, `Expected at least 15 curated questions across datasets, found ${imported.length}`);

  const allowedLicenses = new Set(['MIT', 'CC BY-SA 4.0', 'Apache-2.0']);

  for (const q of imported) {
    const parseResult = practiceQuestionSchema.safeParse(q);
    assert.ok(parseResult.success, `Question ${q.id} failed validation: ${JSON.stringify(parseResult.error?.issues)}`);
    assert.ok(allowedLicenses.has(q.license), `Question ${q.id} has unapproved license: ${q.license}`);
    assert.ok(q.datasetId, `Question ${q.id} missing datasetId`);
    assert.ok(q.solutionSteps.length > 0, `Question ${q.id} must have step-by-step solution`);
    assert.ok(q.verified, `Question ${q.id} must be verified`);
  }
});

test('getImportedDatasetMetrics computes accurate metrics from real question bank', () => {
  const metrics = getImportedDatasetMetrics();
  assert.equal(metrics.totalImportedQuestions, 16);
  assert.equal(metrics.byDataset.gsm8k, 5);
  assert.equal(metrics.byDataset.math_hendrycks, 3);
  assert.equal(metrics.byDataset.arc, 5);
  assert.equal(metrics.byDataset.openbookqa, 3);
  assert.equal(metrics.verifiedCount, 16);
  assert.equal(metrics.byLicense['MIT'], 8);
  assert.equal(metrics.byLicense['CC BY-SA 4.0'], 5);
  assert.equal(metrics.byLicense['Apache-2.0'], 3);
});

test('getImportedQuestionsByConcept filters questions by concept keyword', () => {
  const ohmQuestions = getImportedQuestionsByConcept('ohms_law');
  assert.ok(ohmQuestions.length >= 1);
  assert.ok(ohmQuestions.some((q) => q.id === 'obqa-001'));

  const newtonQuestions = getImportedQuestionsByConcept('newtons_laws');
  assert.ok(newtonQuestions.length >= 1);
  assert.ok(newtonQuestions.some((q) => q.id === 'arc-001'));
});

test('compareAnswers correctly matches normalized strings and numeric values within tolerance', () => {
  assert.ok(compareAnswers('a', 'A').matches);
  assert.ok(compareAnswers('Option B', 'b').matches);
  assert.ok(compareAnswers('12.5 A', '12.48 A', 0.05).matches);
  assert.ok(!compareAnswers('a', 'c').matches);
  assert.ok(!compareAnswers('10', '25', 0.1).matches);
});

test('verifyQuestionWithIndependentSolve marks question as verified when independent solve agrees', async () => {
  const mockQuestion: any = {
    id: 'test-q-01',
    type: 'mcq',
    conceptIds: ['ohms_law'],
    subject: 'physics',
    grade: 'Grade 10',
    difficulty: 'easy',
    prompt: 'What is the SI unit of electric resistance?',
    choices: [
      { id: 'a', text: 'Ohm' },
      { id: 'b', text: 'Volt' },
      { id: 'c', text: 'Ampere' },
      { id: 'd', text: 'Watt' },
    ],
    expectedAnswer: 'a',
    solutionSteps: [{ stepNumber: 1, title: 'Definition', formula: 'R = V/I', explanation: 'Unit is Ohm.' }],
    commonErrorTags: [],
    source: 'Test Source',
    license: 'MIT',
    verified: false,
    createdAt: '2026-10-24T12:00:00.000Z',
  };

  const mockAgreeingProvider: any = {
    generateStructured: async () => ({
      answer: 'a',
      confidence: 0.98,
      justification: 'Ohm is the standard unit of electrical resistance defined by Ohm’s Law.',
    }),
  };

  const verified = await verifyQuestionWithIndependentSolve(mockQuestion, mockAgreeingProvider);
  assert.equal(verified.verified, true);
  assert.ok(verified.verifiedReason.includes('Dual independent solve agreement confirmed'));
});

test('verifyQuestionWithIndependentSolve flags question as unverified when independent solve disagrees', async () => {
  const mockQuestion: any = {
    id: 'test-q-02',
    type: 'mcq',
    conceptIds: ['ohms_law'],
    subject: 'physics',
    grade: 'Grade 10',
    difficulty: 'easy',
    prompt: 'What is the SI unit of electric resistance?',
    choices: [
      { id: 'a', text: 'Ohm' },
      { id: 'b', text: 'Volt' },
    ],
    expectedAnswer: 'a',
    solutionSteps: [{ stepNumber: 1, title: 'Definition', formula: 'R = V/I', explanation: 'Unit is Ohm.' }],
    commonErrorTags: [],
    source: 'Test Source',
    license: 'MIT',
    verified: true,
    createdAt: '2026-10-24T12:00:00.000Z',
  };

  const mockDisagreeingProvider: any = {
    generateStructured: async () => ({
      answer: 'b',
      confidence: 0.9,
      justification: 'Volt is the unit of potential.',
    }),
  };

  const flagged = await verifyQuestionWithIndependentSolve(mockQuestion, mockDisagreeingProvider);
  assert.equal(flagged.verified, false);
  assert.ok(flagged.verifiedReason.includes('disagreement detected'));
});

test('verifyQuestionDeterministically catches missing answer, duplicate choices, and missing steps', () => {
  const validQ: any = {
    id: 'valid-q',
    type: 'mcq',
    prompt: 'Question?',
    choices: [{ id: 'a', text: 'One' }, { id: 'b', text: 'Two' }],
    expectedAnswer: 'a',
    solutionSteps: [{ stepNumber: 1, title: 'Step', explanation: 'Explain' }],
  };
  assert.equal(verifyQuestionDeterministically(validQ).verified, true);

  const missingStepQ: any = { ...validQ, solutionSteps: [] };
  assert.equal(verifyQuestionDeterministically(missingStepQ).verified, false);

  const missingChoiceQ: any = { ...validQ, expectedAnswer: 'z' };
  assert.equal(verifyQuestionDeterministically(missingChoiceQ).verified, false);

  const duplicateChoiceQ: any = {
    ...validQ,
    choices: [{ id: 'a', text: 'Same' }, { id: 'b', text: 'Same' }],
  };
  assert.equal(verifyQuestionDeterministically(duplicateChoiceQ).verified, false);
});

test('deduplicateQuestions filters duplicate prompts and prioritizes verified instances', () => {
  const q1: any = {
    id: 'q1',
    prompt: 'What is the electric current flowing through a 10 ohm resistor at 20 volts?',
    verified: false,
    solutionSteps: [{ stepNumber: 1, title: 'Step 1', explanation: 'Solve' }],
  };

  // Near duplicate with slight wording change
  const q2: any = {
    id: 'q2',
    prompt: 'What is the electric current flowing through a 10 ohm resistor when the voltage is 20 volts?',
    verified: true,
    solutionSteps: [{ stepNumber: 1, title: 'Step 1', explanation: 'Solve' }, { stepNumber: 2, title: 'Step 2', explanation: 'Finish' }],
  };

  const q3: any = {
    id: 'q3',
    prompt: 'State the law of conservation of momentum in an isolated system.',
    verified: true,
    solutionSteps: [{ stepNumber: 1, title: 'Definition', explanation: 'Momentum is conserved.' }],
  };

  const deduped = deduplicateQuestions([q1, q2, q3]);
  assert.equal(deduped.length, 2);
  // Should keep q2 because it's verified
  assert.ok(deduped.some((q) => q.id === 'q2'));
  assert.ok(deduped.some((q) => q.id === 'q3'));
});

test('Rasch 1-PL model and updateLearnerTheta correctly update student ability theta', () => {
  // Test difficulty to Rasch parameter b
  assert.equal(difficultyToRaschB('easy'), -1.0);
  assert.equal(difficultyToRaschB('medium'), 0.0);
  assert.equal(difficultyToRaschB('hard'), 1.2);

  // Success probability increases as theta increases
  const probLow = calculateProbabilityOfSuccess(-1.0, 0.0);
  const probEqual = calculateProbabilityOfSuccess(0.0, 0.0);
  const probHigh = calculateProbabilityOfSuccess(1.0, 0.0);

  assert.ok(probLow < probEqual);
  assert.ok(probEqual < probHigh);
  assert.equal(Math.round(probEqual * 100) / 100, 0.5);

  // Theta increases on correct answer, decreases on incorrect answer
  const initialTheta = 0.0;
  const thetaAfterCorrect = updateLearnerTheta(initialTheta, 'medium', true);
  const thetaAfterWrong = updateLearnerTheta(initialTheta, 'medium', false);

  assert.ok(thetaAfterCorrect > initialTheta, `Expected ${thetaAfterCorrect} > ${initialTheta}`);
  assert.ok(thetaAfterWrong < initialTheta, `Expected ${thetaAfterWrong} < ${initialTheta}`);
});

test('calculateNextSpacedInterval expands on correct responses and resets on errors', () => {
  const baseDate = '2026-10-24T12:00:00.000Z';

  // First correct attempt expands to 3 days
  const step1 = calculateNextSpacedInterval(1, 0, true, baseDate);
  assert.equal(step1.nextIntervalDays, 3);
  assert.equal(step1.newConsecutive, 1);

  // Second correct expands to 7 days
  const step2 = calculateNextSpacedInterval(3, 1, true, baseDate);
  assert.equal(step2.nextIntervalDays, 7);
  assert.equal(step2.newConsecutive, 2);

  // Mistake resets to 1 day
  const failStep = calculateNextSpacedInterval(7, 2, false, baseDate);
  assert.equal(failStep.nextIntervalDays, 1);
  assert.equal(failStep.newConsecutive, 0);
});

test('selectNextAdaptiveQuestion targets overdue spaced repetition and diagnosed weak concepts', () => {
  const qOhm: any = {
    id: 'q-ohm',
    prompt: 'Ohm question',
    subject: 'physics',
    conceptIds: ['ohms_law'],
    difficulty: 'medium',
    verified: true,
  };
  const qNewton: any = {
    id: 'q-newton',
    prompt: 'Newton question',
    subject: 'physics',
    conceptIds: ['newtons_laws'],
    difficulty: 'medium',
    verified: true,
  };
  const qPhotosynthesis: any = {
    id: 'q-photo',
    prompt: 'Photo question',
    subject: 'biology',
    conceptIds: ['photosynthesis'],
    difficulty: 'easy',
    verified: true,
  };

  const nowIso = '2026-10-24T12:00:00.000Z';
  const profiles: any = {
    ohms_law: {
      conceptId: 'ohms_law',
      theta: 0.1,
      nextReviewDate: '2026-10-23T12:00:00.000Z', // 1 day overdue
    },
    newtons_laws: {
      conceptId: 'newtons_laws',
      theta: 0.0,
    },
  };

  // Ohm's law is overdue so it must be selected
  const res1 = selectNextAdaptiveQuestion({
    learnerProfiles: profiles,
    candidateQuestions: [qOhm, qNewton, qPhotosynthesis],
    nowIso,
  });
  assert.equal(res1.selectedQuestion.id, 'q-ohm');
  assert.ok(res1.selectionReason.includes('Spaced repetition review due'));

  // Target diagnosed weak concept
  const res2 = selectNextAdaptiveQuestion({
    learnerProfiles: {},
    candidateQuestions: [qOhm, qNewton, qPhotosynthesis],
    weakConceptIds: ['newtons_laws'],
    nowIso,
  });
  assert.equal(res2.selectedQuestion.id, 'q-newton');
  assert.ok(res2.selectionReason.includes('Targeting diagnosed weak concept'));
});

test('createMockTest generates balanced sectional test and evaluateMockTest derives real percentile', () => {
  const sampleQuestions: any[] = [
    {
      id: 'mq-phy-1',
      subject: 'physics',
      conceptIds: ['ohms_law'],
      difficulty: 'easy',
      expectedAnswer: 'a',
      tolerance: 0,
      solutionSteps: [{ stepNumber: 1, title: 'Step', explanation: 'Solve' }],
      distractorExplanations: [{ choiceId: 'b', errorTag: 'multiplied_instead_of_divided', explanation: 'Multiply error.' }],
    },
    {
      id: 'mq-phy-2',
      subject: 'physics',
      conceptIds: ['kinematics'],
      difficulty: 'medium',
      expectedAnswer: '10',
      tolerance: 0.1,
      solutionSteps: [{ stepNumber: 1, title: 'Step', explanation: 'Solve' }],
    },
    {
      id: 'mq-math-1',
      subject: 'mathematics',
      conceptIds: ['algebra_linear_equations'],
      difficulty: 'easy',
      expectedAnswer: 'x = 5',
      tolerance: 0,
      solutionSteps: [{ stepNumber: 1, title: 'Step', explanation: 'Solve' }],
    },
    {
      id: 'mq-math-2',
      subject: 'mathematics',
      conceptIds: ['pythagoras_geometry'],
      difficulty: 'medium',
      expectedAnswer: 'c',
      tolerance: 0,
      solutionSteps: [{ stepNumber: 1, title: 'Step', explanation: 'Solve' }],
    },
  ];

  const testManifest = createMockTest(
    {
      grade: 'Grade 10',
      subjects: ['physics', 'mathematics'],
      totalQuestions: 4,
      timeLimitMinutes: 30,
    },
    sampleQuestions,
    42,
  );

  assert.equal(testManifest.sections.length, 2);
  assert.equal(testManifest.allQuestions.length, 4);

  // Student answers mq-phy-1 correctly, mq-phy-2 wrongly with distractor 'b', mq-math-1 correctly, mq-math-2 wrongly
  const answers = {
    'mq-phy-1': 'a',
    'mq-phy-2': 'b', // wrong
    'mq-math-1': 'x = 5',
    'mq-math-2': 'd', // wrong
  };

  const historicalAttempts = [
    { attemptId: 'h1', score: 1, totalMarks: 4, percentage: 25, completedAt: '2026-10-20' },
    { attemptId: 'h2', score: 2, totalMarks: 4, percentage: 50, completedAt: '2026-10-21' },
    { attemptId: 'h3', score: 3, totalMarks: 4, percentage: 75, completedAt: '2026-10-22' },
    { attemptId: 'h4', score: 4, totalMarks: 4, percentage: 100, completedAt: '2026-10-23' },
  ];

  const result = evaluateMockTest(testManifest, answers, 900, historicalAttempts);

  assert.equal(result.score, 2);
  assert.equal(result.maxScore, 4);
  assert.equal(result.percentage, 50);

  // Rule 4 honest percentile:
  // Lower than score 2 is h1 (1 attempt). Equal to score 2 is h2 (1 attempt). Total 4 attempts.
  // (1 + 0.5 * 1) / 4 = 1.5 / 4 = 37.5 -> 38%
  assert.equal(result.percentile, 38);

  // Check diagnosed error on question mq-phy-1's distractor
  const wrongEvaluation = result.evaluations.find((e) => e.questionId === 'mq-phy-2');
  assert.equal(wrongEvaluation?.isCorrect, false);

  assert.ok(result.sectionalAnalysis.some((s) => s.sectionName.includes('Physics')));
  assert.ok(result.sectionalAnalysis.some((s) => s.sectionName.includes('Mathematics')));
});



