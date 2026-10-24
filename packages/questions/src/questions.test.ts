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

