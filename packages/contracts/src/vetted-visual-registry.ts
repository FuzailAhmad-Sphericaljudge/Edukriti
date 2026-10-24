import { z } from 'zod';
import {
  visualManifestKindSchema,
  type VisualManifestKind,
} from './index.ts';

export type VettedVisualManifestEntry = {
  id: string;
  kind: VisualManifestKind;
  title: string;
  subject: 'physics' | 'chemistry' | 'mathematics' | 'biology' | 'computer_science' | 'history_polity' | 'general';
  description: string;
  paramKeys: string[];
  defaultParams: Record<string, unknown>;
  validateParams: (params: Record<string, unknown>) => { success: boolean; data?: Record<string, unknown>; error?: string };
};

const createEntry = <T extends z.ZodRawShape>(
  id: string,
  kind: VisualManifestKind,
  title: string,
  subject: VettedVisualManifestEntry['subject'],
  description: string,
  schema: z.ZodObject<T>,
  defaultParams: z.infer<z.ZodObject<T>>,
): VettedVisualManifestEntry => ({
  id,
  kind,
  title,
  subject,
  description,
  paramKeys: Object.keys(schema.shape),
  defaultParams,
  validateParams: (params: Record<string, unknown>) => {
    const parsed = schema.safeParse(params);
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }
    return { success: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ') };
  },
});

export const VETTED_VISUAL_REGISTRY: VettedVisualManifestEntry[] = [
  createEntry(
    'circuit-builder-dc',
    'sim',
    'DC Circuit & Ohm’s Law Simulator',
    'physics',
    'Interactive DC circuit breadboard with configurable battery voltage, resistors, switch state, and live ammeter/voltmeter readings.',
    z.object({
      voltage: z.number().min(0).max(100).default(12),
      resistance: z.number().min(0.1).max(1000).default(4),
      circuitType: z.enum(['series', 'parallel', 'single']).default('single'),
      showElectrons: z.boolean().default(true),
    }),
    { voltage: 12, resistance: 4, circuitType: 'single', showElectrons: true },
  ),

  createEntry(
    'projectile-motion-lab',
    'lab',
    'Projectile Motion & Kinematics Lab',
    'physics',
    'Physics trajectory simulation with launch angle, initial speed, height, gravity, and path tracing.',
    z.object({
      launchAngle: z.number().min(0).max(90).default(45),
      initialSpeed: z.number().min(0).max(100).default(20),
      gravity: z.number().min(1).max(25).default(9.8),
      airResistance: z.boolean().default(false),
    }),
    { launchAngle: 45, initialSpeed: 20, gravity: 9.8, airResistance: false },
  ),

  createEntry(
    'gravity-orbital-sim',
    'sim',
    'Planetary Gravity & Kepler Orbit Simulator',
    'physics',
    'Gravitational two-body / multi-body orbital mechanics visualizing Kepler’s laws, orbital velocity, and escape velocity.',
    z.object({
      centralMass: z.number().min(1).max(1000).default(100),
      orbitalRadius: z.number().min(10).max(500).default(150),
      eccentricity: z.number().min(0).max(0.9).default(0.1),
    }),
    { centralMass: 100, orbitalRadius: 150, eccentricity: 0.1 },
  ),

  createEntry(
    'pendulum-harmonic-lab',
    'lab',
    'Simple Harmonic Motion Pendulum Lab',
    'physics',
    'Oscillation lab calculating period T = 2pi*sqrt(L/g), frequency, and kinetic/potential energy transformation.',
    z.object({
      length: z.number().min(0.1).max(5).default(1.0),
      mass: z.number().min(0.1).max(10).default(1.0),
      initialAngle: z.number().min(1).max(45).default(15),
      damping: z.number().min(0).max(1).default(0.02),
    }),
    { length: 1.0, mass: 1.0, initialAngle: 15, damping: 0.02 },
  ),

  createEntry(
    'molecule-viewer-3d',
    'scene3d',
    '3D Molecular Structure & Chemical Bonding Viewer',
    'chemistry',
    'Rotatable 3D biomolecular and crystal lattice model showing covalent/ionic bonds, bond angles, and valence shells.',
    z.object({
      moleculeId: z.enum(['H2O', 'CH4', 'NaCl', 'CO2', 'NH3', 'HCl', 'C6H12O6']).default('H2O'),
      style: z.enum(['ball_and_stick', 'space_filling', 'wireframe']).default('ball_and_stick'),
      showBondAngles: z.boolean().default(true),
    }),
    { moleculeId: 'H2O', style: 'ball_and_stick', showBondAngles: true },
  ),

  createEntry(
    'acid-base-titration-lab',
    'lab',
    'Acid-Base Titration & pH Neutralization Lab',
    'chemistry',
    'Burette titrant addition, continuous pH curve monitoring, equivalence point detection, and phenolphthalein indicator color changes.',
    z.object({
      analyteConcentration: z.number().min(0.01).max(2).default(0.1),
      titrantConcentration: z.number().min(0.01).max(2).default(0.1),
      indicator: z.enum(['phenolphthalein', 'methyl_orange', 'litmus']).default('phenolphthalein'),
    }),
    { analyteConcentration: 0.1, titrantConcentration: 0.1, indicator: 'phenolphthalein' },
  ),

  createEntry(
    'quadratic-parabola-explorer',
    'diagram',
    'Quadratic Functions & Parabola Explorer',
    'mathematics',
    'Interactive coordinate plane demonstrating roots, vertex (-b/2a), axis of symmetry, and discriminant D = b^2 - 4ac behavior.',
    z.object({
      a: z.number().default(1),
      b: z.number().default(-4),
      c: z.number().default(3),
      showRoots: z.boolean().default(true),
      showVertex: z.boolean().default(true),
    }),
    { a: 1, b: -4, c: 3, showRoots: true, showVertex: true },
  ),

  createEntry(
    'photosynthesis-chloroplast-diagram',
    'diagram',
    'Chloroplast Light Reactions & Calvin Cycle Diagram',
    'biology',
    'Interactive schematic of chloroplast anatomy, thylakoid membrane proton gradient, ATP synthase, and Calvin cycle carbon fixation.',
    z.object({
      stage: z.enum(['overview', 'light_dependent', 'calvin_cycle']).default('overview'),
      showAtpFlow: z.boolean().default(true),
    }),
    { stage: 'overview', showAtpFlow: true },
  ),

  createEntry(
    'cell-mitosis-interactive',
    'diagram',
    'Cell Cycle & Mitosis Stages Interactive',
    'biology',
    'Stepwise chromosome visualization tracking prophase, metaphase, anaphase, telophase, and cytokinesis.',
    z.object({
      phase: z.enum(['prophase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis']).default('metaphase'),
      showSpindleFibers: z.boolean().default(true),
    }),
    { phase: 'metaphase', showSpindleFibers: true },
  ),

  createEntry(
    'dna-double-helix-3d',
    'scene3d',
    '3D DNA Double Helix & Base Pairing Viewer',
    'biology',
    '3D rotatable Watson-Crick double helix highlighting Adenine-Thymine (2 H-bonds) and Guanine-Cytosine (3 H-bonds).',
    z.object({
      rotationSpeed: z.number().min(0).max(5).default(1),
      highlightBasePairs: z.boolean().default(true),
      showHydrogenBonds: z.boolean().default(true),
    }),
    { rotationSpeed: 1, highlightBasePairs: true, showHydrogenBonds: true },
  ),

  createEntry(
    'sorting-visualizer-sim',
    'sim',
    'Algorithm Sorting & Binary Search Visualizer',
    'computer_science',
    'Bar-chart comparison visualizer animating binary search, bubble sort, merge sort, and Big-O step counts.',
    z.object({
      algorithm: z.enum(['binary_search', 'merge_sort', 'quick_sort', 'bubble_sort']).default('binary_search'),
      arraySize: z.number().min(5).max(50).default(16),
      speedMs: z.number().min(50).max(1000).default(300),
    }),
    { algorithm: 'binary_search', arraySize: 16, speedMs: 300 },
  ),

  createEntry(
    'tectonic-plates-globe-3d',
    'scene3d',
    '3D Earth Tectonic Boundaries & Fault Lines',
    'general',
    'Interactive 3D globe rendering lithospheric plates, subduction zones, mid-ocean ridges, and earthquake epicenters.',
    z.object({
      boundaryType: z.enum(['all', 'convergent', 'divergent', 'transform']).default('all'),
      showVolcanoes: z.boolean().default(true),
      showEarthquakes: z.boolean().default(true),
    }),
    { boundaryType: 'all', showVolcanoes: true, showEarthquakes: true },
  ),
];

export function getVettedVisualRegistry(): VettedVisualManifestEntry[] {
  return VETTED_VISUAL_REGISTRY;
}

export function findVettedVisual(id: string): VettedVisualManifestEntry | undefined {
  return VETTED_VISUAL_REGISTRY.find((entry) => entry.id === id);
}

export function validateVisualSelection(
  id: string,
  params: Record<string, unknown> = {},
): { isValid: boolean; validatedParams?: Record<string, unknown>; error?: string } {
  const entry = findVettedVisual(id);
  if (!entry) {
    return {
      isValid: false,
      error: `Visual ID "${id}" is not registered in the vetted visual manifest registry. Available IDs: ${VETTED_VISUAL_REGISTRY.map((e) => e.id).join(', ')}`,
    };
  }

  const merged = { ...entry.defaultParams, ...params };
  const validation = entry.validateParams(merged);
  if (!validation.success) {
    return {
      isValid: false,
      error: `Invalid parameters for visual "${id}": ${validation.error}`,
    };
  }

  return {
    isValid: true,
    validatedParams: validation.data,
  };
}

export function suggestVisualForTopic(
  topic: string,
  conceptsOrPreferredId: string[] | string = [],
): VisualInteractiveManifest | undefined {
  // If caller passed a direct visual ID
  if (typeof conceptsOrPreferredId === 'string' && conceptsOrPreferredId.trim().length > 0) {
    const directMatch = findVettedVisual(conceptsOrPreferredId);
    if (directMatch) {
      return { kind: directMatch.kind, id: directMatch.id, params: directMatch.defaultParams };
    }
  }

  const conceptsList = Array.isArray(conceptsOrPreferredId)
    ? conceptsOrPreferredId
    : typeof conceptsOrPreferredId === 'string'
      ? [conceptsOrPreferredId]
      : [];

  const text = `${topic} ${conceptsList.join(' ')}`.toLowerCase();

  if (text.includes('circuit') || text.includes('ohm') || text.includes('resistor') || text.includes('voltage') || text.includes('current')) {
    const entry = findVettedVisual('circuit-builder-dc')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('projectile') || text.includes('trajectory') || text.includes('angle') || text.includes('gravity') && text.includes('launch')) {
    const entry = findVettedVisual('projectile-motion-lab')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('orbit') || text.includes('planetary') || text.includes('kepler') || text.includes('satellite')) {
    const entry = findVettedVisual('gravity-orbital-sim')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('pendulum') || text.includes('harmonic') || text.includes('oscillation')) {
    const entry = findVettedVisual('pendulum-harmonic-lab')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('acid') || text.includes('base') || text.includes('titration') || text.includes('ph') || text.includes('neutralization')) {
    const entry = findVettedVisual('acid-base-titration-lab')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('bond') || text.includes('molecule') || text.includes('covalent') || text.includes('ionic') || text.includes('lewis')) {
    const entry = findVettedVisual('molecule-viewer-3d')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('photosynthesis') || text.includes('chloroplast') || text.includes('calvin') || text.includes('light reaction')) {
    const entry = findVettedVisual('photosynthesis-chloroplast-diagram')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('mitosis') || text.includes('meiosis') || text.includes('cell division') || text.includes('chromosome')) {
    const entry = findVettedVisual('cell-mitosis-interactive')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('dna') || text.includes('double helix') || text.includes('gene') || text.includes('heredity')) {
    const entry = findVettedVisual('dna-double-helix-3d')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('binary search') || text.includes('sort') || text.includes('algorithm') || text.includes('big-o')) {
    const entry = findVettedVisual('sorting-visualizer-sim')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('parabola') || text.includes('quadratic') || text.includes('polynomial') || text.includes('discriminant')) {
    const entry = findVettedVisual('quadratic-parabola-explorer')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  if (text.includes('tectonic') || text.includes('earthquake') || text.includes('volcano') || text.includes('crust')) {
    const entry = findVettedVisual('tectonic-plates-globe-3d')!;
    return { kind: entry.kind, id: entry.id, params: entry.defaultParams };
  }

  return undefined;
}

export type VettedVisualMetrics = {
  totalInteractiveSimulations: number;
  simCount: number;
  labCount: number;
  scene3dCount: number;
  diagramCount: number;
  subjectCounts: Record<string, number>;
  availableIds: string[];
};

/**
 * Computes honest real-time metrics across all vetted STEM simulations.
 * Used to ensure honest counts throughout the UI and documentation without hardcoding.
 */
export function getVettedVisualMetrics(): VettedVisualMetrics {
  const registry = getVettedVisualRegistry();
  const simCount = registry.filter((e) => e.kind === 'sim').length;
  const labCount = registry.filter((e) => e.kind === 'lab').length;
  const scene3dCount = registry.filter((e) => e.kind === 'scene3d').length;
  const diagramCount = registry.filter((e) => e.kind === 'diagram').length;

  const subjectCounts: Record<string, number> = {};
  for (const entry of registry) {
    subjectCounts[entry.subject] = (subjectCounts[entry.subject] ?? 0) + 1;
  }

  return {
    totalInteractiveSimulations: registry.length,
    simCount,
    labCount,
    scene3dCount,
    diagramCount,
    subjectCounts,
    availableIds: registry.map((e) => e.id),
  };
}
