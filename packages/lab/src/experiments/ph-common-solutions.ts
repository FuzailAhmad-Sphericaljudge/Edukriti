import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export interface SampleSolution {
  id: string;
  name: string;
  truePh: number;
  expectedColor: string;
  nature: 'Strong Acid' | 'Weak Acid' | 'Neutral' | 'Weak Base' | 'Strong Base';
}

export const COMMON_SOLUTIONS: SampleSolution[] = [
  { id: 'sol_lemon', name: 'Fresh Lemon Juice (Citric Acid)', truePh: 2.2, expectedColor: 'Red / Deep Orange', nature: 'Strong Acid' },
  { id: 'sol_vinegar', name: 'Household Vinegar (Acetic Acid 5%)', truePh: 2.8, expectedColor: 'Orange', nature: 'Weak Acid' },
  { id: 'sol_water', name: 'Distilled Pure Water', truePh: 7.0, expectedColor: 'Green', nature: 'Neutral' },
  { id: 'sol_baking_soda', name: 'Baking Soda Solution (NaHCO3)', truePh: 8.5, expectedColor: 'Blue-Green', nature: 'Weak Base' },
  { id: 'sol_soap', name: 'Liquid Hand Soap Solution', truePh: 10.0, expectedColor: 'Blue / Indigo', nature: 'Weak Base' },
  { id: 'sol_naoh', name: 'Dilute Sodium Hydroxide (0.1 M NaOH)', truePh: 13.0, expectedColor: 'Deep Violet / Purple', nature: 'Strong Base' },
];

export const PH_COMMON_SOLUTIONS_EXPERIMENT: ExperimentDefinition = {
  id: 'ph_common_solutions',
  title: 'pH Analysis of Common Solutions using Universal Indicator & pH Meter',
  subject: 'chemistry',
  grade: '10',
  conceptIds: ['acids_bases_salts', 'chemical_reactions_equations'],
  aim: 'To determine the pH of various common solutions (lemon juice, vinegar, pure water, baking soda, soap, dilute NaOH) using pH paper / universal indicator color scale and verify with a digital pH meter.',
  apparatus: [
    { id: 'app_ph_meter', name: 'Benchtop Digital pH Meter (LC 0.01 pH)', spec: STANDARD_INSTRUMENTS.ph_meter, quantity: 1, roleDescription: 'Direct glass electrode potentiometric pH measurement' },
    { id: 'app_ph_paper', name: 'Universal Indicator Paper Strip & Color Chart', spec: STANDARD_INSTRUMENTS.ph_meter, quantity: 1, roleDescription: 'Visual broad-spectrum pH classification' },
    { id: 'app_wash_bottle', name: 'Wash Bottle with Deionized Water', spec: STANDARD_INSTRUMENTS.measuring_cylinder, quantity: 1, roleDescription: 'Rinses electrode between solution tests' },
    { id: 'app_test_tubes', name: 'Set of 6 Clean Test Tubes on Rack', spec: STANDARD_INSTRUMENTS.measuring_cylinder, quantity: 6, roleDescription: 'Specimen containers' },
  ],
  variables: [
    { name: 'Tested Solution', symbol: 'Solution', unit: 'sample', role: 'independent', description: 'Sample being evaluated' },
    { name: 'Observed Color', symbol: 'Color', unit: 'visual', role: 'dependent', description: 'Color produced on universal indicator' },
    { name: 'Electrode pH', symbol: 'pH', unit: 'pH', role: 'dependent', description: 'Quantitative digital electrode readout' },
    { name: 'Electrode Cleanliness', symbol: 'Rinsed', unit: 'boolean', role: 'controlled', description: 'Rinsing electrode prevents cross-contamination' },
  ],
  defaultParams: {
    selectedSolutionId: 'sol_lemon',
    electrodeRinsed: true,
  },
  simulate: (params): SimulationResult => {
    const solId = String(params.selectedSolutionId ?? 'sol_lemon');
    const rinsed = Boolean(params.electrodeRinsed ?? true);

    const solution = COMMON_SOLUTIONS.find((s) => s.id === solId) ?? COMMON_SOLUTIONS[0];
    let phValue = solution.truePh;

    const warnings: string[] = [];
    if (!rinsed) {
      // Contamination drag from previous sample
      phValue = phValue * 0.8 + 7.0 * 0.2;
      warnings.push('Electrode was not rinsed with distilled water! Cross-contamination shifted the pH reading toward neutral.');
    }

    const measured_ph = quantizeToLeastCount(phValue, 0.01, { addNoise: true, noiseScale: 0.1 });

    return {
      stateValues: {
        truePh: solution.truePh,
        measuredPh: measured_ph,
        isRinsed: rinsed ? 1 : 0,
      },
      displayReadings: {
        sample: { value: 0, formatted: solution.name, unit: '' },
        colorChart: { value: measured_ph, formatted: solution.expectedColor, unit: '' },
        digitalPh: { value: measured_ph, formatted: `${measured_ph.toFixed(2)} pH`, unit: 'pH' },
        classification: { value: measured_ph, formatted: solution.nature, unit: '' },
      },
      isConnectionValid: rinsed,
      warnings,
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Sample #', unit: '#' },
    { key: 'solutionName', label: 'Solution Name', unit: 'text' },
    { key: 'indicatorColor', label: 'Universal Indicator Color', unit: 'color' },
    { key: 'measuredPh', label: 'Digital pH', unit: 'pH' },
    { key: 'nature', label: 'Inferred Nature', unit: 'classification' },
  ],
  sampleObservations: [
    { readingNo: 1, solutionName: 1, indicatorColor: 1, measuredPh: 2.20, nature: 1 },
    { readingNo: 2, solutionName: 2, indicatorColor: 2, measuredPh: 2.80, nature: 2 },
    { readingNo: 3, solutionName: 3, indicatorColor: 3, measuredPh: 7.00, nature: 3 },
    { readingNo: 4, solutionName: 4, indicatorColor: 4, measuredPh: 8.50, nature: 4 },
    { readingNo: 5, solutionName: 5, indicatorColor: 5, measuredPh: 10.00, nature: 4 },
    { readingNo: 6, solutionName: 6, indicatorColor: 6, measuredPh: 13.00, nature: 5 },
  ],
  graph: {
    xKey: 'readingNo',
    yKey: 'measuredPh',
    xLabel: 'Sample Number (1: Lemon, 2: Vinegar, 3: Water, 4: Soda, 5: Soap, 6: NaOH)',
    yLabel: 'Measured pH Level (0 to 14)',
    xUnit: '#',
    yUnit: 'pH',
    expectedSlope: 2.0,
    slopeFormula: 'pH Spectrum: Acids (pH < 7) -> Neutral (pH = 7) -> Bases (pH > 7)',
    interpretation: 'Visualizes the full dynamic range of the logarithmic pH scale, from strongly acidic lemon juice (pH 2.2) to strongly alkaline NaOH (pH 13.0).',
  },
  theoreticalFormula: 'pH = -log10[H+];  pH < 7 (Acidic), pH = 7 (Neutral), pH > 7 (Basic)',
  calculateResult: (observations: ObservationRow[]) => {
    return {
      calculatedValue: 7.0,
      theoreticalValue: 7.0,
      percentageError: 0.0,
      unit: 'pH',
      formulaSteps: [
        'Strong Acids: Lemon Juice (pH 2.2, Red) - high [H+] concentration (~6.3 × 10⁻³ M)',
        'Weak Acids: Vinegar (pH 2.8, Orange) - partial acetic acid ionization',
        'Neutral: Pure Distilled Water (pH 7.0, Green) - [H+] = [OH-] = 1.0 × 10⁻⁷ M',
        'Weak Bases: Baking Soda (pH 8.5) & Soap (pH 10.0, Blue)',
        'Strong Base: Dilute NaOH (pH 13.0, Violet) - complete dissociation into Na+ and OH-',
      ],
      isAccurate: true,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_ph_01',
      question: 'What is the physical meaning of a pH difference of 1 unit (e.g. from pH 3 to pH 2)?',
      options: [
        'A decrease of 1 pH unit represents a 10-fold (1000%) increase in hydrogen ion concentration [H+] because the pH scale is logarithmic.',
        'It means 1 gram more acid was added.',
        'It represents a 1% change in acidity.',
        'It means the temperature changed by 1 degree Celsius.',
      ],
      correctOptionIndex: 0,
      explanation: 'Because pH is defined as -log10[H⁺], each integer drop on the pH scale represents a tenfold increase in the hydronium ion concentration [H⁺]. Thus, lemon juice (pH 2) is 10 times more acidic than vinegar (pH 3) and 100,000 times more acidic than water (pH 7).',
      misconceptionTag: 'logarithmic_scale_misunderstanding',
    },
  ],
  safetyNotes: [
    { id: 'safe_ph_01', note: 'Always rinse the pH electrode with distilled water and gently blot (do not rub) with lint-free tissue between tests.', severity: 'info' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Testing Lemon Juice',
      narration: "Aarohi: Let's test common household solutions. First, we dip a universal indicator strip into fresh lemon juice. It turns deep orange-red, and our digital electrode reads pH 2.20 — strongly acidic!",
      targetControls: { selectedSolutionId: 'sol_lemon', electrodeRinsed: true },
      expectedObservation: { readingNo: 1, solutionName: 1, indicatorColor: 1, measuredPh: 2.20, nature: 1 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Neutral Pure Water',
      narration: "Aarohi: We rinse the probe thoroughly with distilled water and submerge it in pure water. The indicator turns emerald green and the meter reads exactly 7.00 — perfectly neutral.",
      targetControls: { selectedSolutionId: 'sol_water', electrodeRinsed: true },
      expectedObservation: { readingNo: 3, solutionName: 3, indicatorColor: 3, measuredPh: 7.00, nature: 3 },
      durationMs: 3000,
    },
    {
      stepNumber: 3,
      title: 'Testing Alkaline NaOH',
      narration: "Aarohi: Finally, dipping into dilute sodium hydroxide turns the paper deep royal violet, measuring pH 13.00. Now it's your turn to test vinegar, baking soda, and hand soap!",
      targetControls: { selectedSolutionId: 'sol_naoh', electrodeRinsed: true },
      expectedObservation: { readingNo: 6, solutionName: 6, indicatorColor: 6, measuredPh: 13.00, nature: 5 },
      durationMs: 3500,
    },
  ],
};
