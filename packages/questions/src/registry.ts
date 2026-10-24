import type { PracticeQuestion } from '@edukriti/contracts';
import { SeededRng } from './prng.ts';
import type { ParametricTemplate } from './types.ts';
import { MATH_TEMPLATES } from './templates/math-templates.ts';
import { PHYSICS_TEMPLATES } from './templates/physics-templates.ts';
import { CHEMISTRY_TEMPLATES } from './templates/chemistry-templates.ts';
import { BIO_CS_TEMPLATES } from './templates/bio-cs-templates.ts';

/**
 * Complete catalog of vetted parametric question templates.
 * 60 distinct families across Mathematics, Physics, Chemistry, Biology, and Computer Science.
 */
export const PARAMETRIC_TEMPLATES: ParametricTemplate[] = [
  ...MATH_TEMPLATES,
  ...PHYSICS_TEMPLATES,
  ...CHEMISTRY_TEMPLATES,
  ...BIO_CS_TEMPLATES,
];

const templateMap = new Map<string, ParametricTemplate>();
for (const tmpl of PARAMETRIC_TEMPLATES) {
  templateMap.set(tmpl.familyId, tmpl);
}

export function getTemplateById(familyId: string): ParametricTemplate | undefined {
  return templateMap.get(familyId);
}

export function getTemplatesBySubject(subject: string): ParametricTemplate[] {
  return PARAMETRIC_TEMPLATES.filter((t) => t.subject === subject);
}

export function getTemplatesByConcept(conceptId: string): ParametricTemplate[] {
  const normalized = conceptId.toLowerCase();
  return PARAMETRIC_TEMPLATES.filter((t) =>
    t.conceptIds.some((c) => c.toLowerCase().includes(normalized) || normalized.includes(c.toLowerCase())),
  );
}

/**
 * Generates an instance of a parametric question given a family ID and optional integer seed.
 */
export function generateParametricQuestion(
  familyId: string,
  seed: number = Math.floor(Math.random() * 1_000_000),
): PracticeQuestion {
  const template = getTemplateById(familyId);
  if (!template) {
    throw new Error(`Parametric question template "${familyId}" not found.`);
  }
  const rng = new SeededRng(seed);
  return template.generate(seed, rng);
}

export interface ParametricRegistryMetrics {
  totalTemplateFamilies: number;
  bySubject: Record<string, number>;
  totalCombinationsEstimate: number;
  familyIds: string[];
}

/**
 * Computes honest numbers derived directly from real template parameter ranges.
 */
export function getParametricMetrics(): ParametricRegistryMetrics {
  const bySubject: Record<string, number> = {};
  let totalCombinations = 0;

  for (const t of PARAMETRIC_TEMPLATES) {
    bySubject[t.subject] = (bySubject[t.subject] ?? 0) + 1;
    totalCombinations += t.estimateCombinations();
  }

  return {
    totalTemplateFamilies: PARAMETRIC_TEMPLATES.length,
    bySubject,
    totalCombinationsEstimate: totalCombinations,
    familyIds: PARAMETRIC_TEMPLATES.map((t) => t.familyId),
  };
}
