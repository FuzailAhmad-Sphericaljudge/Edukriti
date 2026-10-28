import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ALL_EXPERIMENTS,
  findExperimentById,
  getExperimentsBySubject,
  getExperimentsForConcept,
  getLabMetrics,
} from './registry.ts';
import {
  STANDARD_INSTRUMENTS,
  quantizeToLeastCount,
  formatReading,
} from './instruments/instrument-registry.ts';
import {
  READING_PRACTICE_EXERCISES,
  evaluateReadingSubmission,
} from './instruments/reading-evaluator.ts';
import { evaluateLabReport, computeLinearRegression } from './evaluator.ts';

describe('Lab Framework & Simulation Engine', () => {
  it('ALL_EXPERIMENTS contains exactly 11 deterministic experiments in defined order', () => {
    assert.strictEqual(ALL_EXPERIMENTS.length, 11);
    const expectedIds = [
      'ohms_law',
      'series_parallel_resistors',
      'simple_pendulum',
      'projectile_motion',
      'convex_lens_uv',
      'acid_base_titration',
      'density_archimedes',
      'vernier_screw_gauge',
      'ph_common_solutions',
      'refraction_glass_slab',
      'specific_heat',
    ];
    assert.deepStrictEqual(
      ALL_EXPERIMENTS.map((e) => e.id),
      expectedIds
    );
  });

  it('every registered experiment has complete metadata, observation columns, graph, and viva questions', () => {
    for (const exp of ALL_EXPERIMENTS) {
      assert.ok(exp.id, 'Experiment must have id');
      assert.ok(exp.title, `${exp.id} must have title`);
      assert.ok(exp.aim.length > 10, `${exp.id} must have detailed aim`);
      assert.ok(exp.apparatus.length >= 2, `${exp.id} must have apparatus list`);
      assert.ok(exp.variables.length >= 2, `${exp.id} must specify variables`);
      assert.ok(exp.observationColumns.length >= 3, `${exp.id} must have observation columns`);
      assert.ok(exp.sampleObservations.length >= 2, `${exp.id} must have sample observations`);
      assert.ok(exp.graph.xKey && exp.graph.yKey, `${exp.id} must configure graph keys`);
      assert.ok(exp.vivaQuestions.length >= 1, `${exp.id} must have viva questions`);
      assert.ok(exp.safetyNotes.length >= 1, `${exp.id} must have safety precautions`);
      assert.ok(exp.demonstrationScript.length >= 2, `${exp.id} must have teacher demo cues`);

      // Verify each apparatus least count is positive
      for (const app of exp.apparatus) {
        assert.ok(app.spec.leastCount > 0, `${exp.id} apparatus ${app.name} must have positive least count`);
      }
    }
  });

  it('quantizeToLeastCount and formatReading correctly format precision without floating point drift', () => {
    const quantized = quantizeToLeastCount(2.44123, 0.01);
    assert.strictEqual(quantized, 2.44);

    const formatted = formatReading(2.44, 0.01, 'cm');
    assert.strictEqual(formatted, '2.44 cm');

    const quantizedV = quantizeToLeastCount(1.789, 0.05);
    assert.strictEqual(quantizedV, 1.80);
  });

  it('reading practice evaluator correctly scores correct readings and diagnoses zero error oversights', () => {
    assert.ok(READING_PRACTICE_EXERCISES.length >= 5);

    // Test perfect vernier reading
    const perfectVernier = evaluateReadingSubmission({
      exerciseId: 'read_vernier_01',
      submittedMainReading: 2.4,
      submittedVernierReading: 6,
      submittedTotal: 2.44,
    });
    assert.strictEqual(perfectVernier.isCorrect, true);
    assert.strictEqual(perfectVernier.score, 100);
    assert.ok(perfectVernier.calculationBreakdown.length >= 3);

    // Test student who forgot to subtract zero error (+0.02)
    const forgotZeroError = evaluateReadingSubmission({
      exerciseId: 'read_vernier_01',
      submittedMainReading: 2.4,
      submittedVernierReading: 6,
      submittedTotal: 2.46, // 2.4 + 0.06 without -0.02
    });
    assert.strictEqual(forgotZeroError.isCorrect, false);
    assert.strictEqual(forgotZeroError.score, 70);
    assert.ok(forgotZeroError.feedback.includes('zero error'));

    // Test screw gauge reading
    const screwRes = evaluateReadingSubmission({
      exerciseId: 'read_screw_gauge_01',
      submittedMainReading: 3.0,
      submittedVernierReading: 45,
      submittedTotal: 3.48,
    });
    assert.strictEqual(screwRes.isCorrect, true);
    assert.strictEqual(screwRes.score, 100);
  });

  it('simulation models enforce realistic physical constraints and circuit conditions', () => {
    // Ohm's law circuit tests
    const ohms = findExperimentById('ohms_law')!;
    const openCircuit = ohms.simulate({ plugKeyClosed: false });
    assert.strictEqual(openCircuit.stateValues.current, 0);
    assert.ok(openCircuit.warnings.length > 0);

    const closedCircuit = ohms.simulate({ plugKeyClosed: true, rheostatSlider: 0.5 });
    assert.ok(closedCircuit.stateValues.current > 0);
    assert.ok(closedCircuit.stateValues.voltage > 0);
    assert.ok(closedCircuit.isConnectionValid);

    const reversePol = ohms.simulate({ plugKeyClosed: true, reversePolarity: true });
    assert.strictEqual(reversePol.isConnectionValid, false);
    assert.ok(reversePol.warnings[0].includes('reverse polarity'));

    // Pendulum simulation
    const pendulum = findExperimentById('simple_pendulum')!;
    const pendSim = pendulum.simulate({ effectiveLengthCm: 80.0, trueG: 9.80 });
    assert.ok(pendSim.stateValues.calculatedG >= 9.6 && pendSim.stateValues.calculatedG <= 10.0);

    // Projectile motion simulation (45 deg should produce max range)
    const projectile = findExperimentById('projectile_motion')!;
    const r45 = projectile.simulate({ launchAngleDeg: 45.0, launchVelocityMps: 14.0 });
    const r30 = projectile.simulate({ launchAngleDeg: 30.0, launchVelocityMps: 14.0 });
    const r60 = projectile.simulate({ launchAngleDeg: 60.0, launchVelocityMps: 14.0 });
    assert.ok(r45.stateValues.horizontalRangeM > r30.stateValues.horizontalRangeM);
    assert.strictEqual(Math.round(r30.stateValues.horizontalRangeM), Math.round(r60.stateValues.horizontalRangeM));

    // Acid-base titration
    const titration = findExperimentById('acid_base_titration')!;
    const beforeEnd = titration.simulate({ addedNaOhMl: 10.0, indicatorAdded: true });
    assert.ok(beforeEnd.stateValues.ph < 7.0);
    const atEnd = titration.simulate({ addedNaOhMl: 20.0, indicatorAdded: true });
    assert.ok(atEnd.stateValues.ph >= 7.0 && atEnd.stateValues.ph <= 9.0);
    assert.strictEqual(atEnd.stateValues.isEndpoint, 1);
  });

  it('linear regression correctly calculates slope, intercept, and R²', () => {
    const perfectLine = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 },
    ];
    const reg = computeLinearRegression(perfectLine);
    assert.strictEqual(reg.slope, 2.0);
    assert.strictEqual(reg.intercept, 0.0);
    assert.strictEqual(reg.rSquared, 1.0);
  });

  it('evaluateLabReport auto-grades observation tables, graphs, calculations, and viva responses', () => {
    const ohms = findExperimentById('ohms_law')!;
    const grade = evaluateLabReport(
      {
        experimentId: 'ohms_law',
        studentName: 'Aarav',
        observations: ohms.sampleObservations,
        calculatedValue: 5.0,
        vivaAnswers: {
          viva_ohm_01: 0,
          viva_ohm_02: 0,
        },
      },
      ohms
    );

    assert.ok(grade.overallScore >= 90);
    assert.strictEqual(grade.letterGrade, 'A+');
    assert.strictEqual(grade.percentageError, 0);
    assert.strictEqual(grade.theoreticalValue, 5.0);
    assert.ok(grade.strengths.length >= 2);
    assert.ok(grade.conceptRevisionLinks.includes('ohms_law'));
  });

  it('every experiment runs end-to-end from sample observations to auto-graded report', () => {
    for (const exp of ALL_EXPERIMENTS) {
      const calcResult = exp.calculateResult(exp.sampleObservations);
      assert.ok(calcResult.theoreticalValue !== undefined, `${exp.id} must produce theoretical value`);
      assert.ok(calcResult.percentageError <= 10.0, `${exp.id} sample observations must have error <= 10%`);

      const vivaAnswers: Record<string, number> = {};
      for (const v of exp.vivaQuestions) {
        vivaAnswers[v.id] = v.correctOptionIndex;
      }

      const report = evaluateLabReport(
        {
          experimentId: exp.id,
          studentName: 'Student',
          observations: exp.sampleObservations,
          calculatedValue: calcResult.calculatedValue,
          vivaAnswers,
        },
        exp
      );

      assert.ok(report.overallScore >= 70, `${exp.id} must achieve passing report grade`);
      assert.ok(report.teacherFeedback.length > 20, `${exp.id} must provide detailed teacher feedback`);
    }
  });

  it('registry search functions and metrics return honest verified counts', () => {
    const physicsExps = getExperimentsBySubject('physics');
    assert.strictEqual(physicsExps.length, 9);

    const chemistryExps = getExperimentsBySubject('chemistry');
    assert.strictEqual(chemistryExps.length, 2);

    const ohmConcepts = getExperimentsForConcept('ohms_law');
    assert.strictEqual(ohmConcepts.length, 1);

    const metrics = getLabMetrics();
    assert.strictEqual(metrics.totalExperiments, 11);
    assert.strictEqual(metrics.physicsCount, 9);
    assert.strictEqual(metrics.chemistryCount, 2);
    assert.strictEqual(metrics.totalInstruments, Object.keys(STANDARD_INSTRUMENTS).length);
  });
});
