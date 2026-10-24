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


