import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const OHMS_LAW_EXPERIMENT: ExperimentDefinition = {
  id: 'ohms_law',
  title: "Ohm's Law Verification & Resistance Measurement",
  subject: 'physics',
  grade: '10',
  conceptIds: ['ohms_law', 'resistance_resistivity', 'electric_circuits'],
  aim: "To verify Ohm's law by plotting a graph between potential difference (V) and current (I), and determine the resistance of the given resistor.",
  apparatus: [
    { id: 'app_resistor', name: 'Unknown Resistor (R ≈ 5.0 Ω)', spec: STANDARD_INSTRUMENTS.resistor, quantity: 1, roleDescription: 'Conductor under test' },
    { id: 'app_ammeter', name: 'DC Ammeter (0–1.5 A, LC 0.02 A)', spec: STANDARD_INSTRUMENTS.ammeter, quantity: 1, roleDescription: 'Measures circuit current in series' },
    { id: 'app_voltmeter', name: 'DC Voltmeter (0–5 V, LC 0.05 V)', spec: STANDARD_INSTRUMENTS.voltmeter, quantity: 1, roleDescription: 'Measures potential drop across resistor in parallel' },
    { id: 'app_rheostat', name: 'Variable Rheostat (0–100 Ω)', spec: STANDARD_INSTRUMENTS.rheostat, quantity: 1, roleDescription: 'Regulates circuit current' },
    { id: 'app_battery', name: 'Battery (6 V DC) & Plug Key', spec: STANDARD_INSTRUMENTS.battery_key, quantity: 1, roleDescription: 'Power source' },
  ],
  requiredConnections: [
    { fromInstrumentId: 'app_battery', fromPin: 'bat_pos', toInstrumentId: 'app_ammeter', toPin: 'pos' },
    { fromInstrumentId: 'app_ammeter', fromPin: 'neg', toInstrumentId: 'app_resistor', toPin: 't1' },
    { fromInstrumentId: 'app_resistor', fromPin: 't2', toInstrumentId: 'app_rheostat', toPin: 'fixed_a' },
    { fromInstrumentId: 'app_rheostat', fromPin: 'slider_c', toInstrumentId: 'app_battery', toPin: 'key_term' },
    { fromInstrumentId: 'app_voltmeter', fromPin: 'pos', toInstrumentId: 'app_resistor', toPin: 't1' },
    { fromInstrumentId: 'app_voltmeter', fromPin: 'neg', toInstrumentId: 'app_resistor', toPin: 't2' },
  ],
  variables: [
    { name: 'Rheostat Resistance', symbol: 'R_rh', unit: 'Ω', role: 'independent', description: 'Resistance adjusted via slider' },
    { name: 'Current', symbol: 'I', unit: 'A', role: 'dependent', description: 'Current flowing through circuit measured by ammeter' },
    { name: 'Potential Difference', symbol: 'V', unit: 'V', role: 'dependent', description: 'Voltage drop across resistor measured by voltmeter' },
    { name: 'Temperature', symbol: 'T', unit: '°C', role: 'controlled', description: 'Kept constant to prevent thermal resistance drift' },
  ],
  defaultParams: {
    rheostatSlider: 0.5, // 0 to 1 position
    plugKeyClosed: true,
    resistorTrueValue: 5.0, // Ohms
    batteryEmf: 6.0, // Volts
    reversePolarity: false,
  },
  simulate: (params, connections): SimulationResult => {
    const plugKeyClosed = Boolean(params.plugKeyClosed ?? true);
    const slider = Math.max(0, Math.min(1, Number(params.rheostatSlider ?? 0.5)));
    const R_true = Number(params.resistorTrueValue ?? 5.0);
    const E = Number(params.batteryEmf ?? 6.0);
    const reversePolarity = Boolean(params.reversePolarity ?? false);

    const warnings: string[] = [];
    if (!plugKeyClosed) {
      return {
        stateValues: { current: 0, voltage: 0, resistance: 0 },
        displayReadings: {
          current: { value: 0, formatted: '0.00 A', unit: 'A' },
          voltage: { value: 0, formatted: '0.00 V', unit: 'V' },
        },
        isConnectionValid: true,
        warnings: ['Plug key is open. Circuit is broken; zero current flows.'],
      };
    }

    if (reversePolarity) {
      warnings.push('Warning: Voltmeter connected with reverse polarity! Pointer deflects below zero.');
    }

    // Rheostat resistance: 5 ohms (slider=0) to 55 ohms (slider=1)
    const R_rh = 5 + slider * 50;
    const internal_r = 0.5;
    const total_R = R_true + R_rh + internal_r;

    const ideal_I = E / total_R;
    const ideal_V = ideal_I * R_true;

    // Apply realistic least count quantization and small thermal noise
    const ammeterLC = STANDARD_INSTRUMENTS.ammeter.leastCount;
    const voltmeterLC = STANDARD_INSTRUMENTS.voltmeter.leastCount;

    const I_measured = quantizeToLeastCount(ideal_I, ammeterLC, { addNoise: true, noiseScale: 0.2 });
    const V_measured = quantizeToLeastCount(ideal_V, voltmeterLC, { addNoise: true, noiseScale: 0.2 });
    const R_calc = I_measured > 0 ? parseFloat((V_measured / I_measured).toFixed(2)) : 0;

    return {
      stateValues: {
        current: I_measured,
        voltage: reversePolarity ? -V_measured : V_measured,
        resistance: R_calc,
      },
      displayReadings: {
        current: { value: I_measured, formatted: `${I_measured.toFixed(2)} A`, unit: 'A' },
        voltage: {
          value: reversePolarity ? -V_measured : V_measured,
          formatted: reversePolarity ? `-${V_measured.toFixed(2)} V (Reverse Deflection)` : `${V_measured.toFixed(2)} V`,
          unit: 'V',
        },
      },
      isConnectionValid: !reversePolarity,
      connectionError: reversePolarity ? 'Voltmeter polarity reversed' : undefined,
      warnings,
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Obs. No.', unit: '#' },
    { key: 'current', label: 'Current (I)', unit: 'A' },
    { key: 'voltage', label: 'Potential Difference (V)', unit: 'V' },
    { key: 'resistance', label: 'R = V / I', unit: 'Ω', calculatedFromFormula: 'voltage / current' },
  ],
  sampleObservations: [
    { readingNo: 1, current: 0.20, voltage: 1.00, resistance: 5.00 },
    { readingNo: 2, current: 0.32, voltage: 1.60, resistance: 5.00 },
    { readingNo: 3, current: 0.44, voltage: 2.20, resistance: 5.00 },
    { readingNo: 4, current: 0.56, voltage: 2.80, resistance: 5.00 },
    { readingNo: 5, current: 0.68, voltage: 3.40, resistance: 5.00 },
  ],
  graph: {
    xKey: 'current',
    yKey: 'voltage',
    xLabel: 'Current (I)',
    yLabel: 'Potential Difference (V)',
    xUnit: 'A',
    yUnit: 'V',
    expectedSlope: 5.0,
    slopeFormula: 'Slope = ΔV / ΔI = Resistance (R)',
    interpretation: 'A straight line passing through the origin verifies that V ∝ I (Ohm\'s Law). The slope of the V-I graph equals the resistance R.',
  },
  theoreticalFormula: 'V = I · R  =>  R = V / I  = Slope of V-I graph',
  calculateResult: (observations: ObservationRow[]) => {
    if (!observations || observations.length === 0) {
      return {
        calculatedValue: 0,
        theoreticalValue: 5.0,
        percentageError: 100,
        unit: 'Ω',
        formulaSteps: ['No observations recorded'],
        isAccurate: false,
      };
    }
    const rValues = observations.map((o) => (o.current > 0 ? o.voltage / o.current : 0)).filter((r) => r > 0);
    const meanR = rValues.reduce((a, b) => a + b, 0) / rValues.length;
    const theoreticalR = 5.0;
    const error = Math.abs(meanR - theoreticalR) / theoreticalR * 100;

    return {
      calculatedValue: parseFloat(meanR.toFixed(2)),
      theoreticalValue: theoreticalR,
      percentageError: parseFloat(error.toFixed(2)),
      unit: 'Ω',
      formulaSteps: [
        `Mean Resistance R = (Σ V_i / I_i) / n = ${meanR.toFixed(2)} Ω`,
        `Slope of V-I line = ΔV / ΔI ≈ ${meanR.toFixed(2)} Ω`,
        `Percentage Error = |${meanR.toFixed(2)} - ${theoreticalR}| / ${theoreticalR} × 100% = ${error.toFixed(2)}%`,
      ],
      isAccurate: error <= 5.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_ohm_01',
      question: "Why must the voltmeter be connected in parallel and ammeter in series in Ohm's law experiment?",
      options: [
        'Voltmeter has very high resistance so it draws negligible current; ammeter has very low resistance so it does not drop voltage.',
        'Voltmeter has low resistance so current flows easily; ammeter has high resistance to block voltage.',
        'It does not matter; both instruments can be connected interchangeably.',
        'Ammeter measures potential and voltmeter measures current.',
      ],
      correctOptionIndex: 0,
      explanation: 'A voltmeter must have high internal resistance so connecting it in parallel does not alter the main branch current. An ammeter must have near-zero resistance to measure current without creating a large parasitic voltage drop.',
      misconceptionTag: 'instrument_impedance_confusion',
    },
    {
      id: 'viva_ohm_02',
      question: "Why does the V-I curve bend away from a straight line if current is passed continuously for a long time?",
      options: [
        'The wire heats up (Joule heating), increasing its resistance since resistance increases with temperature in conductors.',
        'The battery gains voltage over time.',
        'The electrons get exhausted and move slower.',
        'Ohm\'s law stops being a law of physics after 2 minutes.',
      ],
      correctOptionIndex: 0,
      explanation: 'Ohm\'s law holds only when physical conditions like temperature remain constant. Prolonged current produces heat (H = I²Rt), raising conductor temperature and increasing resistance.',
      misconceptionTag: 'temperature_independence_misconception',
    },
  ],
  safetyNotes: [
    { id: 'safe_ohm_01', note: 'Do not leave the plug key inserted continuously. Remove the key between readings to avoid resistor overheating.', severity: 'critical' },
    { id: 'safe_ohm_02', note: 'Ensure ammeter positive terminal connects toward battery positive terminal to avoid reverse needle deflection.', severity: 'warning' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Circuit Setup',
      narration: "Aarohi: Hello! Let's verify Ohm's law. Notice our circuit: battery, plug key, ammeter in series, voltmeter in parallel across the unknown resistor, and a rheostat.",
      targetControls: { plugKeyClosed: false, rheostatSlider: 0.1 },
      expectedObservation: { readingNo: 0, current: 0, voltage: 0 },
      durationMs: 2500,
    },
    {
      stepNumber: 2,
      title: 'First Reading',
      narration: "Aarohi: Now I insert the plug key. I adjust the rheostat slider to position 0.2. The ammeter reads 0.20 A and the voltmeter reads 1.00 V.",
      targetControls: { plugKeyClosed: true, rheostatSlider: 0.2 },
      expectedObservation: { readingNo: 1, current: 0.20, voltage: 1.00, resistance: 5.00 },
      durationMs: 3000,
    },
    {
      stepNumber: 3,
      title: 'Second Reading & Slope',
      narration: "Aarohi: Moving the slider to 0.4 increases the current to 0.32 A, and voltage rises proportionally to 1.60 V. The ratio V/I remains steady at 5.0 Ω! Now it's your turn to record the remaining readings.",
      targetControls: { plugKeyClosed: true, rheostatSlider: 0.4 },
      expectedObservation: { readingNo: 2, current: 0.32, voltage: 1.60, resistance: 5.00 },
      durationMs: 3500,
    },
  ],
};
