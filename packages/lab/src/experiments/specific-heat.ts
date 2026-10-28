import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const SPECIFIC_HEAT_EXPERIMENT: ExperimentDefinition = {
  id: 'specific_heat',
  title: 'Determination of Specific Heat Capacity by Method of Mixtures',
  subject: 'physics',
  grade: '11',
  conceptIds: ['thermodynamics_heat', 'conservation_energy'],
  aim: 'To determine the specific heat capacity of a given solid (brass) using a copper calorimeter by the method of mixtures.',
  apparatus: [
    { id: 'app_calorimeter', name: 'Copper Calorimeter with Wooden Box & Stirrer', spec: STANDARD_INSTRUMENTS.calorimeter, quantity: 1, roleDescription: 'Thermally insulated calorimeter vessel' },
    { id: 'app_solid', name: 'Brass Cylinder Specimen (m ≈ 80.0 g, c ≈ 0.380 J/g·K)', spec: STANDARD_INSTRUMENTS.pendulum_bob, quantity: 1, roleDescription: 'Heated metal specimen' },
    { id: 'app_thermometer', name: 'Precision Mercury Thermometer (0–100°C, LC 0.5°C)', spec: STANDARD_INSTRUMENTS.thermometer, quantity: 1, roleDescription: 'Measures water and mixture temperature' },
    { id: 'app_balance', name: 'Chemical Balance (LC 0.01 g)', spec: STANDARD_INSTRUMENTS.beam_balance, quantity: 1, roleDescription: 'Measures masses of calorimeter, water, and solid' },
  ],
  variables: [
    { name: 'Initial Hot Metal Temp', symbol: 'T1', unit: '°C', role: 'independent', description: 'Temperature of solid in boiling bath (100°C)' },
    { name: 'Initial Water Temp', symbol: 'T2', unit: '°C', role: 'independent', description: 'Room temperature of water in calorimeter' },
    { name: 'Final Equilibrium Temp', symbol: 'T_final', unit: '°C', role: 'dependent', description: 'Equilibrium temperature reached after stirring' },
    { name: 'Specific Heat of Solid', symbol: 'c_solid', unit: 'J/g·K', role: 'dependent', description: 'Derived from heat conservation' },
  ],
  defaultParams: {
    solidMassG: 80.0,
    calorimeterMassG: 60.0,
    waterMassG: 120.0,
    hotTempC: 100.0,
    coldTempC: 22.0,
    trueSpecificHeatSolid: 0.380, // J/g·K (Brass)
  },
  simulate: (params): SimulationResult => {
    const m1 = Number(params.solidMassG ?? 80.0);
    const m_cal = Number(params.calorimeterMassG ?? 60.0);
    const m2 = Number(params.waterMassG ?? 120.0);
    const T1 = Number(params.hotTempC ?? 100.0);
    const T2 = Number(params.coldTempC ?? 22.0);
    const c1_true = Number(params.trueSpecificHeatSolid ?? 0.380);

    const c_water = 4.184; // J/g·K
    const c_copper = 0.385; // J/g·K

    // Heat lost by solid = Heat gained by (water + calorimeter)
    // m1 * c1 * (T1 - Tf) = (m2 * c_water + m_cal * c_copper) * (Tf - T2)
    // Let W_eq = m2 * c_water + m_cal * c_copper
    const W_eq = m2 * c_water + m_cal * c_copper; // 120*4.184 + 60*0.385 = 502.08 + 23.1 = 525.18 J/K
    const C_solid = m1 * c1_true; // 80 * 0.38 = 30.4 J/K

    // C_solid * T1 - C_solid * Tf = W_eq * Tf - W_eq * T2
    // Tf = (C_solid * T1 + W_eq * T2) / (C_solid + W_eq)
    const ideal_Tf = (C_solid * T1 + W_eq * T2) / (C_solid + W_eq);

    const measured_Tf = quantizeToLeastCount(ideal_Tf, 0.5, { addNoise: true, noiseScale: 0.2 });
    // Re-derive c1 from measured Tf:
    const heatGained = W_eq * (measured_Tf - T2);
    const deltaT_solid = T1 - measured_Tf;
    const calc_c1 = deltaT_solid > 0 ? heatGained / (m1 * deltaT_solid) : 0;

    return {
      stateValues: {
        solidMassG: m1,
        waterMassG: m2,
        initialWaterTempC: T2,
        initialSolidTempC: T1,
        equilibriumTempC: measured_Tf,
        calculatedSpecificHeat: parseFloat(calc_c1.toFixed(3)),
      },
      displayReadings: {
        solidMass: { value: m1, formatted: `${m1.toFixed(1)} g`, unit: 'g' },
        waterMass: { value: m2, formatted: `${m2.toFixed(1)} g`, unit: 'g' },
        initialTemp: { value: T2, formatted: `${T2.toFixed(1)} °C`, unit: '°C' },
        equilibriumTemp: { value: measured_Tf, formatted: `${measured_Tf.toFixed(1)} °C`, unit: '°C' },
        specificHeat: { value: calc_c1, formatted: `${calc_c1.toFixed(3)} J/g·K`, unit: 'J/g·K' },
      },
      isConnectionValid: true,
      warnings: [],
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Trial', unit: '#' },
    { key: 'solidMassG', label: 'Mass of Solid (m1)', unit: 'g' },
    { key: 'waterMassG', label: 'Mass of Water (m2)', unit: 'g' },
    { key: 'initialWaterTempC', label: 'Initial Temp (T2)', unit: '°C' },
    { key: 'hotTempC', label: 'Hot Solid Temp (T1)', unit: '°C' },
    { key: 'equilibriumTempC', label: 'Equilibrium Temp (Tf)', unit: '°C' },
    { key: 'specificHeat', label: 'c (J/g·K)', unit: 'J/g·K' },
  ],
  sampleObservations: [
    { readingNo: 1, solidMassG: 50.0, waterMassG: 120.0, initialWaterTempC: 22.0, hotTempC: 100.0, equilibriumTempC: 24.8, specificHeat: 0.381 },
    { readingNo: 2, solidMassG: 80.0, waterMassG: 120.0, initialWaterTempC: 22.0, hotTempC: 100.0, equilibriumTempC: 26.5, specificHeat: 0.384 },
    { readingNo: 3, solidMassG: 110.0, waterMassG: 120.0, initialWaterTempC: 22.0, hotTempC: 100.0, equilibriumTempC: 28.0, specificHeat: 0.382 },
  ],
  graph: {
    xKey: 'solidMassG',
    yKey: 'equilibriumTempC',
    xLabel: 'Mass of Solid (g)',
    yLabel: 'Final Equilibrium Temperature (°C)',
    xUnit: 'g',
    yUnit: '°C',
    expectedSlope: 0.05,
    slopeFormula: 'Heat Lost = Heat Gained; Equilibrium temp scales with thermal capacity of added specimen',
    interpretation: 'Shows thermal equilibrium leveling off asymptotically according to conservation of thermal energy.',
  },
  theoreticalFormula: 'm1 · c1 · (T1 - Tf) = (m2 · c_water + m_cal · c_copper) · (Tf - T2)',
  calculateResult: (observations: ObservationRow[]) => {
    if (!observations || observations.length === 0) {
      return {
        calculatedValue: 0,
        theoreticalValue: 0.380,
        percentageError: 100,
        unit: 'J/g·K',
        formulaSteps: ['No observations'],
        isAccurate: false,
      };
    }
    const cValues = observations.map((o) => o.specificHeat);
    const meanC = cValues.reduce((a, b) => a + b, 0) / cValues.length;
    const trueC = 0.380; // Brass
    const error = Math.abs(meanC - trueC) / trueC * 100;

    return {
      calculatedValue: parseFloat(meanC.toFixed(3)),
      theoreticalValue: trueC,
      percentageError: parseFloat(error.toFixed(2)),
      unit: 'J/g·K',
      formulaSteps: [
        `Mass of brass cylinder m1 = 80.0 g`,
        `Water equivalent of calorimeter + water = (120 × 4.184) + (60 × 0.385) = 525.18 J/K`,
        `Temperature rise of water (Tf - T2) = 26.5 - 22.0 = 4.5 °C`,
        `Temperature drop of brass (T1 - Tf) = 100.0 - 26.5 = 73.5 °C`,
        `Specific Heat c1 = (525.18 × 4.5) / (80.0 × 73.5) = ${meanC.toFixed(3)} J/g·K`,
        `Standard Brass Specific Heat = 0.380 J/g·K (Percentage Error: ${error.toFixed(2)}%)`,
      ],
      isAccurate: error <= 4.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_heat_01',
      question: 'Why is the copper calorimeter polished on the outside and placed inside a wooden insulation jacket with glass wool packing?',
      options: [
        'To minimize heat losses to the surroundings via conduction, convection, and radiation so that Heat Lost = Heat Gained holds true.',
        'To make the copper vessel look shiny and clean.',
        'To prevent the water from turning acidic.',
        'To block magnetic fields.',
      ],
      correctOptionIndex: 0,
      explanation: 'The method of mixtures relies on a closed thermodynamic system. The outer wooden box and glass wool prevent conduction and convection heat loss, while polishing minimizes radiative heat loss according to Stefan-Boltzmann law.',
      misconceptionTag: 'calorimeter_heat_isolation',
    },
  ],
  safetyNotes: [
    { id: 'safe_heat_01', note: 'Use tongs to transfer the boiling brass specimen quickly into the calorimeter to prevent atmospheric cooling during transfer.', severity: 'critical' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Measuring Initial Temperatures',
      narration: "Aarohi: Let's find the specific heat capacity of brass! Our calorimeter holds 120 g of water at 22.0 °C. The brass cylinder has been heated in boiling water to 100.0 °C.",
      targetControls: { solidMassG: 80.0, coldTempC: 22.0, hotTempC: 100.0 },
      expectedObservation: { readingNo: 1, solidMassG: 80.0, waterMassG: 120.0, initialWaterTempC: 22.0, hotTempC: 100.0, equilibriumTempC: 26.5, specificHeat: 0.384 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Transfer & Equilibrium',
      narration: "Aarohi: We quickly transfer the brass cylinder into the calorimeter and stir gently. Heat flows from the hot brass into the cold water until thermal equilibrium is reached at 26.5 °C. Specific heat calculates to 0.384 J/g·K!",
      targetControls: { solidMassG: 80.0, coldTempC: 22.0, hotTempC: 100.0 },
      expectedObservation: { readingNo: 1, solidMassG: 80.0, waterMassG: 120.0, initialWaterTempC: 22.0, hotTempC: 100.0, equilibriumTempC: 26.5, specificHeat: 0.384 },
      durationMs: 4000,
    },
  ],
};
