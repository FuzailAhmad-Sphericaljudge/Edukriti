import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const REFRACTION_GLASS_SLAB_EXPERIMENT: ExperimentDefinition = {
  id: 'refraction_glass_slab',
  title: "Refraction through a Glass Slab & Lateral Displacement",
  subject: 'physics',
  grade: '10',
  conceptIds: ['optics_lenses', 'wave_optics', 'light_reflection_refraction'],
  aim: "To trace the path of a ray of light passing through a rectangular glass slab for different angles of incidence, measure the angle of incidence (i), angle of refraction (r), angle of emergence (e), determine the refractive index of glass, and verify that lateral displacement increases with incidence angle.",
  apparatus: [
    { id: 'app_slab', name: 'Rectangular Glass Slab (Thickness t = 5.0 cm, μ ≈ 1.50)', spec: STANDARD_INSTRUMENTS.glass_slab, quantity: 1, roleDescription: 'Refracting medium' },
    { id: 'app_board', name: 'Drawing Board & White Sheet with Fixing Pins', spec: STANDARD_INSTRUMENTS.metre_scale, quantity: 1, roleDescription: 'Ray tracing plane' },
    { id: 'app_protractor', name: '360° Circular Protractor (LC 1°)', spec: STANDARD_INSTRUMENTS.metre_scale, quantity: 1, roleDescription: 'Measures angles i, r, e' },
    { id: 'app_scale', name: 'Precision Millimetre Ruler (LC 0.1 cm)', spec: STANDARD_INSTRUMENTS.metre_scale, quantity: 1, roleDescription: 'Measures lateral displacement d' },
  ],
  variables: [
    { name: 'Angle of Incidence', symbol: 'i', unit: '°', role: 'independent', description: 'Angle between incident ray and normal' },
    { name: 'Angle of Refraction', symbol: 'r', unit: '°', role: 'dependent', description: 'Angle inside glass slab' },
    { name: 'Angle of Emergence', symbol: 'e', unit: '°', role: 'dependent', description: 'Angle of ray exiting back into air' },
    { name: 'Lateral Displacement', symbol: 'd', unit: 'cm', role: 'dependent', description: 'Perpendicular shift between incident and emergent rays' },
    { name: 'Slab Thickness', symbol: 't', unit: 'cm', role: 'controlled', description: 'Fixed slab width = 5.0 cm' },
  ],
  defaultParams: {
    incidentAngleDeg: 30.0,
    slabThicknessCm: 5.0,
    glassRefractiveIndex: 1.50,
  },
  simulate: (params): SimulationResult => {
    const i_deg = Math.max(15, Math.min(75, Number(params.incidentAngleDeg ?? 30.0)));
    const t_cm = Number(params.slabThicknessCm ?? 5.0);
    const mu = Number(params.glassRefractiveIndex ?? 1.50);

    const i_rad = (i_deg * Math.PI) / 180;
    // Snell's Law: sin(i) / sin(r) = mu => sin(r) = sin(i) / mu
    const sin_r = Math.sin(i_rad) / mu;
    const r_rad = Math.asin(sin_r);
    const r_deg = (r_rad * 180) / Math.PI;

    // Angle of emergence equals angle of incidence for parallel faces: e = i
    const e_deg = i_deg;

    // Lateral displacement: d = t * sin(i - r) / cos(r)
    const d_cm = (t_cm * Math.sin(i_rad - r_rad)) / Math.cos(r_rad);

    const r_meas = quantizeToLeastCount(r_deg, 0.5, { addNoise: true, noiseScale: 0.1 });
    const e_meas = quantizeToLeastCount(e_deg, 0.5, { addNoise: true, noiseScale: 0.1 });
    const d_meas = quantizeToLeastCount(d_cm, 0.05, { addNoise: true, noiseScale: 0.1 });
    const sin_i = Math.sin(i_rad);
    const sin_r_meas = Math.sin((r_meas * Math.PI) / 180);
    const calculated_mu = sin_r_meas > 0 ? sin_i / sin_r_meas : mu;

    return {
      stateValues: {
        incidentAngleDeg: i_deg,
        refractionAngleDeg: r_meas,
        emergenceAngleDeg: e_meas,
        lateralDisplacementCm: d_meas,
        refractiveIndexMu: parseFloat(calculated_mu.toFixed(3)),
      },
      displayReadings: {
        angleI: { value: i_deg, formatted: `${i_deg.toFixed(1)}°`, unit: '°' },
        angleR: { value: r_meas, formatted: `${r_meas.toFixed(1)}°`, unit: '°' },
        angleE: { value: e_meas, formatted: `${e_meas.toFixed(1)}°`, unit: '°' },
        lateralShift: { value: d_meas, formatted: `${d_meas.toFixed(2)} cm`, unit: 'cm' },
        refractiveIndex: { value: calculated_mu, formatted: `${calculated_mu.toFixed(3)}`, unit: '' },
      },
      isConnectionValid: true,
      warnings: [],
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Obs. No.', unit: '#' },
    { key: 'angleI', label: 'Angle of Incidence (i)', unit: '°' },
    { key: 'angleR', label: 'Angle of Refraction (r)', unit: '°' },
    { key: 'angleE', label: 'Angle of Emergence (e)', unit: '°' },
    { key: 'sinI', label: 'sin(i)', unit: 'ratio', calculatedFromFormula: 'sin(angleI * π / 180)' },
    { key: 'sinR', label: 'sin(r)', unit: 'ratio', calculatedFromFormula: 'sin(angleR * π / 180)' },
    { key: 'mu', label: 'μ = sin(i) / sin(r)', unit: 'ratio', calculatedFromFormula: 'sinI / sinR' },
    { key: 'lateralShiftCm', label: 'Lateral Shift (d)', unit: 'cm' },
  ],
  sampleObservations: [
    { readingNo: 1, angleI: 30.0, angleR: 19.5, angleE: 30.0, sinI: 0.500, sinR: 0.334, mu: 1.50, lateralShiftCm: 0.97 },
    { readingNo: 2, angleI: 40.0, angleR: 25.4, angleE: 40.0, sinI: 0.643, sinR: 0.429, mu: 1.50, lateralShiftCm: 1.40 },
    { readingNo: 3, angleI: 50.0, angleR: 30.7, angleE: 50.0, sinI: 0.766, sinR: 0.511, mu: 1.50, lateralShiftCm: 1.93 },
    { readingNo: 4, angleI: 60.0, angleR: 35.3, angleE: 60.0, sinI: 0.866, sinR: 0.578, mu: 1.50, lateralShiftCm: 2.54 },
  ],
  graph: {
    xKey: 'sinR',
    yKey: 'sinI',
    xLabel: 'sin(r) - Sine of Angle of Refraction',
    yLabel: 'sin(i) - Sine of Angle of Incidence',
    xUnit: '',
    yUnit: '',
    expectedSlope: 1.50,
    slopeFormula: 'Slope = Δ(sin i) / Δ(sin r) = Refractive Index (μ)',
    interpretation: 'A straight line passing through the origin proves Snell\'s 2nd Law of Refraction: sin(i) / sin(r) = constant = 1.50.',
  },
  theoreticalFormula: 'μ = sin(i) / sin(r);  d = t · sin(i - r) / cos(r);  Angle of Emergence e = Angle of Incidence i',
  calculateResult: (observations: ObservationRow[]) => {
    if (!observations || observations.length === 0) {
      return {
        calculatedValue: 0,
        theoreticalValue: 1.50,
        percentageError: 100,
        unit: '',
        formulaSteps: ['No observations recorded'],
        isAccurate: false,
      };
    }
    const muValues = observations.map((o) => Math.sin(o.angleI * Math.PI / 180) / Math.sin(o.angleR * Math.PI / 180));
    const meanMu = muValues.reduce((a, b) => a + b, 0) / muValues.length;
    const trueMu = 1.50;
    const error = Math.abs(meanMu - trueMu) / trueMu * 100;

    return {
      calculatedValue: parseFloat(meanMu.toFixed(3)),
      theoreticalValue: trueMu,
      percentageError: parseFloat(error.toFixed(2)),
      unit: '',
      formulaSteps: [
        `Mean Refractive Index of Glass μ = (Σ sin i / sin r) / n = ${meanMu.toFixed(3)}`,
        `Angle of Emergence e closely tracks i across all trials (e ≈ i)`,
        `Lateral shift increases from 0.97 cm at i=30° up to 2.54 cm at i=60°`,
        `Percentage Error on μ = |${meanMu.toFixed(3)} - 1.500| / 1.500 × 100% = ${error.toFixed(2)}%`,
      ],
      isAccurate: error <= 2.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_refr_01',
      question: 'Why does the emergent ray exit parallel to the incident ray but laterally displaced?',
      options: [
        'Because the two opposite refracting surfaces of the rectangular slab are parallel; the ray bends toward the normal upon entering glass and by the exact same angle away from normal upon re-entering air.',
        'Because light reflects off the bottom surface.',
        'Because glass changes the color of light.',
        'It is an optical illusion created by the thickness of the glass.',
      ],
      correctOptionIndex: 0,
      explanation: 'At the first air-glass boundary, light bends toward the normal according to Snell\'s law (sin i / sin r = μ). At the second parallel glass-air boundary, the angle of incidence inside glass is r, so the angle of emergence e = i. Thus the emergent ray is parallel to the original incident path, shifted sideways by lateral displacement d.',
      misconceptionTag: 'parallel_slab_emergence_condition',
    },
  ],
  safetyNotes: [
    { id: 'safe_refr_01', note: 'Handle glass slab gently to prevent chipping polished optical edges, which would distort Snell refractions.', severity: 'info' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Incident Angle at 30°',
      narration: "Aarohi: Let's study refraction! We aim an incident ray at i = 30° on the glass slab. Inside the denser glass (μ = 1.50), the ray bends toward the normal to r = 19.5°.",
      targetControls: { incidentAngleDeg: 30.0 },
      expectedObservation: { readingNo: 1, angleI: 30.0, angleR: 19.5, angleE: 30.0, sinI: 0.500, sinR: 0.334, mu: 1.50, lateralShiftCm: 0.97 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Incident Angle at 50°',
      narration: "Aarohi: Increasing the angle of incidence to 50° widens the path inside to r = 30.7°, and the emergent ray emerges shifted sideways by d = 1.93 cm. Notice e = 50° — completely parallel!",
      targetControls: { incidentAngleDeg: 50.0 },
      expectedObservation: { readingNo: 3, angleI: 50.0, angleR: 30.7, angleE: 50.0, sinI: 0.766, sinR: 0.511, mu: 1.50, lateralShiftCm: 1.93 },
      durationMs: 3500,
    },
  ],
};
