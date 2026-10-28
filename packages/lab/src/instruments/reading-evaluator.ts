import type { ReadingPracticeExercise, InstrumentType } from '../types.ts';
import { STANDARD_INSTRUMENTS } from './instrument-registry.ts';

export interface ReadingSubmission {
  exerciseId: string;
  submittedMainReading: number;
  submittedVernierReading?: number;
  submittedTotal: number;
}

export interface ReadingEvaluationResult {
  exerciseId: string;
  isCorrect: boolean;
  score: number; // 0 to 100
  feedback: string;
  expectedValues: {
    msr: number;
    vsr: number;
    leastCount: number;
    zeroError: number;
    total: number;
    unit: string;
  };
  calculationBreakdown: string[];
}

export const READING_PRACTICE_EXERCISES: ReadingPracticeExercise[] = [
  {
    id: 'read_vernier_01',
    instrumentId: 'inst_vernier_01',
    instrumentType: 'vernier_caliper',
    prompt: 'Measure the diameter of a metal sphere using this Vernier Caliper. The zero of the vernier scale lies past 2.4 cm, and the 6th vernier division coincides with a main scale division. The instrument has zero error = +0.02 cm.',
    trueMainScaleReading: 2.4, // cm
    trueVernierOrCircularReading: 6, // 6th division
    trueLeastCount: 0.01, // cm
    zeroError: 0.02, // cm
    trueTotalReading: 2.44, // 2.4 + (6 * 0.01) - 0.02 = 2.44 cm
    unit: 'cm',
  },
  {
    id: 'read_vernier_02',
    instrumentId: 'inst_vernier_01',
    instrumentType: 'vernier_caliper',
    prompt: 'Measure the internal diameter of a small beaker. Main scale reading is 4.1 cm, 3rd vernier division coincides with main scale mark. Zero error is 0.00 cm.',
    trueMainScaleReading: 4.1,
    trueVernierOrCircularReading: 3,
    trueLeastCount: 0.01,
    zeroError: 0.0,
    trueTotalReading: 4.13, // 4.1 + 0.03 - 0 = 4.13 cm
    unit: 'cm',
  },
  {
    id: 'read_screw_gauge_01',
    instrumentId: 'inst_screw_gauge_01',
    instrumentType: 'screw_gauge',
    prompt: 'Measure the thickness of a copper wire using a screw gauge. Pitch scale reading = 3 mm, 45th circular scale division coincides with reference line. Pitch = 1 mm, circular divisions = 100 (LC = 0.01 mm). Zero error = -0.03 mm (negative zero error).',
    trueMainScaleReading: 3.0, // mm
    trueVernierOrCircularReading: 45, // div
    trueLeastCount: 0.01, // mm
    zeroError: -0.03, // mm
    trueTotalReading: 3.48, // 3.0 + (45 * 0.01) - (-0.03) = 3.0 + 0.45 + 0.03 = 3.48 mm
    unit: 'mm',
  },
  {
    id: 'read_voltmeter_01',
    instrumentId: 'inst_voltmeter_01',
    instrumentType: 'voltmeter',
    prompt: 'Read the voltage on an analog voltmeter. Range is 0–5 V with 50 divisions. The needle points to the 28th division.',
    trueMainScaleReading: 28, // divisions
    trueVernierOrCircularReading: 0,
    trueLeastCount: 0.1, // 5V / 50 div = 0.1 V/div
    zeroError: 0.0,
    trueTotalReading: 2.8, // 28 * 0.1 = 2.8 V
    unit: 'V',
  },
  {
    id: 'read_ammeter_01',
    instrumentId: 'inst_ammeter_01',
    instrumentType: 'ammeter',
    prompt: 'Read the current on an analog ammeter. Range is 0–1.5 A with 75 divisions. The needle points to division 32.',
    trueMainScaleReading: 32, // divisions
    trueVernierOrCircularReading: 0,
    trueLeastCount: 0.02, // 1.5A / 75 div = 0.02 A/div
    zeroError: 0.0,
    trueTotalReading: 0.64, // 32 * 0.02 = 0.64 A
    unit: 'A',
  },
  {
    id: 'read_burette_01',
    instrumentId: 'inst_burette_01',
    instrumentType: 'burette',
    prompt: 'Read the volume of NaOH solution in a 50 mL burette at the titration endpoint. The bottom of the concave meniscus is 4 divisions below the 18 mL mark (each division is 0.1 mL).',
    trueMainScaleReading: 18.0,
    trueVernierOrCircularReading: 4,
    trueLeastCount: 0.1,
    zeroError: 0.0,
    trueTotalReading: 18.4,
    unit: 'mL',
  },
  {
    id: 'read_measuring_cylinder_01',
    instrumentId: 'inst_cylinder_01',
    instrumentType: 'measuring_cylinder',
    prompt: 'Read the liquid volume in a 100 mL graduated measuring cylinder. The bottom of the curved water meniscus touches 47 mL.',
    trueMainScaleReading: 47,
    trueVernierOrCircularReading: 0,
    trueLeastCount: 1.0,
    zeroError: 0.0,
    trueTotalReading: 47.0,
    unit: 'mL',
  },
];

export function evaluateReadingSubmission(submission: ReadingSubmission): ReadingEvaluationResult {
  const exercise = READING_PRACTICE_EXERCISES.find((e) => e.id === submission.exerciseId);
  if (!exercise) {
    throw new Error(`Exercise ID ${submission.exerciseId} not found in reading registry`);
  }

  const tolerance = Math.max(exercise.trueLeastCount * 0.5, 0.001);
  const diff = Math.abs(submission.submittedTotal - exercise.trueTotalReading);
  const isCorrect = diff <= tolerance;

  let score = 0;
  const feedbackParts: string[] = [];
  const calculationBreakdown: string[] = [];

  const vsrValue = exercise.trueVernierOrCircularReading * exercise.trueLeastCount;
  calculationBreakdown.push(`Main Scale Reading (MSR) = ${exercise.trueMainScaleReading} ${exercise.unit}`);
  if (exercise.trueVernierOrCircularReading > 0) {
    calculationBreakdown.push(
      `Coinciding Division = ${exercise.trueVernierOrCircularReading} × Least Count (${exercise.trueLeastCount} ${exercise.unit}) = ${vsrValue.toFixed(4)} ${exercise.unit}`
    );
  }
  if (exercise.zeroError !== 0) {
    calculationBreakdown.push(
      `Zero Error (ZE) = ${exercise.zeroError > 0 ? '+' : ''}${exercise.zeroError} ${exercise.unit} (Subtracted from observed reading)`
    );
  }
  calculationBreakdown.push(
    `Total True Reading = MSR + (${exercise.trueVernierOrCircularReading} × LC) - (Zero Error) = ${exercise.trueTotalReading} ${exercise.unit}`
  );

  if (isCorrect) {
    score = 100;
    feedbackParts.push(`Excellent! Your reading of ${submission.submittedTotal} ${exercise.unit} matches the true value within least-count precision.`);
  } else {
    // Partial credit diagnosis
    if (Math.abs(submission.submittedMainReading - exercise.trueMainScaleReading) < 0.001) {
      score += 40;
      feedbackParts.push(`Main scale reading (${submission.submittedMainReading} ${exercise.unit}) was correct (+40%).`);
    } else {
      feedbackParts.push(`Main scale reading was incorrect. Expected ${exercise.trueMainScaleReading} ${exercise.unit}.`);
    }

    // Check if student forgot zero error
    const withoutZeroError = exercise.trueMainScaleReading + vsrValue;
    if (Math.abs(submission.submittedTotal - withoutZeroError) <= tolerance && exercise.zeroError !== 0) {
      score = 70;
      feedbackParts.push(
        `You computed the observed reading correctly but forgot to subtract the zero error (${exercise.zeroError > 0 ? '+' : ''}${exercise.zeroError} ${exercise.unit}). Remember: Correct Reading = Observed Reading - (± Zero Error).`
      );
    } else {
      feedbackParts.push(`Expected total reading: ${exercise.trueTotalReading} ${exercise.unit}. Difference was ${diff.toFixed(3)} ${exercise.unit}.`);
    }
  }

  return {
    exerciseId: exercise.id,
    isCorrect,
    score: Math.min(100, Math.max(0, score)),
    feedback: feedbackParts.join(' '),
    expectedValues: {
      msr: exercise.trueMainScaleReading,
      vsr: vsrValue,
      leastCount: exercise.trueLeastCount,
      zeroError: exercise.zeroError,
      total: exercise.trueTotalReading,
      unit: exercise.unit,
    },
    calculationBreakdown,
  };
}
