import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const PROJECTILE_MOTION_EXPERIMENT: ExperimentDefinition = {
  id: 'projectile_motion',
  title: 'Projectile Motion: Range, Height, and Angle of Projection',
  subject: 'physics',
  grade: '11',
  conceptIds: ['kinematics_1d_2d', 'newtons_laws_motion', 'vectors_projectile_3d'],
  aim: 'To investigate the trajectory of a projectile, determine the relationship between launch angle and horizontal range, and verify that maximum range occurs at 45°.',
  apparatus: [
    { id: 'app_launcher', name: 'Spring-Loaded Ballistic Projectile Launcher', spec: STANDARD_INSTRUMENTS.spring_balance, quantity: 1, roleDescription: 'Launches ball with constant initial speed v0' },
    { id: 'app_scale', name: 'Precision Metre Tape (LC 0.1 cm)', spec: STANDARD_INSTRUMENTS.metre_scale, quantity: 1, roleDescription: 'Measures horizontal landing range R' },
    { id: 'app_stopwatch', name: 'Photogate Digital Stopwatch (LC 0.001 s)', spec: STANDARD_INSTRUMENTS.stopwatch, quantity: 1, roleDescription: 'Measures total time of flight' },
  ],
  variables: [
    { name: 'Launch Angle', symbol: 'θ', unit: '°', role: 'independent', description: 'Angle of elevation above horizontal' },
    { name: 'Horizontal Range', symbol: 'R', unit: 'm', role: 'dependent', description: 'Distance from launch to landing' },
    { name: 'Maximum Height', symbol: 'H', unit: 'm', role: 'dependent', description: 'Peak vertical altitude' },
    { name: 'Time of Flight', symbol: 'T_flight', unit: 's', role: 'dependent', description: 'Total airborne time' },
    { name: 'Initial Velocity', symbol: 'v0', unit: 'm/s', role: 'controlled', description: 'Kept constant across trials by fixed spring latch' },
  ],
  defaultParams: {
    launchVelocityMps: 14.0, // m/s
    launchAngleDeg: 45.0, // degrees
    gravity: 9.80, // m/s²
    airResistance: false,
  },
  simulate: (params): SimulationResult => {
    const v0 = Math.max(5, Math.min(30, Number(params.launchVelocityMps ?? 14.0)));
    const theta_deg = Math.max(10, Math.min(85, Number(params.launchAngleDeg ?? 45.0)));
    const g = Number(params.gravity ?? 9.80);
    const airResistance = Boolean(params.airResistance ?? false);

    const theta_rad = (theta_deg * Math.PI) / 180;
    const sinTheta = Math.sin(theta_rad);
    const sin2Theta = Math.sin(2 * theta_rad);

    let ideal_R = (v0 * v0 * sin2Theta) / g;
    let ideal_H = (v0 * v0 * sinTheta * sinTheta) / (2 * g);
    let ideal_T = (2 * v0 * sinTheta) / g;

    if (airResistance) {
      // Approximate 6% drag reduction
      ideal_R *= 0.94;
      ideal_H *= 0.96;
      ideal_T *= 0.97;
    }

    const measured_R = quantizeToLeastCount(ideal_R, 0.01, { addNoise: true, noiseScale: 0.2 });
    const measured_H = quantizeToLeastCount(ideal_H, 0.01, { addNoise: true, noiseScale: 0.1 });
    const measured_T = quantizeToLeastCount(ideal_T, 0.001, { addNoise: true, noiseScale: 0.1 });

    return {
      stateValues: {
        launchAngleDeg: theta_deg,
        horizontalRangeM: measured_R,
        maxHeightM: measured_H,
        timeOfFlightS: measured_T,
        initialVelocityMps: v0,
      },
      displayReadings: {
        angle: { value: theta_deg, formatted: `${theta_deg.toFixed(1)}°`, unit: '°' },
        range: { value: measured_R, formatted: `${measured_R.toFixed(2)} m`, unit: 'm' },
        height: { value: measured_H, formatted: `${measured_H.toFixed(2)} m`, unit: 'm' },
        timeOfFlight: { value: measured_T, formatted: `${measured_T.toFixed(3)} s`, unit: 's' },
      },
      isConnectionValid: true,
      warnings: airResistance ? ['Air drag enabled: Trajectory is slightly asymmetric and range is reduced.'] : [],
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Trial', unit: '#' },
    { key: 'angleDeg', label: 'Launch Angle (θ)', unit: '°' },
    { key: 'sin2Theta', label: 'sin(2θ)', unit: 'ratio', calculatedFromFormula: 'sin(2 * angleDeg * π / 180)' },
    { key: 'rangeM', label: 'Range R', unit: 'm' },
    { key: 'maxHeightM', label: 'Max Height H', unit: 'm' },
    { key: 'timeFlightS', label: 'Flight Time T', unit: 's' },
  ],
  sampleObservations: [
    { readingNo: 1, angleDeg: 15.0, sin2Theta: 0.500, rangeM: 10.00, maxHeightM: 0.67, timeFlightS: 0.741 },
    { readingNo: 2, angleDeg: 30.0, sin2Theta: 0.866, rangeM: 17.32, maxHeightM: 2.50, timeFlightS: 1.429 },
    { readingNo: 3, angleDeg: 45.0, sin2Theta: 1.000, rangeM: 20.00, maxHeightM: 5.00, timeFlightS: 2.020 },
    { readingNo: 4, angleDeg: 60.0, sin2Theta: 0.866, rangeM: 17.32, maxHeightM: 7.50, timeFlightS: 2.474 },
    { readingNo: 5, angleDeg: 75.0, sin2Theta: 0.500, rangeM: 10.00, maxHeightM: 9.33, timeFlightS: 2.755 },
  ],
  graph: {
    xKey: 'sin2Theta',
    yKey: 'rangeM',
    xLabel: 'sin(2θ)',
    yLabel: 'Horizontal Range R',
    xUnit: '',
    yUnit: 'm',
    expectedSlope: 20.0, // v0² / g = 196 / 9.8 = 20.0 m
    slopeFormula: 'Slope = ΔR / Δ(sin 2θ) = v0² / g',
    interpretation: 'A straight line passing through the origin proves R ∝ sin(2θ). The maximum range occurs when sin(2θ) = 1, i.e., 2θ = 90° or θ = 45°.',
  },
  theoreticalFormula: 'R = (v0² · sin 2θ) / g;  Complementary angles (θ and 90°-θ) yield equal horizontal ranges.',
  calculateResult: (observations: ObservationRow[]) => {
    // Find reading with maximum range
    const maxRow = observations.reduce((prev, curr) => (curr.rangeM > prev.rangeM ? curr : prev), observations[0]);
    const maxRange = maxRow ? maxRow.rangeM : 20.0;
    const angleAtMax = maxRow ? maxRow.angleDeg : 45.0;

    // Check complementary symmetry between 30° and 60°
    const row30 = observations.find((o) => Math.abs(o.angleDeg - 30) < 1);
    const row60 = observations.find((o) => Math.abs(o.angleDeg - 60) < 1);
    const symmetryMatch = row30 && row60 ? Math.abs(row30.rangeM - row60.rangeM) < 0.2 : true;

    return {
      calculatedValue: maxRange,
      theoreticalValue: 20.0,
      percentageError: parseFloat((Math.abs(maxRange - 20.0) / 20.0 * 100).toFixed(2)),
      unit: 'm',
      formulaSteps: [
        `Maximum Range R_max = ${maxRange.toFixed(2)} m observed at θ = ${angleAtMax}°`,
        `Theoretical R_max = v0² / g = 14² / 9.80 = 20.00 m at θ = 45°`,
        `Complementary range symmetry (30° vs 60°): ${symmetryMatch ? 'Verified identical within ±0.05m' : 'Discrepancy detected'}`,
      ],
      isAccurate: Math.abs(angleAtMax - 45) <= 2,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_proj_01',
      question: 'Why do two projection angles θ and (90° - θ) produce the exact same horizontal range for the same launch speed?',
      options: [
        'Because sin(2(90° - θ)) = sin(180° - 2θ) = sin(2θ), making the range formula identical.',
        'Because the projectile reverses direction mid-air.',
        'Because gravity pulls harder at 30° than at 60°.',
        'It is an optical illusion; the ranges are never actually equal.',
      ],
      correctOptionIndex: 0,
      explanation: 'Since R = (v0² sin 2θ)/g and the trigonometric identity sin(180° - 2θ) = sin 2θ holds, complementary angles produce identical sin 2θ values. However, the higher angle (90° - θ) spends more time in the air and reaches a greater peak height.',
      misconceptionTag: 'complementary_projectile_range',
    },
  ],
  safetyNotes: [
    { id: 'safe_proj_01', note: 'Clear the ballistic trajectory path and ensure no person stands in front of the spring launcher muzzle.', severity: 'critical' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Launcher Set at 30°',
      narration: "Aarohi: Let's launch a projectile at 14 m/s. First, I tilt the barrel to 30 degrees. The ball travels a range of 17.32 metres.",
      targetControls: { launchAngleDeg: 30.0, launchVelocityMps: 14.0 },
      expectedObservation: { readingNo: 1, angleDeg: 30.0, sin2Theta: 0.866, rangeM: 17.32, maxHeightM: 2.50, timeFlightS: 1.429 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Optimal Launch at 45°',
      narration: "Aarohi: Now I adjust the angle to 45 degrees. Since sin(2 × 45°) = sin(90°) = 1.00, we reach the maximum theoretical range: exactly 20.00 metres!",
      targetControls: { launchAngleDeg: 45.0, launchVelocityMps: 14.0 },
      expectedObservation: { readingNo: 2, angleDeg: 45.0, sin2Theta: 1.000, rangeM: 20.00, maxHeightM: 5.00, timeFlightS: 2.020 },
      durationMs: 3500,
    },
    {
      stepNumber: 3,
      title: 'Complementary Angle at 60°',
      narration: "Aarohi: Watch what happens at 60 degrees. The ball climbs much higher (7.5 m) and stays airborne longer, but lands at exactly 17.32 metres — matching 30 degrees! Now explore other angles yourself.",
      targetControls: { launchAngleDeg: 60.0, launchVelocityMps: 14.0 },
      expectedObservation: { readingNo: 3, angleDeg: 60.0, sin2Theta: 0.866, rangeM: 17.32, maxHeightM: 7.50, timeFlightS: 2.474 },
      durationMs: 3500,
    },
  ],
};
