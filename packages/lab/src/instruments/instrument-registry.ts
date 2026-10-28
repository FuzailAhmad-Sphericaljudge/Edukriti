import type { InstrumentSpec, InstrumentType } from '../types.ts';

export const STANDARD_INSTRUMENTS: Record<InstrumentType, InstrumentSpec> = {
  voltmeter: {
    id: 'inst_voltmeter_01',
    name: 'Analog DC Voltmeter',
    type: 'voltmeter',
    leastCount: 0.05,
    unit: 'V',
    minRange: 0,
    maxRange: 5.0,
    zeroError: 0,
    pins: [
      { id: 'pos', label: '+ (Red)', type: 'positive' },
      { id: 'neg', label: '- (Black)', type: 'negative' },
    ],
  },
  ammeter: {
    id: 'inst_ammeter_01',
    name: 'Analog DC Ammeter',
    type: 'ammeter',
    leastCount: 0.02,
    unit: 'A',
    minRange: 0,
    maxRange: 1.5,
    zeroError: 0,
    pins: [
      { id: 'pos', label: '+ (Red)', type: 'positive' },
      { id: 'neg', label: '- (Black)', type: 'negative' },
    ],
  },
  multimeter: {
    id: 'inst_multimeter_01',
    name: 'Digital Multimeter',
    type: 'multimeter',
    leastCount: 0.01,
    unit: 'V',
    minRange: 0,
    maxRange: 600,
    zeroError: 0,
    pins: [
      { id: 'v_ohm', label: 'V/Ω (Red)', type: 'positive' },
      { id: 'com', label: 'COM (Black)', type: 'negative' },
    ],
  },
  rheostat: {
    id: 'inst_rheostat_01',
    name: 'Wire-Wound Variable Rheostat',
    type: 'rheostat',
    leastCount: 0.5,
    unit: 'Ω',
    minRange: 0,
    maxRange: 100,
    zeroError: 0,
    pins: [
      { id: 'fixed_a', label: 'Fixed Terminal A', type: 'in' },
      { id: 'fixed_b', label: 'Fixed Terminal B', type: 'out' },
      { id: 'slider_c', label: 'Slider Terminal C', type: 'tap' },
    ],
  },
  battery_key: {
    id: 'inst_battery_key_01',
    name: 'DC Battery & Plug Key',
    type: 'battery_key',
    leastCount: 0.1,
    unit: 'V',
    minRange: 0,
    maxRange: 12,
    zeroError: 0,
    pins: [
      { id: 'bat_pos', label: 'Battery +', type: 'positive' },
      { id: 'key_term', label: 'Key Out', type: 'out' },
    ],
  },
  resistor: {
    id: 'inst_resistor_01',
    name: 'Standard Carbon Resistor',
    type: 'resistor',
    leastCount: 0.1,
    unit: 'Ω',
    minRange: 1,
    maxRange: 1000,
    zeroError: 0,
    pins: [
      { id: 't1', label: 'Terminal 1', type: 'in' },
      { id: 't2', label: 'Terminal 2', type: 'out' },
    ],
  },
  stopwatch: {
    id: 'inst_stopwatch_01',
    name: 'Precision Digital Stopwatch',
    type: 'stopwatch',
    leastCount: 0.01,
    unit: 's',
    minRange: 0,
    maxRange: 3600,
    zeroError: 0,
    pins: [],
  },
  metre_scale: {
    id: 'inst_metre_scale_01',
    name: 'Wooden Metre Scale',
    type: 'metre_scale',
    leastCount: 0.1, // 1 mm = 0.1 cm
    unit: 'cm',
    minRange: 0,
    maxRange: 100,
    zeroError: 0,
    pins: [],
  },
  vernier_caliper: {
    id: 'inst_vernier_01',
    name: 'Standard Vernier Caliper',
    type: 'vernier_caliper',
    leastCount: 0.01, // 0.1 mm = 0.01 cm
    unit: 'cm',
    minRange: 0,
    maxRange: 15,
    zeroError: 0.02,
    pins: [],
  },
  screw_gauge: {
    id: 'inst_screw_gauge_01',
    name: 'Micrometer Screw Gauge',
    type: 'screw_gauge',
    leastCount: 0.001, // 0.01 mm = 0.001 cm
    unit: 'cm',
    minRange: 0,
    maxRange: 2.5,
    zeroError: -0.003,
    pins: [],
  },
  spring_balance: {
    id: 'inst_spring_balance_01',
    name: 'Tubular Spring Balance',
    type: 'spring_balance',
    leastCount: 0.05,
    unit: 'N',
    minRange: 0,
    maxRange: 5.0,
    zeroError: 0,
    pins: [],
  },
  measuring_cylinder: {
    id: 'inst_cylinder_01',
    name: 'Graduated Measuring Cylinder',
    type: 'measuring_cylinder',
    leastCount: 1.0,
    unit: 'mL',
    minRange: 0,
    maxRange: 100,
    zeroError: 0,
    pins: [],
  },
  burette: {
    id: 'inst_burette_01',
    name: 'Teflon Stopcock Burette',
    type: 'burette',
    leastCount: 0.1,
    unit: 'mL',
    minRange: 0,
    maxRange: 50,
    zeroError: 0,
    pins: [],
  },
  pipette: {
    id: 'inst_pipette_01',
    name: 'Volumetric Transfer Pipette',
    type: 'pipette',
    leastCount: 0.05,
    unit: 'mL',
    minRange: 0,
    maxRange: 25,
    zeroError: 0,
    pins: [],
  },
  ph_meter: {
    id: 'inst_ph_meter_01',
    name: 'Digital Benchtop pH Meter',
    type: 'ph_meter',
    leastCount: 0.01,
    unit: 'pH',
    minRange: 0,
    maxRange: 14,
    zeroError: 0,
    pins: [],
  },
  thermometer: {
    id: 'inst_thermometer_01',
    name: 'Laboratory Mercury Thermometer',
    type: 'thermometer',
    leastCount: 0.5,
    unit: '°C',
    minRange: -10,
    maxRange: 110,
    zeroError: 0,
    pins: [],
  },
  beam_balance: {
    id: 'inst_balance_01',
    name: 'Physical Chemical Balance',
    type: 'beam_balance',
    leastCount: 0.01,
    unit: 'g',
    minRange: 0,
    maxRange: 250,
    zeroError: 0,
    pins: [],
  },
  convex_lens: {
    id: 'inst_lens_01',
    name: 'Double Convex Optical Lens (f ≈ 15 cm)',
    type: 'convex_lens',
    leastCount: 0.1,
    unit: 'cm',
    minRange: 0,
    maxRange: 100,
    zeroError: 0,
    pins: [],
  },
  pendulum_bob: {
    id: 'inst_pendulum_01',
    name: 'Metallic Pendulum Bob with Hook',
    type: 'pendulum_bob',
    leastCount: 0.1,
    unit: 'cm',
    minRange: 0,
    maxRange: 150,
    zeroError: 0,
    pins: [],
  },
  glass_slab: {
    id: 'inst_glass_slab_01',
    name: 'Rectangular Glass Refraction Slab',
    type: 'glass_slab',
    leastCount: 0.1,
    unit: 'cm',
    minRange: 0,
    maxRange: 20,
    zeroError: 0,
    pins: [],
  },
  calorimeter: {
    id: 'inst_calorimeter_01',
    name: 'Joule Copper Calorimeter with Stirrer',
    type: 'calorimeter',
    leastCount: 0.1,
    unit: 'g',
    minRange: 0,
    maxRange: 300,
    zeroError: 0,
    pins: [],
  },
};

/**
 * Quantizes an ideal continuous numerical value to the instrument's real least count.
 * Optionally applies simulated human reading noise (small Gaussian-like jitter).
 */
export function quantizeToLeastCount(
  value: number,
  leastCount: number,
  options?: { addNoise?: boolean; noiseScale?: number }
): number {
  let val = value;
  if (options?.addNoise) {
    const scale = options.noiseScale ?? 0.3;
    // Bounded pseudo-noise in range [-scale * leastCount, +scale * leastCount]
    const jitter = (Math.random() * 2 - 1) * scale * leastCount;
    val += jitter;
  }
  const steps = Math.round(val / leastCount);
  const quantized = steps * leastCount;
  // Format to avoid floating point precision artifacts (e.g. 0.30000000000000004)
  const decimalPlaces = Math.max(0, -Math.floor(Math.log10(leastCount)));
  return parseFloat(quantized.toFixed(decimalPlaces));
}

/**
 * Format a reading with its proper precision matching the least count.
 */
export function formatReading(value: number, leastCount: number, unit: string): string {
  const decimalPlaces = Math.max(0, -Math.floor(Math.log10(leastCount)));
  return `${value.toFixed(decimalPlaces)} ${unit}`;
}
