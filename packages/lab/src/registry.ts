import type { ExperimentDefinition } from './types.ts';
import { OHMS_LAW_EXPERIMENT } from './experiments/ohms-law.ts';
import { SERIES_PARALLEL_EXPERIMENT } from './experiments/series-parallel-resistors.ts';
import { SIMPLE_PENDULUM_EXPERIMENT } from './experiments/simple-pendulum.ts';
import { PROJECTILE_MOTION_EXPERIMENT } from './experiments/projectile-motion.ts';
import { CONVEX_LENS_UV_EXPERIMENT } from './experiments/convex-lens-uv.ts';
import { ACID_BASE_TITRATION_EXPERIMENT } from './experiments/acid-base-titration.ts';
import { DENSITY_ARCHIMEDES_EXPERIMENT } from './experiments/density-archimedes.ts';
import { VERNIER_SCREW_GAUGE_EXPERIMENT } from './experiments/vernier-screw-gauge.ts';
import { PH_COMMON_SOLUTIONS_EXPERIMENT } from './experiments/ph-common-solutions.ts';
import { REFRACTION_GLASS_SLAB_EXPERIMENT } from './experiments/refraction-glass-slab.ts';
import { SPECIFIC_HEAT_EXPERIMENT } from './experiments/specific-heat.ts';
import { STANDARD_INSTRUMENTS } from './instruments/instrument-registry.ts';

export const ALL_EXPERIMENTS: ExperimentDefinition[] = [
  OHMS_LAW_EXPERIMENT,
  SERIES_PARALLEL_EXPERIMENT,
  SIMPLE_PENDULUM_EXPERIMENT,
  PROJECTILE_MOTION_EXPERIMENT,
  CONVEX_LENS_UV_EXPERIMENT,
  ACID_BASE_TITRATION_EXPERIMENT,
  DENSITY_ARCHIMEDES_EXPERIMENT,
  VERNIER_SCREW_GAUGE_EXPERIMENT,
  PH_COMMON_SOLUTIONS_EXPERIMENT,
  REFRACTION_GLASS_SLAB_EXPERIMENT,
  SPECIFIC_HEAT_EXPERIMENT,
];

export const EXPERIMENT_REGISTRY: Record<string, ExperimentDefinition> = Object.fromEntries(
  ALL_EXPERIMENTS.map((exp) => [exp.id, exp])
);

export function getAllExperiments(): ExperimentDefinition[] {
  return [...ALL_EXPERIMENTS];
}

export function findExperimentById(id: string): ExperimentDefinition | undefined {
  return EXPERIMENT_REGISTRY[id];
}

export function getExperimentsBySubject(subject: 'physics' | 'chemistry'): ExperimentDefinition[] {
  return ALL_EXPERIMENTS.filter((exp) => exp.subject === subject);
}

export function getExperimentsForConcept(conceptId: string): ExperimentDefinition[] {
  return ALL_EXPERIMENTS.filter((exp) => exp.conceptIds.includes(conceptId));
}

export function getLabMetrics() {
  const totalExperiments = ALL_EXPERIMENTS.length;
  const physicsCount = ALL_EXPERIMENTS.filter((e) => e.subject === 'physics').length;
  const chemistryCount = ALL_EXPERIMENTS.filter((e) => e.subject === 'chemistry').length;
  const totalInstruments = Object.keys(STANDARD_INSTRUMENTS).length;

  return {
    totalExperiments,
    totalInstruments,
    physicsCount,
    chemistryCount,
    experimentIds: ALL_EXPERIMENTS.map((e) => e.id),
    subjects: {
      physics: physicsCount,
      chemistry: chemistryCount,
    },
  };
}
