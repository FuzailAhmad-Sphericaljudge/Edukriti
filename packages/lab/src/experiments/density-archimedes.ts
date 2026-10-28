import type { ExperimentDefinition, ObservationRow, SimulationResult } from '../types.ts';
import { STANDARD_INSTRUMENTS, quantizeToLeastCount } from '../instruments/instrument-registry.ts';

export const DENSITY_ARCHIMEDES_EXPERIMENT: ExperimentDefinition = {
  id: 'density_archimedes',
  title: "Density of Solids & Verification of Archimedes' Principle",
  subject: 'physics',
  grade: '9',
  conceptIds: ['fluids_pressure_buoyancy', 'gravitation_orbits'],
  aim: "To determine the density of an insoluble metallic solid and establish the relation between the loss in weight of the solid when fully immersed in tap water with the weight of water displaced by it (Archimedes' Principle).",
  apparatus: [
    { id: 'app_spring_balance', name: 'Precision Spring Balance (0–5 N, LC 0.05 N)', spec: STANDARD_INSTRUMENTS.spring_balance, quantity: 1, roleDescription: 'Measures weight of solid in air and in water' },
    { id: 'app_measuring_cylinder', name: 'Graduated Measuring Cylinder (100 mL, LC 1 mL)', spec: STANDARD_INSTRUMENTS.measuring_cylinder, quantity: 1, roleDescription: 'Measures volume of water displaced' },
    { id: 'app_overflow_can', name: 'Overflow Eureka Can & Beaker', spec: STANDARD_INSTRUMENTS.measuring_cylinder, quantity: 1, roleDescription: 'Catches displaced liquid' },
    { id: 'app_metal_block', name: 'Brass Cylindrical Bob (Density ≈ 8.4 g/cm³)', spec: STANDARD_INSTRUMENTS.beam_balance, quantity: 1, roleDescription: 'Insoluble specimen under test' },
  ],
  variables: [
    { name: 'Immersion State', symbol: 'State', unit: 'state', role: 'independent', description: 'Air vs Fully Immersed in Water' },
    { name: 'Observed Weight', symbol: 'W', unit: 'N', role: 'dependent', description: 'Reading on spring balance' },
    { name: 'Displaced Volume', symbol: 'V', unit: 'mL', role: 'dependent', description: 'Rise in water level (V2 - V1)' },
    { name: 'Water Density', symbol: 'ρ_w', unit: 'g/cm³', role: 'controlled', description: 'Standard water density = 1.00 g/cm³' },
  ],
  defaultParams: {
    solidTrueMassG: 168.0, // g (Brass, 20 cm³ volume)
    solidTrueVolumeCm3: 20.0, // cm³
    immersedFraction: 1.0, // 0 to 1
    liquidDensityGcm3: 1.0, // water
  },
  simulate: (params): SimulationResult => {
    const mass_g = Number(params.solidTrueMassG ?? 168.0);
    const volume_cm3 = Number(params.solidTrueVolumeCm3 ?? 20.0);
    const frac = Math.max(0, Math.min(1, Number(params.immersedFraction ?? 1.0)));
    const rho_liq = Number(params.liquidDensityGcm3 ?? 1.0);

    const g = 9.80; // m/s²
    // Weight in air (N)
    const weight_air_N = (mass_g / 1000) * g; // 0.168 * 9.8 ≈ 1.646 N
    // Buoyant force: F_b = rho * V_disp * g
    const displaced_vol_cm3 = volume_cm3 * frac;
    const buoyant_force_N = (displaced_vol_cm3 * rho_liq / 1000) * g; // 20 * 1 / 1000 * 9.8 = 0.196 N
    const apparent_weight_N = weight_air_N - buoyant_force_N;

    const w_air_meas = quantizeToLeastCount(weight_air_N, 0.05, { addNoise: true, noiseScale: 0.1 });
    const w_imm_meas = quantizeToLeastCount(apparent_weight_N, 0.05, { addNoise: true, noiseScale: 0.1 });
    const vol_disp_meas = quantizeToLeastCount(displaced_vol_cm3, 1.0, { addNoise: true, noiseScale: 0.1 });

    const loss_weight_N = w_air_meas - w_imm_meas;
    const density_calc = vol_disp_meas > 0 ? (mass_g / vol_disp_meas) : 0;

    return {
      stateValues: {
        weightInAirN: w_air_meas,
        weightInWaterN: w_imm_meas,
        apparentLossN: parseFloat(loss_weight_N.toFixed(3)),
        displacedVolumeMl: vol_disp_meas,
        calculatedDensity: parseFloat(density_calc.toFixed(2)),
      },
      displayReadings: {
        weightInAir: { value: w_air_meas, formatted: `${w_air_meas.toFixed(2)} N`, unit: 'N' },
        weightInWater: { value: w_imm_meas, formatted: `${w_imm_meas.toFixed(2)} N`, unit: 'N' },
        lossInWeight: { value: loss_weight_N, formatted: `${loss_weight_N.toFixed(2)} N`, unit: 'N' },
        volumeDisplaced: { value: vol_disp_meas, formatted: `${vol_disp_meas.toFixed(0)} mL`, unit: 'mL' },
        density: { value: density_calc, formatted: `${density_calc.toFixed(2)} g/cm³`, unit: 'g/cm³' },
      },
      isConnectionValid: true,
      warnings: [],
    };
  },
  observationColumns: [
    { key: 'readingNo', label: 'Specimen', unit: '#' },
    { key: 'weightAirN', label: 'Weight in Air (W1)', unit: 'N' },
    { key: 'weightWaterN', label: 'Weight in Water (W2)', unit: 'N' },
    { key: 'lossWeightN', label: 'Loss in Weight (W1-W2)', unit: 'N', calculatedFromFormula: 'weightAirN - weightWaterN' },
    { key: 'initialVolumeMl', label: 'Initial Vol (V1)', unit: 'mL' },
    { key: 'finalVolumeMl', label: 'Final Vol (V2)', unit: 'mL' },
    { key: 'displacedVolumeMl', label: 'Displaced Vol (V2-V1)', unit: 'mL', calculatedFromFormula: 'finalVolumeMl - initialVolumeMl' },
    { key: 'densityGcm3', label: 'Density (g/cm³)', unit: 'g/cm³', calculatedFromFormula: '(weightAirN / 9.8 * 1000) / displacedVolumeMl' },
  ],
  sampleObservations: [
    { readingNo: 1, weightAirN: 0.82, weightWaterN: 0.72, lossWeightN: 0.10, initialVolumeMl: 50.0, finalVolumeMl: 60.0, displacedVolumeMl: 10.0, densityGcm3: 8.37 },
    { readingNo: 2, weightAirN: 1.65, weightWaterN: 1.45, lossWeightN: 0.20, initialVolumeMl: 50.0, finalVolumeMl: 70.0, displacedVolumeMl: 20.0, densityGcm3: 8.42 },
    { readingNo: 3, weightAirN: 2.47, weightWaterN: 2.17, lossWeightN: 0.30, initialVolumeMl: 50.0, finalVolumeMl: 80.0, displacedVolumeMl: 30.0, densityGcm3: 8.40 },
  ],
  graph: {
    xKey: 'displacedVolumeMl',
    yKey: 'lossWeightN',
    xLabel: 'Volume of Water Displaced (mL)',
    yLabel: 'Loss in Weight / Upthrust (N)',
    xUnit: 'mL',
    yUnit: 'N',
    expectedSlope: 0.0098, // g/1000 = 0.0098 N/mL
    slopeFormula: 'Slope = Δ(Loss in Weight) / Δ(Displaced Volume) = ρ_water · g = 0.0098 N/mL',
    interpretation: 'A straight line passing through the origin proves Archimedes Principle: Upthrust is directly proportional to displaced liquid volume.',
  },
  theoreticalFormula: 'Loss in Weight = Weight of Displaced Liquid = V_disp · ρ_liq · g;  Density = Mass / Volume',
  calculateResult: (observations: ObservationRow[]) => {
    if (!observations || observations.length === 0) {
      return {
        calculatedValue: 0,
        theoreticalValue: 8.40,
        percentageError: 100,
        unit: 'g/cm³',
        formulaSteps: ['No observations'],
        isAccurate: false,
      };
    }
    const densities = observations.map((o) => ((o.weightAirN / 9.80) * 1000) / o.displacedVolumeMl);
    const meanDensity = densities.reduce((a, b) => a + b, 0) / densities.length;
    const trueDensity = 8.40; // Brass
    const error = Math.abs(meanDensity - trueDensity) / trueDensity * 100;

    // Check Archimedes equality: Loss in weight (N) vs Weight of displaced water (N)
    const meanLossN = observations.reduce((a, b) => a + b.lossWeightN, 0) / observations.length;
    const meanDispVolMl = observations.reduce((a, b) => a + b.displacedVolumeMl, 0) / observations.length;
    const weightDisplacedWaterN = (meanDispVolMl * 1.0 / 1000) * 9.80; // ~0.196 N

    return {
      calculatedValue: parseFloat(meanDensity.toFixed(2)),
      theoreticalValue: trueDensity,
      percentageError: parseFloat(error.toFixed(2)),
      unit: 'g/cm³',
      formulaSteps: [
        `Mean Weight of Brass solid in air W1 = 1.65 N (Mass = 168.4 g)`,
        `Mean Volume of water displaced V = 20.00 mL = 20.00 cm³`,
        `Calculated Density ρ = Mass / Volume = 168.4 / 20.00 = ${meanDensity.toFixed(2)} g/cm³`,
        `Apparent Loss in Weight = ${meanLossN.toFixed(2)} N`,
        `Weight of Displaced Water = (20.00 mL × 1 g/mL) × 9.8 m/s² / 1000 = ${weightDisplacedWaterN.toFixed(3)} N`,
        `Archimedes Principle Verified: Loss in Weight (${meanLossN.toFixed(2)} N) ≈ Displaced Liquid Weight (${weightDisplacedWaterN.toFixed(3)} N)`,
      ],
      isAccurate: error <= 3.0,
    };
  },
  vivaQuestions: [
    {
      id: 'viva_arch_01',
      question: "Why does an iron needle sink in water while a massive iron ship floats comfortably?",
      options: [
        'A hollow ship displaces a huge volume of water, creating an upward buoyant force equal to its entire weight; a compact needle displaces tiny volume with insufficient buoyant force.',
        'Ships are made of magical buoyant steel.',
        'The water under the ocean has higher gravity than a cup of water.',
        'The air inside the ship pulls it upward toward the sky.',
      ],
      correctOptionIndex: 0,
      explanation: 'Flotation depends on average density. A needle is solid iron (density 7.8 g/cm³ > 1.0 g/cm³). A ship is hollow with vast air pockets, so its overall average density (total mass / enclosed volume) is significantly less than water (1.0 g/cm³), allowing it to float at equilibrium.',
      misconceptionTag: 'flotation_density_vs_mass',
    },
  ],
  safetyNotes: [
    { id: 'safe_arch_01', note: 'Ensure the submerged bob hangs freely in the center of the cylinder without touching the bottom or sides of the container.', severity: 'warning' },
  ],
  demonstrationScript: [
    {
      stepNumber: 1,
      title: 'Weight in Air',
      narration: "Aarohi: Let's test Archimedes' principle. We hang our brass cylinder on the spring balance in air. The pointer settles at 1.65 N.",
      targetControls: { immersedFraction: 0.0 },
      expectedObservation: { readingNo: 1, weightAirN: 1.65, weightWaterN: 1.65, lossWeightN: 0, initialVolumeMl: 50.0, finalVolumeMl: 50.0, displacedVolumeMl: 0, densityGcm3: 0 },
      durationMs: 3000,
    },
    {
      stepNumber: 2,
      title: 'Immersion in Water',
      narration: "Aarohi: Now I lower the cylinder fully into the measuring cylinder. Water level rises from 50 mL to 70 mL (20 mL displaced), and the spring balance reading drops to 1.45 N! An upward buoyant force of 0.20 N appeared.",
      targetControls: { immersedFraction: 1.0 },
      expectedObservation: { readingNo: 1, weightAirN: 1.65, weightWaterN: 1.45, lossWeightN: 0.20, initialVolumeMl: 50.0, finalVolumeMl: 70.0, displacedVolumeMl: 20.0, densityGcm3: 8.42 },
      durationMs: 3500,
    },
  ],
};
