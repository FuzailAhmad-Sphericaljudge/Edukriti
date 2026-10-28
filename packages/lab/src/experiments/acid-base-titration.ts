import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const ACID_BASE_TITRATION_EXPERIMENT: ExperimentDefinition = {
  id: 'acid_base_titration',
  title: 'Acid-Base Titration: Determination of Molarity of HCl Solution',
  subject: 'chemistry',
  grade: '11',
  conceptIds: ['acids_bases_salts', 'chemical_reactions_equations', 'mole_concept_stoichiometry'],
  aim: 'To determine the molarity and strength of an unknown Hydrochloric Acid (HCl) solution by titrating against a standard 0.1 M Sodium Hydroxide (NaOH) solution using phenolphthalein indicator.',
  apparatus: [
    { id: 'app_burette', name: 'Burette (50 mL, LC 0.1 mL)', spec: STANDARD_INSTRUMENTS.burette, quantity: 1, roleDescription: 'Holds 0.1 M standard NaOH solution' },
    { id: 'app_pipette', name: 'Measuring Pipette (20 mL)', spec: STANDARD_INSTRUMENTS.pipette, quantity: 1, roleDescription: 'Transfers exact 20.0 mL of unknown HCl into conical flask' },
    { id: 'app_flask', name: 'Conical Flask (250 mL)', spec: STANDARD_INSTRUMENTS.measuring_cylinder, quantity: 1, roleDescription: 'Titration reaction vessel' },
    { id: 'app_ph_meter', name: 'Digital pH Meter & Electrode', spec: STANDARD_INSTRUMENTS.ph_meter, quantity: 1, roleDescription: 'Monitors real-time pH during titration' },
  ],
  variables: [
    { name: 'Volume of NaOH Added', symbol: 'V_NaOH', unit: 'mL', role: 'independent', description: 'Titrant added from burette' },
    { name: 'Solution pH', symbol: 'pH', unit: 'pH', role: 'dependent', description: 'Acidity / alkalinity of mixture' },
    { name: 'Indicator Color', symbol: 'Color', unit: 'visual', role: 'dependent', description: 'Colorless (< 8.2) to permanent light pink (> 8.2)' },
    { name: 'Volume of HCl Taken', symbol: 'V_HCl', unit: 'mL', role: 'controlled', description: 'Fixed at 20.0 mL via calibrated pipette' },
  ],
  defaultParams: {
    addedNaOhMl: 0.0, // mL
    hclVolumeMl: 20.0, // mL
    naOhMolarity: 0.10, // M
    hclTrueMolarity: 0.10, // M => equivalence at 20.0 mL
    indicatorAdded: true,
  },
  simulate: (params): SimulationResult => {
    const v_naoh = Math.max(0, Math.min(50, Number(params.addedNaOhMl ?? 0.0)));
    const v_hcl = Number(params.hclVolumeMl ?? 20.0);
    const m_naoh = Number(params.naOhMolarity ?? 0.10);
    const m_hcl = Number(params.hclTrueMolarity ?? 0.10);
    const indicatorAdded = Boolean(params.indicatorAdded ?? true);

    const moles_hcl = (v_hcl / 1000) * m_hcl;
    const moles_naoh = (v_naoh / 1000) * m_naoh;
    const total_volume_L = (v_hcl + v_naoh) / 1000;

    let ph: number;
    if (moles_hcl > moles_naoh) {
      // Excess strong acid
      const excess_h = (moles_hcl - moles_naoh) / total_volume_L;
      ph = -Math.log10(Math.max(1e-7, excess_h));
    } else if (Math.abs(moles_hcl - moles_naoh) < 1e-8) {
      // Exact equivalence point of strong acid - strong base = neutral 7.0
      ph = 7.0;
    } else {
      // Excess strong base
      const excess_oh = (moles_naoh - moles_hcl) / total_volume_L;
      const pOH = -Math.log10(Math.max(1e-7, excess_oh));
      ph = 14.0 - pOH;
    }

    const measured_ph = quantizeToLeastCount(ph, 0.01, { addNoise: true, noiseScale: 0.1 });

    // Phenolphthalein color threshold: Colorless until pH ~ 8.2, then faint pink, then deep magenta > 10.0
    let colorName = 'Colorless';
    let hexColor = '#f8fafc';
    if (indicatorAdded) {
      if (measured_ph < 8.2) {
        colorName = 'Colorless (Acidic)';
        hexColor = '#f8fafc';
      } else if (measured_ph <= 9.0) {
        colorName = 'Permanent Faint Pink (Equivalence Point Reached!)';
        hexColor = '#fbcfe8';
      } else {
        colorName = 'Deep Magenta Pink (Over-titrated)';
        hexColor = '#f43f5e';
      }
    } else {
      colorName = 'Colorless (Warning: No indicator added!)';
    }

    const warnings: string[] = [];
    if (!indicatorAdded) {
      warnings.push('Indicator was not added! You cannot detect the neutralization endpoint visually.');
    }
    if (measured_ph > 9.5) {
      warnings.push('Solution is over-titrated with excess NaOH. Endpoint was passed!');
    }

    const theoreticalEquivVolume = (v_hcl * m_hcl) / m_naoh;
    const isAtEndpoint = Math.abs(v_naoh - theoreticalEquivVolume) <= 0.1;

    return {
      stateValues: {
        volumeNaOhMl: v_naoh,
        ph: measured_ph,
        isEndpoint: isAtEndpoint ? 1 : 0,
      },
      displayReadings: {
        volumeNaOh: { value: v_naoh, formatted: `${v_naoh.toFixed(1)} mL`, unit: 'mL' },
        ph: { value: measured_ph, formatted: `${measured_ph.toFixed(2)}`, unit: 'pH' },
        color: { value: measured_ph, formatted: colorName, unit: '' },
      },
      isConnectionValid: indicatorAdded,
      warnings,
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Trial', unit: '#' },
    { key: 'initialBurette', label: 'Initial Burette', unit: 'mL' },
    { key: 'finalBurette', label: 'Final Burette', unit: 'mL' },
    { key: 'volumeAdded', label: 'Volume of NaOH (V2)', unit: 'mL', calculatedFromFormula: 'finalBurette - initialBurette' },
    { key: 'calculatedM1', label: 'M1 (HCl) = M2·V2 / V1', unit: 'M', calculatedFromFormula: '(0.1 * volumeAdded) / 20.0' },
  ],
  sampleObservations: [
    { readingNo: 1, initialBurette: 0.0, finalBurette: 20.2, volumeAdded: 20.2, calculatedM1: 0.101 },
    { readingNo: 2, initialBurette: 0.0, finalBurette: 20.0, volumeAdded: 20.0, calculatedM1: 0.100 },
    { readingNo: 3, initialBurette: 0.0, finalBurette: 20.0, volumeAdded: 20.0, calculatedM1: 0.100 },
  ],
  graph: {
    xKey: 'volumeAdded',
    yKey: 'calculatedM1',
    xLabel: 'Volume of 0.1M NaOH (mL)',
    yLabel: 'Solution pH / Titration Curve',
    xUnit: 'mL',
    yUnit: 'pH',
    expectedSlope: 0,
    slopeFormula: 'Equivalence Point occurs at inflection point d(pH)/dV = max (V_NaOH = 20.0 mL)',
    interpretation: 'A steep sigmoidal titration curve where pH jumps from ~3.5 to ~10.5 across a single drop at exactly 20.0 mL NaOH.',
  },
  theoreticalFormula: 'M1 · V1 (HCl) = M2 · V2 (NaOH)  =>  M1 = (M2 · V2) / V1;  Strength = M1 × 36.5 g/L',
  calculateResult: (observations: ObservationRow[]) => {
    if (!observations || observations.length === 0) {
      return {
        calculatedValue: 0,
        theoreticalValue: 0.10,
        percentageError: 100,
        unit: 'M',
        formulaSteps: ['No observations'],
        isAccurate: false,
      };
    }
    // Concordant volume calculation (average of closest concordant trials)
    const concordantVolumes = observations.map((o) => o.volumeAdded);
    const meanV2 = concordantVolumes.reduce((a, b) => a + b, 0) / concordantVolumes.length;
    const m_hcl = (0.10 * meanV2) / 20.0;
    const strength_gpl = m_hcl * 36.5; // HCl molar mass = 36.46 ≈ 36.5 g/mol
    const trueM = 0.10;
    const error = Math.abs(m_hcl - trueM) / trueM * 100;

    return {
      calculatedValue: parseFloat(m_hcl.toFixed(3)),
      theoreticalValue: trueM,
      percentageError: parseFloat(error.toFixed(2)),
      unit: 'M',
      formulaSteps: [
        `Mean Concordant Volume of 0.10 M NaOH (V2) = ${meanV2.toFixed(2)} mL`,
        `Volume of HCl solution pipetted (V1) = 20.00 mL`,
        `M1 (HCl) = (M2 × V2) / V1 = (0.10 × ${meanV2.toFixed(2)}) / 20.0 = ${m_hcl.toFixed(3)} M`,
        `Strength of HCl = M1 × 36.5 g/mol = ${strength_gpl.toFixed(2)} g/L`,
        `Percentage Error = |${m_hcl.toFixed(3)} - 0.10| / 0.10 × 100% = ${error.toFixed(2)}%`,
      ],
      isAccurate: error <= 3.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_titr_01',
      question: 'Why does phenolphthalein turn pink only at the endpoint in this strong acid - strong base titration?',
      options: [
        'Phenolphthalein is a weak organic acid whose conjugate base is pink. Below pH 8.2 it is non-ionized and colorless; above pH 8.2 it deprotonates into pink anion.',
        'Sodium chloride reacts with phenolphthalein to produce pink dye.',
        'The temperature rises to boiling point.',
        'Phenolphthalein absorbs red light from the air.',
      ],
      correctOptionIndex: 0,
      explanation: 'Phenolphthalein (HIn) is colorless in acidic form. Near the neutralization point, when OH⁻ ions exceed H⁺, the equilibrium shifts HIn + OH⁻ ⇌ In⁻ + H₂O. The quinonoid chromophore form In⁻ exhibits bright pink color in the pH range 8.2 to 10.0.',
      misconceptionTag: 'indicator_color_mechanism',
    },
    {
      id: 'viva_titr_02',
      question: 'Why should the burette nozzle be free of any trapped air bubble before starting the titration?',
      options: [
        'An air bubble increases the apparent volume discharged when it escapes during titration, causing an overestimation of the titrant volume.',
        'Air bubbles neutralize hydrochloric acid.',
        'Air makes the glass tube crack under pressure.',
        'It has no effect on titration accuracy.',
      ],
      correctOptionIndex: 0,
      explanation: 'If an air bubble below the stopcock escapes during the titration, the burette meniscus drops without delivering actual NaOH solution into the flask, artificially inflating V2 and resulting in a false higher calculated molarity.',
      misconceptionTag: 'burette_air_bubble_error',
    },
  ],
  safetyNotes: [
    { id: 'safe_titr_01', note: 'Sodium hydroxide (NaOH) is caustic and corrosive. Wear eye protection and rinse skin immediately with water if splashed.', severity: 'critical' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Pipetting 20 mL HCl',
      narration: "Aarohi: Welcome to the chemistry lab! We pipette 20.0 mL of unknown HCl into the conical flask, add 2 drops of phenolphthalein indicator, and fill our burette with 0.1 M NaOH to the 0.0 mL mark.",
      targetControls: { addedNaOhMl: 0.0, indicatorAdded: true },
      expectedObservation: { readingNo: 1, initialBurette: 0.0, finalBurette: 0.0, volumeAdded: 0.0, calculatedM1: 0 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Approaching Endpoint (19.5 mL)',
      narration: "Aarohi: I dispense 19.5 mL of NaOH. The pH rises to 3.8. The solution flashes pink briefly where drops strike, but swishes clear. We are right on the cusp of neutrality!",
      targetControls: { addedNaOhMl: 19.5, indicatorAdded: true },
      expectedObservation: { readingNo: 1, initialBurette: 0.0, finalBurette: 19.5, volumeAdded: 19.5, calculatedM1: 0.0975 },
      durationMs: 3500,
    },
    {
      stepNumber: 3,
      title: 'Equivalence Point (20.0 mL)',
      narration: "Aarohi: With just one more half-drop at 20.0 mL, the entire solution turns a permanent, delicate faint pink (pH 8.5)! Equivalence reached: M1 = (0.1 × 20.0) / 20.0 = 0.100 M. Perfect!",
      targetControls: { addedNaOhMl: 20.0, indicatorAdded: true },
      expectedObservation: { readingNo: 1, initialBurette: 0.0, finalBurette: 20.0, volumeAdded: 20.0, calculatedM1: 0.100 },
      durationMs: 4000,
    },
  ],
};
