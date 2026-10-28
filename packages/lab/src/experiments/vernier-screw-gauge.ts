import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const VERNIER_SCREW_GAUGE_EXPERIMENT: ExperimentDefinition = {
  id: 'vernier_screw_gauge',
  title: 'Precision Dimensional Metrology: Vernier Caliper & Screw Gauge',
  subject: 'physics',
  grade: '11',
  conceptIds: ['units_measurement_errors', 'motion_kinematics'],
  aim: 'To measure (i) the diameter and volume of a metal sphere/cylinder using a Vernier Caliper, and (ii) the diameter of a thin wire using a Micrometer Screw Gauge, applying appropriate zero error corrections.',
  apparatus: [
    { id: 'app_vernier', name: 'Standard Vernier Caliper (LC 0.01 cm, ZE +0.02 cm)', spec: STANDARD_INSTRUMENTS.vernier_caliper, quantity: 1, roleDescription: 'Linear dimensional measurements' },
    { id: 'app_screw_gauge', name: 'Micrometer Screw Gauge (LC 0.001 cm, ZE -0.003 cm)', spec: STANDARD_INSTRUMENTS.screw_gauge, quantity: 1, roleDescription: 'Thickness / small wire diameter measurements' },
    { id: 'app_sphere', name: 'Metallic Sphere (True d = 2.44 cm)', spec: STANDARD_INSTRUMENTS.pendulum_bob, quantity: 1, roleDescription: 'Caliper specimen' },
    { id: 'app_wire', name: 'Copper Wire (True d = 0.145 cm = 1.45 mm)', spec: STANDARD_INSTRUMENTS.resistor, quantity: 1, roleDescription: 'Screw gauge specimen' },
  ],
  variables: [
    { name: 'Instrument Selection', symbol: 'Inst', unit: 'type', role: 'independent', description: 'Vernier Caliper vs Screw Gauge' },
    { name: 'Main / Pitch Scale Reading', symbol: 'MSR/PSR', unit: 'cm', role: 'dependent', description: 'Coarse reading before fractional division' },
    { name: 'Coinciding Division', symbol: 'VSD/CSD', unit: 'div', role: 'dependent', description: 'Vernier or circular division matching reference line' },
    { name: 'Corrected Dimension', symbol: 'D_corr', unit: 'cm', role: 'dependent', description: 'D = Observed - (± Zero Error)' },
  ],
  defaultParams: {
    activeInstrument: 'vernier', // 'vernier' | 'screw_gauge'
    trueDimensionCm: 2.44, // Sphere diameter
    vernierZeroErrorCm: 0.02, // Positive zero error
    screwZeroErrorCm: -0.003, // Negative zero error
  },
  simulate: (params): SimulationResult => {
    const inst = String(params.activeInstrument ?? 'vernier');
    const d_true = Number(params.trueDimensionCm ?? (inst === 'vernier' ? 2.44 : 0.145));
    const ze_vernier = Number(params.vernierZeroErrorCm ?? 0.02);
    const ze_screw = Number(params.screwZeroErrorCm ?? -0.003);

    if (inst === 'vernier') {
      const lc = STANDARD_INSTRUMENTS.vernier_caliper.leastCount; // 0.01 cm
      // Observed reading includes zero error: Observed = True + ZE
      const observed = d_true + ze_vernier;
      const msr = Math.floor(observed * 10) / 10; // floor to 0.1 cm
      const vsd = Math.round((observed - msr) / lc);
      const measured_observed = msr + vsd * lc;
      const corrected = measured_observed - ze_vernier;

      return {
        stateValues: {
          mainScaleReading: msr,
          coincidingDivision: vsd,
          observedReading: parseFloat(measured_observed.toFixed(2)),
          zeroError: ze_vernier,
          correctedReading: parseFloat(corrected.toFixed(2)),
        },
        displayReadings: {
          msr: { value: msr, formatted: `${msr.toFixed(1)} cm`, unit: 'cm' },
          vsd: { value: vsd, formatted: `${vsd} div (× 0.01 = ${(vsd * lc).toFixed(2)} cm)`, unit: 'div' },
          zeroError: { value: ze_vernier, formatted: `+${ze_vernier.toFixed(2)} cm`, unit: 'cm' },
          corrected: { value: corrected, formatted: `${corrected.toFixed(2)} cm`, unit: 'cm' },
        },
        isConnectionValid: true,
        warnings: [],
      };
    } else {
      const lc = STANDARD_INSTRUMENTS.screw_gauge.leastCount; // 0.001 cm = 0.01 mm
      const d_mm = d_true * 10;
      const ze_mm = ze_screw * 10;
      const observed_mm = d_mm + ze_mm;
      const psr_mm = Math.floor(observed_mm);
      const csd = Math.round((observed_mm - psr_mm) / 0.01);
      const measured_obs_mm = psr_mm + csd * 0.01;
      const corrected_mm = measured_obs_mm - ze_mm;

      return {
        stateValues: {
          mainScaleReading: psr_mm / 10,
          coincidingDivision: csd,
          observedReading: parseFloat((measured_obs_mm / 10).toFixed(4)),
          zeroError: ze_screw,
          correctedReading: parseFloat((corrected_mm / 10).toFixed(4)),
        },
        displayReadings: {
          psr: { value: psr_mm, formatted: `${psr_mm.toFixed(0)} mm`, unit: 'mm' },
          csd: { value: csd, formatted: `${csd} div (× 0.01 = ${(csd * 0.01).toFixed(2)} mm)`, unit: 'div' },
          zeroError: { value: ze_mm, formatted: `${ze_mm.toFixed(3)} mm`, unit: 'mm' },
          corrected: { value: corrected_mm, formatted: `${corrected_mm.toFixed(3)} mm (${(corrected_mm / 10).toFixed(4)} cm)`, unit: 'mm' },
        },
        isConnectionValid: true,
        warnings: [],
      };
    }
  },
  observationColumns: [
    { key: 'readingNo', label: 'Obs. No.', unit: '#' },
    { key: 'instrument', label: 'Instrument', unit: 'type' },
    { key: 'msr', label: 'MSR / PSR', unit: 'cm' },
    { key: 'division', label: 'VSD / CSD', unit: 'div' },
    { key: 'observed', label: 'Observed Reading', unit: 'cm', calculatedFromFormula: 'msr + division * leastCount' },
    { key: 'zeroError', label: 'Zero Error (±ZE)', unit: 'cm' },
    { key: 'corrected', label: 'Corrected Dimension', unit: 'cm', calculatedFromFormula: 'observed - zeroError' },
  ],
  sampleObservations: [
    { readingNo: 1, instrument: 1, msr: 2.40, division: 6, observed: 2.46, zeroError: 0.02, corrected: 2.44 },
    { readingNo: 2, instrument: 1, msr: 2.40, division: 6, observed: 2.46, zeroError: 0.02, corrected: 2.44 },
    { readingNo: 3, instrument: 1, msr: 2.40, division: 6, observed: 2.46, zeroError: 0.02, corrected: 2.44 },
    { readingNo: 4, instrument: 2, msr: 0.10, division: 48, observed: 0.148, zeroError: -0.003, corrected: 0.151 },
    { readingNo: 5, instrument: 2, msr: 0.10, division: 45, observed: 0.145, zeroError: -0.003, corrected: 0.148 },
  ],
  graph: {
    xKey: 'division',
    yKey: 'observed',
    xLabel: 'Coinciding Division',
    yLabel: 'Observed Total Reading (cm)',
    xUnit: 'div',
    yUnit: 'cm',
    expectedSlope: 0.01,
    slopeFormula: 'Slope = Least Count of the instrument (0.01 cm for Vernier, 0.001 cm for Screw Gauge)',
    interpretation: 'A direct linear step relationship: Every single division increment advances the reading by exactly one least count.',
  },
  theoreticalFormula: 'Correct Reading = MSR + (Coinciding Division × Least Count) - (± Zero Error)',
  calculateResult: (observations: ObservationRow[]) => {
    const vernierRows = observations.filter((o) => o.instrument === 1 || o.corrected > 1.0);
    const meanVernierD = vernierRows.length > 0 ? vernierRows.reduce((a, b) => a + b.corrected, 0) / vernierRows.length : 2.44;
    const radiusCm = meanVernierD / 2;
    const sphereVolumeCm3 = (4 / 3) * Math.PI * Math.pow(radiusCm, 3);
    const trueD = 2.44;
    const error = Math.abs(meanVernierD - trueD) / trueD * 100;

    return {
      calculatedValue: parseFloat(meanVernierD.toFixed(3)),
      theoreticalValue: trueD,
      percentageError: parseFloat(error.toFixed(2)),
      unit: 'cm',
      formulaSteps: [
        `Mean Corrected Sphere Diameter D = ${meanVernierD.toFixed(3)} cm`,
        `Radius r = D / 2 = ${(meanVernierD / 2).toFixed(3)} cm`,
        `Volume of Sphere V = (4/3) π r³ = (4/3) × 3.14159 × ${(meanVernierD / 2).toFixed(3)}³ = ${sphereVolumeCm3.toFixed(3)} cm³`,
        `Percentage Error on Diameter = |${meanVernierD.toFixed(3)} - 2.440| / 2.440 × 100% = ${error.toFixed(2)}%`,
      ],
      isAccurate: error <= 1.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_metr_01',
      question: 'What is positive zero error in a vernier caliper and how is it corrected?',
      options: [
        'When jaws are closed, if the vernier zero lies to the right of main scale zero, it reads extra; it is corrected by subtracting the error from observed reading.',
        'When the jaws are dirty, making reading always zero.',
        'Positive zero error must be added twice to the final result.',
        'It indicates the caliper is calibrated for temperature expansion.',
      ],
      correctOptionIndex: 0,
      explanation: 'If the vernier zero lies to the right of the main scale zero when the jaws touch, the instrument already registers a positive offset before any object is inserted. Hence, the true reading = Observed Reading - (+Zero Error).',
      misconceptionTag: 'zero_error_sign_convention',
    },
    {
      id: 'viva_metr_02',
      question: 'What is "backlash error" in a screw gauge and how is it avoided?',
      options: [
        'Looseness in the screw threads after prolonged wear; avoided by always rotating the thimble in the same forward direction while taking a reading.',
        'A crack in the U-shaped steel frame.',
        'Turning the ratchet too quickly.',
        'An error caused by using the instrument upside down.',
      ],
      correctOptionIndex: 0,
      explanation: 'Backlash error arises from mechanical wear between the screw and internal nut threads. Reversing direction causes the thimble to turn without advancing the spindle. It is eliminated by always turning the thimble in a single forward direction.',
      misconceptionTag: 'screw_gauge_backlash_error',
    },
  ],
  safetyNotes: [
    { id: 'safe_metr_01', note: 'Never exert excessive force on the screw gauge thimble. Always turn using the safety ratchet head until it slips with a click.', severity: 'critical' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Determining Zero Error',
      narration: "Aarohi: Let's master precision measurement! When we close the vernier jaws completely, the vernier zero sits 2 divisions to the right of main zero. That means we have a positive zero error of +0.02 cm.",
      targetControls: { activeInstrument: 'vernier', trueDimensionCm: 0.0 },
      expectedObservation: { readingNo: 0, instrument: 1, msr: 0.0, division: 2, observed: 0.02, zeroError: 0.02, corrected: 0.0 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Measuring Sphere Diameter',
      narration: "Aarohi: Now we clamp our metallic sphere between the jaws. The main scale reads 2.4 cm, and the 6th vernier division aligns. Observed = 2.4 + 0.06 = 2.46 cm. Subtracting zero error (+0.02 cm) gives true diameter = 2.44 cm!",
      targetControls: { activeInstrument: 'vernier', trueDimensionCm: 2.44 },
      expectedObservation: { readingNo: 1, instrument: 1, msr: 2.4, division: 6, observed: 2.46, zeroError: 0.02, corrected: 2.44 },
      durationMs: 3500,
    },
  ],
};
