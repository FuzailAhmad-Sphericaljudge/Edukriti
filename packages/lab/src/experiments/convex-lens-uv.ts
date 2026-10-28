import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const CONVEX_LENS_UV_EXPERIMENT: ExperimentDefinition = {
  id: 'convex_lens_uv',
  title: 'Convex Lens: Focal Length by u-v Method',
  subject: 'physics',
  grade: '10',
  conceptIds: ['optics_lenses', 'wave_optics', 'light_reflection_refraction'],
  aim: 'To determine the focal length of a convex lens by finding the image distance (v) for various object distances (u) and plotting 1/v versus 1/u graph.',
  apparatus: [
    { id: 'app_bench', name: 'Optical Bench with Scale (0–100 cm, LC 0.1 cm)', spec: STANDARD_INSTRUMENTS.metre_scale, quantity: 1, roleDescription: 'Holds uprights and measures position' },
    { id: 'app_lens', name: 'Double Convex Lens (f ≈ 15.0 cm) on Upright', spec: STANDARD_INSTRUMENTS.convex_lens, quantity: 1, roleDescription: 'Converging optical element' },
    { id: 'app_needle_o', name: 'Object Needle / Illuminated Arrow', spec: STANDARD_INSTRUMENTS.metre_scale, quantity: 1, roleDescription: 'Light source object' },
    { id: 'app_needle_i', name: 'Image Screen / Parallax Search Needle', spec: STANDARD_INSTRUMENTS.metre_scale, quantity: 1, roleDescription: 'Locates real inverted image' },
  ],
  variables: [
    { name: 'Object Distance', symbol: 'u', unit: 'cm', role: 'independent', description: 'Distance from optical center of lens to object needle' },
    { name: 'Image Distance', symbol: 'v', unit: 'cm', role: 'dependent', description: 'Distance from optical center of lens to focused real inverted image' },
    { name: 'Focal Length', symbol: 'f', unit: 'cm', role: 'dependent', description: 'f = (u · v) / (u + v)' },
    { name: 'Lens Aperture', symbol: 'D', unit: 'cm', role: 'controlled', description: 'Kept constant' },
  ],
  defaultParams: {
    objectDistanceCm: 30.0, // cm
    trueFocalLengthCm: 15.0, // cm
    lensPositionCm: 50.0, // on optical bench
  },
  simulate: (params): SimulationResult => {
    const u = Math.max(16, Math.min(80, Number(params.objectDistanceCm ?? 30.0)));
    const f_true = Number(params.trueFocalLengthCm ?? 15.0);

    const warnings: string[] = [];
    if (u <= f_true) {
      return {
        stateValues: { objectDistanceU: u, imageDistanceV: 999, focalLengthF: 0 },
        displayReadings: {
          u: { value: u, formatted: `${u.toFixed(1)} cm`, unit: 'cm' },
          v: { value: 999, formatted: 'Virtual image (cannot catch on screen)', unit: 'cm' },
        },
        isConnectionValid: false,
        connectionError: 'Object placed within focal distance (u ≤ f). Virtual erect image formed behind object; no real image on screen.',
        warnings: ['Move object beyond 15.0 cm to form a real inverted image on the screen.'],
      };
    }

    // Lens formula: 1/f = 1/v - 1/(-u) = 1/v + 1/u => 1/v = 1/f - 1/u => v = (u * f) / (u - f)
    const ideal_v = (u * f_true) / (u - f_true);
    const measured_v = quantizeToLeastCount(ideal_v, 0.1, { addNoise: true, noiseScale: 0.15 });
    const measured_f = (u * measured_v) / (u + measured_v);
    const magnification = -(measured_v / u);

    return {
      stateValues: {
        objectDistanceU: u,
        imageDistanceV: measured_v,
        focalLengthF: parseFloat(measured_f.toFixed(2)),
        magnification: parseFloat(magnification.toFixed(2)),
      },
      displayReadings: {
        u: { value: u, formatted: `${u.toFixed(1)} cm`, unit: 'cm' },
        v: { value: measured_v, formatted: `${measured_v.toFixed(1)} cm`, unit: 'cm' },
        f: { value: measured_f, formatted: `${measured_f.toFixed(2)} cm`, unit: 'cm' },
        magnification: { value: magnification, formatted: `${magnification.toFixed(2)}x (Inverted)`, unit: '' },
      },
      isConnectionValid: true,
      warnings,
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Obs. No.', unit: '#' },
    { key: 'u', label: 'Object Dist. u', unit: 'cm' },
    { key: 'v', label: 'Image Dist. v', unit: 'cm' },
    { key: 'invU', label: '1 / u', unit: 'cm⁻¹', calculatedFromFormula: '1 / u' },
    { key: 'invV', label: '1 / v', unit: 'cm⁻¹', calculatedFromFormula: '1 / v' },
    { key: 'focalLength', label: 'f = uv / (u+v)', unit: 'cm', calculatedFromFormula: '(u * v) / (u + v)' },
  ],
  sampleObservations: [
    { readingNo: 1, u: 20.0, v: 60.0, invU: 0.0500, invV: 0.0167, focalLength: 15.00 },
    { readingNo: 2, u: 25.0, v: 37.5, invU: 0.0400, invV: 0.0267, focalLength: 15.00 },
    { readingNo: 3, u: 30.0, v: 30.0, invU: 0.0333, invV: 0.0333, focalLength: 15.00 },
    { readingNo: 4, u: 40.0, v: 24.0, invU: 0.0250, invV: 0.0417, focalLength: 15.00 },
    { readingNo: 5, u: 50.0, v: 21.4, invU: 0.0200, invV: 0.0467, focalLength: 14.99 },
  ],
  graph: {
    xKey: 'invU',
    yKey: 'invV',
    xLabel: '1 / u',
    yLabel: '1 / v',
    xUnit: 'cm⁻¹',
    yUnit: 'cm⁻¹',
    expectedSlope: -1.0,
    slopeFormula: '1/v = -1/u + 1/f; Intercept on both axes = 1/f  =>  f = 1 / Intercept',
    interpretation: 'Graph between 1/v and 1/u is a straight line with slope = -1. The intercepts on both x and y axes equal 1/f = 0.0667 cm⁻¹, giving f = 15.0 cm.',
  },
  theoreticalFormula: '1/f = 1/v + 1/u (with magnitudes) => f = (u · v) / (u + v)',
  calculateResult: (observations: ObservationRow[]) => {
    if (!observations || observations.length === 0) {
      return {
        calculatedValue: 0,
        theoreticalValue: 15.0,
        percentageError: 100,
        unit: 'cm',
        formulaSteps: ['No observations'],
        isAccurate: false,
      };
    }
    const fValues = observations.map((o) => (o.u * o.v) / (o.u + o.v));
    const meanF = fValues.reduce((a, b) => a + b, 0) / fValues.length;
    const trueF = 15.0;
    const error = Math.abs(meanF - trueF) / trueF * 100;

    return {
      calculatedValue: parseFloat(meanF.toFixed(2)),
      theoreticalValue: trueF,
      percentageError: parseFloat(error.toFixed(2)),
      unit: 'cm',
      formulaSteps: [
        `Individual f values: ${fValues.map((f) => f.toFixed(2) + ' cm').join(', ')}`,
        `Mean Focal Length f = (Σ f_i) / n = ${meanF.toFixed(2)} cm`,
        `At 2f position (u = 30 cm, v = 30 cm): f = 30 / 2 = 15.0 cm`,
        `Percentage Error = |${meanF.toFixed(2)} - 15.0| / 15.0 × 100% = ${error.toFixed(2)}%`,
      ],
      isAccurate: error <= 3.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_lens_01',
      question: 'What happens to the image on the screen when the upper half of the convex lens is covered with black paper?',
      options: [
        'The complete image is still formed, but its intensity (brightness) is reduced by half.',
        'Only the bottom half of the image is visible.',
        'The image disappears entirely.',
        'The image becomes double in size.',
      ],
      correctOptionIndex: 0,
      explanation: 'Every part of the lens forms a complete image by refracting rays from all points of the object. Covering half the lens reduces the light-gathering area (aperture) by 50%, so the full image remains intact but at half the brightness.',
      misconceptionTag: 'covered_lens_image_formation',
    },
  ],
  safetyNotes: [
    { id: 'safe_lens_01', note: 'Never look directly at the sun through the convex lens as it can cause permanent retinal damage.', severity: 'critical' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Setup at 2f (30 cm)',
      narration: "Aarohi: Let's find the focal length of this convex lens. I place the object needle at u = 30.0 cm. Notice that when u = 2f, the real inverted image forms at exactly v = 30.0 cm with equal size!",
      targetControls: { objectDistanceCm: 30.0 },
      expectedObservation: { readingNo: 3, u: 30.0, v: 30.0, invU: 0.0333, invV: 0.0333, focalLength: 15.00 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Closer Object (u = 20 cm)',
      narration: "Aarohi: Moving the object closer to u = 20.0 cm pushes the real image far out to v = 60.0 cm, producing an enlarged image with 3x magnification. Still, f = (20 × 60)/(20 + 60) = 15.0 cm!",
      targetControls: { objectDistanceCm: 20.0 },
      expectedObservation: { readingNo: 1, u: 20.0, v: 60.0, invU: 0.0500, invV: 0.0167, focalLength: 15.00 },
      durationMs: 3500,
    },
  ],
};
