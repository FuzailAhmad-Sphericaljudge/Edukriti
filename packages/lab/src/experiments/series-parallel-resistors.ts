import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const SERIES_PARALLEL_EXPERIMENT: ExperimentDefinition = {
  id: 'series_parallel_resistors',
  title: 'Equivalent Resistance in Series and Parallel Combinations',
  subject: 'physics',
  grade: '10',
  conceptIds: ['series_parallel_circuits', 'resistance_resistivity', 'electric_circuits'],
  aim: 'To verify the laws of combination of resistances in (i) series and (ii) parallel arrangements using an ammeter and voltmeter.',
  apparatus: [
    { id: 'app_r1', name: 'Resistor R1 (4.0 Ω)', spec: STANDARD_INSTRUMENTS.resistor, quantity: 1, roleDescription: 'First known resistor' },
    { id: 'app_r2', name: 'Resistor R2 (6.0 Ω)', spec: STANDARD_INSTRUMENTS.resistor, quantity: 1, roleDescription: 'Second known resistor' },
    { id: 'app_ammeter', name: 'DC Ammeter (0–1.5 A)', spec: STANDARD_INSTRUMENTS.ammeter, quantity: 1, roleDescription: 'Measures total current' },
    { id: 'app_voltmeter', name: 'DC Voltmeter (0–5 V)', spec: STANDARD_INSTRUMENTS.voltmeter, quantity: 1, roleDescription: 'Measures voltage drop across combination' },
    { id: 'app_rheostat', name: 'Variable Rheostat (0–100 Ω)', spec: STANDARD_INSTRUMENTS.rheostat, quantity: 1, roleDescription: 'Current limiter' },
    { id: 'app_battery', name: 'DC Battery (6 V) & Plug Key', spec: STANDARD_INSTRUMENTS.battery_key, quantity: 1, roleDescription: 'Power source' },
  ],
  variables: [
    { name: 'Circuit Topology', symbol: 'Mode', unit: 'type', role: 'independent', description: 'Series vs Parallel configuration' },
    { name: 'Total Voltage', symbol: 'V', unit: 'V', role: 'dependent', description: 'Measured potential difference' },
    { name: 'Total Current', symbol: 'I', unit: 'A', role: 'dependent', description: 'Current delivered to combination' },
    { name: 'Equivalent Resistance', symbol: 'R_eq', unit: 'Ω', role: 'dependent', description: 'Ratio V / I' },
  ],
  defaultParams: {
    mode: 'series', // 'series' | 'parallel'
    r1Value: 4.0,
    r2Value: 6.0,
    plugKeyClosed: true,
    rheostatSlider: 0.3,
    batteryEmf: 6.0,
  },
  simulate: (params): SimulationResult => {
    const mode = String(params.mode ?? 'series');
    const r1 = Number(params.r1Value ?? 4.0);
    const r2 = Number(params.r2Value ?? 6.0);
    const plugKeyClosed = Boolean(params.plugKeyClosed ?? true);
    const slider = Math.max(0, Math.min(1, Number(params.rheostatSlider ?? 0.3)));
    const E = Number(params.batteryEmf ?? 6.0);

    if (!plugKeyClosed) {
      return {
        stateValues: { current: 0, voltage: 0, equivalentResistance: 0 },
        displayReadings: {
          current: { value: 0, formatted: '0.00 A', unit: 'A' },
          voltage: { value: 0, formatted: '0.00 V', unit: 'V' },
        },
        isConnectionValid: true,
        warnings: ['Plug key is open; no current flowing.'],
      };
    }

    const R_eq_true = mode === 'series' ? r1 + r2 : (r1 * r2) / (r1 + r2);
    const R_rh = 10 + slider * 40;
    const total_R = R_eq_true + R_rh + 0.5;

    const I_ideal = E / total_R;
    const V_ideal = I_ideal * R_eq_true;

    const I_measured = quantizeToLeastCount(I_ideal, STANDARD_INSTRUMENTS.ammeter.leastCount, { addNoise: true, noiseScale: 0.2 });
    const V_measured = quantizeToLeastCount(V_ideal, STANDARD_INSTRUMENTS.voltmeter.leastCount, { addNoise: true, noiseScale: 0.2 });
    const R_calc = I_measured > 0 ? parseFloat((V_measured / I_measured).toFixed(2)) : 0;

    return {
      stateValues: {
        current: I_measured,
        voltage: V_measured,
        equivalentResistance: R_calc,
      },
      displayReadings: {
        current: { value: I_measured, formatted: `${I_measured.toFixed(2)} A`, unit: 'A' },
        voltage: { value: V_measured, formatted: `${V_measured.toFixed(2)} V`, unit: 'V' },
        equivalentResistance: { value: R_calc, formatted: `${R_calc.toFixed(2)} Ω`, unit: 'Ω' },
      },
      isConnectionValid: true,
      warnings: [],
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Obs. No.', unit: '#' },
    { key: 'mode', label: 'Topology', unit: 'text' },
    { key: 'voltage', label: 'Potential Difference (V)', unit: 'V' },
    { key: 'current', label: 'Current (I)', unit: 'A' },
    { key: 'equivalentResistance', label: 'R_eq = V / I', unit: 'Ω', calculatedFromFormula: 'voltage / current' },
  ],
  sampleObservations: [
    { readingNo: 1, mode: 1, voltage: 1.80, current: 0.18, equivalentResistance: 10.0 },
    { readingNo: 2, mode: 1, voltage: 2.40, current: 0.24, equivalentResistance: 10.0 },
    { readingNo: 3, mode: 2, voltage: 0.72, current: 0.30, equivalentResistance: 2.4 },
    { readingNo: 4, mode: 2, voltage: 1.20, current: 0.50, equivalentResistance: 2.4 },
  ],
  graph: {
    xKey: 'current',
    yKey: 'voltage',
    xLabel: 'Current (I)',
    yLabel: 'Potential Difference (V)',
    xUnit: 'A',
    yUnit: 'V',
    expectedSlope: 10.0,
    slopeFormula: 'Slope_series = R1 + R2; Slope_parallel = (R1·R2)/(R1+R2)',
    interpretation: 'The series V-I line has a much steeper slope (higher resistance R_s = 10 Ω) than the parallel combination line (R_p = 2.4 Ω).',
  },
  theoreticalFormula: 'Series: R_s = R1 + R2; Parallel: 1/R_p = 1/R1 + 1/R2  =>  R_p = (R1·R2)/(R1+R2)',
  calculateResult: (observations: ObservationRow[]) => {
    const seriesRows = observations.filter((o) => o.mode === 1 || o.equivalentResistance > 5);
    const parallelRows = observations.filter((o) => o.mode === 2 || (o.equivalentResistance > 0 && o.equivalentResistance <= 5));

    const meanSeries = seriesRows.length > 0 ? seriesRows.reduce((acc, r) => acc + (r.voltage / r.current), 0) / seriesRows.length : 10.0;
    const meanParallel = parallelRows.length > 0 ? parallelRows.reduce((acc, r) => acc + (r.voltage / r.current), 0) / parallelRows.length : 2.4;

    const trueSeries = 10.0; // 4 + 6
    const trueParallel = 2.4; // 24 / 10
    const errSeries = Math.abs(meanSeries - trueSeries) / trueSeries * 100;
    const errParallel = Math.abs(meanParallel - trueParallel) / trueParallel * 100;
    const avgErr = (errSeries + errParallel) / 2;

    return {
      calculatedValue: parseFloat(meanSeries.toFixed(2)),
      theoreticalValue: trueSeries,
      percentageError: parseFloat(avgErr.toFixed(2)),
      unit: 'Ω',
      formulaSteps: [
        `Theoretical R_series = R1 + R2 = 4.0 + 6.0 = 10.0 Ω`,
        `Experimental R_series = ${meanSeries.toFixed(2)} Ω (Error: ${errSeries.toFixed(2)}%)`,
        `Theoretical R_parallel = (R1·R2)/(R1+R2) = 24/10 = 2.40 Ω`,
        `Experimental R_parallel = ${meanParallel.toFixed(2)} Ω (Error: ${errParallel.toFixed(2)}%)`,
      ],
      isAccurate: avgErr <= 6.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_sp_01',
      question: 'Why is household wiring always connected in parallel rather than in series?',
      options: [
        'In parallel, each appliance operates at full mains voltage and can be switched independently; if one fails, others stay on.',
        'Parallel circuits consume zero power compared to series circuits.',
        'Series wiring would make all appliances too bright and blow up.',
        'Parallel wiring requires only one single wire throughout the house.',
      ],
      correctOptionIndex: 0,
      explanation: 'In parallel circuits, every branch experiences the same rated voltage (230V) and independent switching. In series, voltage divides, appliances cannot be operated independently, and a single broken filament shuts down the entire circuit.',
      misconceptionTag: 'household_circuit_topology',
    },
  ],
  safetyNotes: [
    { id: 'safe_sp_01', note: 'In parallel mode, total resistance is very low (2.4 Ω). Avoid moving the rheostat slider to zero to prevent high current draw.', severity: 'critical' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Series Verification',
      narration: "Aarohi: Let's connect R1 (4 Ω) and R2 (6 Ω) end-to-end in series. Notice that current has only one path. The total resistance equals 4 + 6 = 10 Ω.",
      targetControls: { mode: 'series', rheostatSlider: 0.3 },
      expectedObservation: { readingNo: 1, mode: 1, voltage: 2.00, current: 0.20, equivalentResistance: 10.0 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Parallel Verification',
      narration: "Aarohi: Now we rewire them across common nodes in parallel. The equivalent resistance drops to (4 × 6) / (4 + 6) = 2.4 Ω. For the same voltage, much more current flows!",
      targetControls: { mode: 'parallel', rheostatSlider: 0.3 },
      expectedObservation: { readingNo: 2, mode: 2, voltage: 0.72, current: 0.30, equivalentResistance: 2.4 },
      durationMs: 3000,
    },
  ],
};
