import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllExperiments,
  findExperimentById,
  evaluateLabReport,
  evaluateReadingSubmission,
  getLabMetrics,
} from '@edukriti/lab';
import { answerTutorQuestion, detectSuggestedLab } from '../lib/tutor-provider.ts';

test('detectSuggestedLab maps natural questions to registered lab experiment IDs', () => {
  assert.equal(detectSuggestedLab("Can you show me Ohm's law experiment with V-I graph?"), 'ohms_law');
  assert.equal(detectSuggestedLab("Let's do acid base titration with phenolphthalein"), 'acid_base_titration');
  assert.equal(detectSuggestedLab('How do we find g using a simple pendulum?'), 'simple_pendulum');
  assert.equal(detectSuggestedLab('What is the horizontal range in projectile motion?'), 'projectile_motion');
  assert.equal(detectSuggestedLab('Convex lens focal length by u-v method'), 'convex_lens_uv');
  assert.equal(detectSuggestedLab('How to verify Archimedes principle and density?'), 'density_archimedes');
  assert.equal(detectSuggestedLab('How do I calculate zero error on a vernier caliper?'), 'vernier_screw_gauge');
  assert.equal(detectSuggestedLab('What is the pH of common solutions like lemon juice?'), 'ph_common_solutions');
  assert.equal(detectSuggestedLab('Snell law refraction through a glass slab'), 'refraction_glass_slab');
  assert.equal(detectSuggestedLab('Determine specific heat using a calorimeter'), 'specific_heat');
  assert.equal(detectSuggestedLab('Tell me a bedtime story'), undefined);
});

test('answerTutorQuestion suggests virtual lab launcher when student asks about experiment', async () => {
  const response = await answerTutorQuestion(null, {
    question: "Can you demonstrate Ohm's law experiment and show me the circuit?",
  });

  assert.equal(response.suggestedLabId, 'ohms_law');
  assert.ok(response.answer.includes('/labs/ohms_law'));
});

test('all 11 registered experiments in @edukriti/lab produce complete observation datasets and valid reports', () => {
  const experiments = getAllExperiments();
  assert.equal(experiments.length, 11);

  for (const exp of experiments) {
    const calc = exp.calculateResult(exp.sampleObservations);
    assert.ok(calc.calculatedValue > 0 || exp.id === 'ohms_law');
    assert.ok(calc.percentageError <= 10.0);

    const report = evaluateLabReport(
      {
        experimentId: exp.id,
        studentName: 'Student',
        observations: exp.sampleObservations,
        calculatedValue: calc.calculatedValue,
        vivaAnswers: {},
      },
      exp
    );

    assert.ok(report.overallScore >= 60);
    assert.ok(report.strengths.length >= 1);
  }

  const metrics = getLabMetrics();
  assert.equal(metrics.totalExperiments, 11);
  assert.equal(metrics.physicsCount, 9);
  assert.equal(metrics.chemistryCount, 2);
});

