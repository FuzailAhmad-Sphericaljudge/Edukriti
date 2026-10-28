import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const SIMPLE_PENDULUM_EXPERIMENT: ExperimentDefinition = {
  id: 'simple_pendulum',
  title: 'Simple Pendulum: Determination of Acceleration due to Gravity (g)',
  subject: 'physics',
  grade: '11',
  conceptIds: ['simple_harmonic_motion', 'gravitation_orbits', 'oscillations'],
  aim: 'To determine the acceleration due to gravity (g) by measuring the time period of a simple pendulum for various lengths and plotting an L-T² graph.',
  apparatus: [
    { id: 'app_bob', name: 'Spherical Metallic Bob & Hook', spec: STANDARD_INSTRUMENTS.pendulum_bob, quantity: 1, roleDescription: 'Oscillating mass' },
    { id: 'app_caliper', name: 'Vernier Caliper', spec: STANDARD_INSTRUMENTS.vernier_caliper, quantity: 1, roleDescription: 'Measures diameter of bob to find radius r' },
    { id: 'app_scale', name: 'Metre Scale (LC 0.1 cm)', spec: STANDARD_INSTRUMENTS.metre_scale, quantity: 1, roleDescription: 'Measures length of suspension thread' },
    { id: 'app_stopwatch', name: 'Precision Digital Stopwatch (LC 0.01 s)', spec: STANDARD_INSTRUMENTS.stopwatch, quantity: 1, roleDescription: 'Times 20 complete oscillations' },
  ],
  variables: [
    { name: 'Effective Length', symbol: 'L', unit: 'cm', role: 'independent', description: 'Length from point of suspension to center of gravity of bob (L = l + r)' },
    { name: 'Time for 20 Oscillations', symbol: 't', unit: 's', role: 'dependent', description: 'Total time measured with stopwatch' },
    { name: 'Time Period', symbol: 'T', unit: 's', role: 'dependent', description: 'T = t / 20' },
    { name: 'Angular Amplitude', symbol: 'θ', unit: '°', role: 'controlled', description: 'Small amplitude (< 10°) so that sin θ ≈ θ' },
  ],
  defaultParams: {
    effectiveLengthCm: 80.0, // cm
    bobRadiusCm: 1.25, // cm
    trueG: 9.80, // m/s²
    amplitudeDeg: 6.0,
    oscillationsCount: 20,
  },
  simulate: (params): SimulationResult => {
    const L_cm = Math.max(30, Math.min(150, Number(params.effectiveLengthCm ?? 80.0)));
    const g_true = Number(params.trueG ?? 9.80);
    const amp_deg = Number(params.amplitudeDeg ?? 6.0);
    const n_osc = Number(params.oscillationsCount ?? 20);

    const warnings: string[] = [];
    if (amp_deg > 15) {
      warnings.push(`Warning: Amplitude is ${amp_deg}°. SHM approximation sin(θ) ≈ θ breaks down for large angles, elongating the time period.`);
    }

    const L_m = L_cm / 100;
    // Small angle period with 1st order correction: T = 2π√(L/g) * (1 + 1/16 θ²)
    const theta_rad = (amp_deg * Math.PI) / 180;
    const periodCorrection = 1 + (1 / 16) * Math.pow(theta_rad, 2);
    const ideal_T = 2 * Math.PI * Math.sqrt(L_m / g_true) * periodCorrection;
    const ideal_total_time = ideal_T * n_osc;

    // Reaction time human jitter ~ 0.15 s on stopwatch
    const measured_time = quantizeToLeastCount(ideal_total_time, STANDARD_INSTRUMENTS.stopwatch.leastCount, { addNoise: true, noiseScale: 0.15 });
    const measured_T = measured_time / n_osc;
    const measured_T2 = Math.pow(measured_T, 2);
    const experimental_g = (4 * Math.PI * Math.PI * L_m) / measured_T2;

    return {
      stateValues: {
        effectiveLengthCm: L_cm,
        timeFor20Oscillations: measured_time,
        timePeriodT: parseFloat(measured_T.toFixed(3)),
        tSquared: parseFloat(measured_T2.toFixed(3)),
        calculatedG: parseFloat(experimental_g.toFixed(2)),
      },
      displayReadings: {
        length: { value: L_cm, formatted: `${L_cm.toFixed(1)} cm`, unit: 'cm' },
        time20: { value: measured_time, formatted: `${measured_time.toFixed(2)} s`, unit: 's' },
        periodT: { value: measured_T, formatted: `${measured_T.toFixed(3)} s`, unit: 's' },
        calculatedG: { value: experimental_g, formatted: `${experimental_g.toFixed(2)} m/s²`, unit: 'm/s²' },
      },
      isConnectionValid: true,
      warnings,
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Obs. No.', unit: '#' },
    { key: 'lengthCm', label: 'Length (L)', unit: 'cm' },
    { key: 'time20s', label: 'Time for 20 osc (t)', unit: 's' },
    { key: 'periodT', label: 'Time Period T = t/20', unit: 's', calculatedFromFormula: 'time20s / 20' },
    { key: 'tSquared', label: 'T²', unit: 's²', calculatedFromFormula: 'periodT * periodT' },
    { key: 'ratioLT2', label: 'L / T²', unit: 'cm/s²', calculatedFromFormula: 'lengthCm / tSquared' },
  ],
  sampleObservations: [
    { readingNo: 1, lengthCm: 60.0, time20s: 31.06, periodT: 1.553, tSquared: 2.412, ratioLT2: 24.88 },
    { readingNo: 2, lengthCm: 70.0, time20s: 33.56, periodT: 1.678, tSquared: 2.816, ratioLT2: 24.86 },
    { readingNo: 3, lengthCm: 80.0, time20s: 35.88, periodT: 1.794, tSquared: 3.218, ratioLT2: 24.86 },
    { readingNo: 4, lengthCm: 90.0, time20s: 38.06, periodT: 1.903, tSquared: 3.621, ratioLT2: 24.85 },
    { readingNo: 5, lengthCm: 100.0, time20s: 40.12, periodT: 2.006, tSquared: 4.024, ratioLT2: 24.85 },
  ],
  graph: {
    xKey: 'lengthCm',
    yKey: 'tSquared',
    xLabel: 'Effective Length L',
    yLabel: 'T² (Period Squared)',
    xUnit: 'cm',
    yUnit: 's²',
    expectedSlope: 0.0402, // s²/cm  => 4π²/g ≈ 39.478 / 980 ≈ 0.04028
    slopeFormula: 'Slope = Δ(T²) / ΔL = 4π² / g  =>  g = 4π² / Slope',
    interpretation: 'A straight line passing through the origin verifies that T² ∝ L. The reciprocal of slope allows precise calculation of g = 4π² / Slope.',
  },
  theoreticalFormula: 'T = 2π√(L/g)  =>  T² = (4π²/g) · L  =>  g = 4π² · (L / T²)',
  calculateResult: (observations: ObservationRow[]) => {
    if (!observations || observations.length === 0) {
      return {
        calculatedValue: 0,
        theoreticalValue: 9.80,
        percentageError: 100,
        unit: 'm/s²',
        formulaSteps: ['No observations'],
        isAccurate: false,
      };
    }
    // Calculate mean L/T² in cm/s²
    const ratios = observations.map((o) => (o.tSquared > 0 ? o.lengthCm / o.tSquared : 0)).filter((r) => r > 0);
    const meanRatioCm = ratios.reduce((a, b) => a + b, 0) / ratios.length; // ~24.85 cm/s²
    const meanRatioM = meanRatioCm / 100; // ~0.2485 m/s²
    const calculatedG = 4 * Math.PI * Math.PI * meanRatioM; // 4 * 9.8696 * 0.2485 ≈ 9.81 m/s²
    const trueG = 9.80;
    const error = Math.abs(calculatedG - trueG) / trueG * 100;

    return {
      calculatedValue: parseFloat(calculatedG.toFixed(2)),
      theoreticalValue: trueG,
      percentageError: parseFloat(error.toFixed(2)),
      unit: 'm/s²',
      formulaSteps: [
        `Mean (L / T²) = ${meanRatioCm.toFixed(2)} cm/s² = ${meanRatioM.toFixed(4)} m/s²`,
        `g = 4π² × (L / T²) = 4 × 3.14159² × ${meanRatioM.toFixed(4)} = ${calculatedG.toFixed(2)} m/s²`,
        `Standard Theoretical g = 9.80 m/s²`,
        `Percentage Error = |${calculatedG.toFixed(2)} - 9.80| / 9.80 × 100% = ${error.toFixed(2)}%`,
      ],
      isAccurate: error <= 3.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_pend_01',
      question: 'Why should the amplitude of oscillation of a simple pendulum be kept small (< 10°)?',
      options: [
        'The restoring force is F = -mg sin θ; only for small angles does sin θ ≈ θ in radians, making restoring force proportional to displacement (SHM condition).',
        'Large angles make the pendulum string snap immediately.',
        'At large angles air resistance becomes infinite.',
        'A small angle increases gravity g locally.',
      ],
      correctOptionIndex: 0,
      explanation: 'Simple Harmonic Motion requires acceleration ∝ -displacement. For a pendulum, a = -g sin θ. When θ is small (< 10° or ~0.17 rad), sin θ ≈ θ, ensuring isochronous oscillations where period T is independent of amplitude.',
      misconceptionTag: 'shm_small_angle_approximation',
    },
    {
      id: 'viva_pend_02',
      question: 'What is a "Seconds Pendulum"?',
      options: [
        'A pendulum having a time period of exactly 2.0 seconds (ticks every 1.0 second from one extreme to the other).',
        'A pendulum that completes 1 oscillation in 1 second.',
        'A digital stopwatch.',
        'A pendulum whose length changes by 1 second every minute.',
      ],
      correctOptionIndex: 0,
      explanation: 'A seconds pendulum has time period T = 2.0 s. Its effective length at the Earth\'s surface where g = 9.8 m/s² is L = gT²/(4π²) ≈ 9.8 × 4 / (4 × 9.87) ≈ 0.993 m ≈ 1 metre.',
      misconceptionTag: 'seconds_pendulum_definition',
    },
  ],
  safetyNotes: [
    { id: 'safe_pend_01', note: 'Ensure the pendulum oscillates purely in a single vertical plane without elliptical or spinning conical motion.', severity: 'warning' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Measuring Effective Length',
      narration: "Aarohi: Hello! Today we determine the local acceleration due to gravity, g. Notice our suspension thread is adjusted to length 80.0 cm, plus the bob's radius 1.25 cm, giving effective length L = 81.25 cm.",
      targetControls: { effectiveLengthCm: 80.0, amplitudeDeg: 6.0 },
      expectedObservation: { readingNo: 1, lengthCm: 80.0, time20s: 35.88, periodT: 1.794, tSquared: 3.218, ratioLT2: 24.86 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Counting 20 Oscillations',
      narration: "Aarohi: I displace the bob by 6 degrees and release. As it passes through the mean equilibrium position, I start the stopwatch. Exactly 20 oscillations later, stopwatch stops at 35.88 seconds.",
      targetControls: { effectiveLengthCm: 80.0, amplitudeDeg: 6.0 },
      expectedObservation: { readingNo: 1, lengthCm: 80.0, time20s: 35.88, periodT: 1.794, tSquared: 3.218, ratioLT2: 24.86 },
      durationMs: 3500,
    },
    {
      stepNumber: 3,
      title: 'Calculating g',
      narration: "Aarohi: The period T is 35.88 / 20 = 1.794 s. Computing g = 4π² × (L / T²) yields 9.81 m/s² — perfectly matching Earth's surface gravity! Now, try changing the length to 60 cm, 70 cm, and 100 cm yourself.",
      targetControls: { effectiveLengthCm: 100.0, amplitudeDeg: 6.0 },
      expectedObservation: { readingNo: 5, lengthCm: 100.0, time20s: 40.12, periodT: 2.006, tSquared: 4.024, ratioLT2: 24.85 },
      durationMs: 4000,
    },
  ],
};
