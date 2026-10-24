import type { PracticeQuestion } from '@edukriti/contracts';
import type { DatasetManifest, OpenDatasetId } from './dataset-types.ts';
import { GSM8K_QUESTIONS } from './gsm8k.ts';
import { ARC_QUESTIONS } from './arc.ts';
import { OPENBOOKQA_QUESTIONS } from './openbookqa.ts';
import { MATH_DATASET_QUESTIONS } from './math-dataset.ts';

export const OPEN_DATASET_MANIFESTS: Record<OpenDatasetId, DatasetManifest> = {
  gsm8k: {
    id: 'gsm8k',
    name: 'GSM8K (Grade School Math 8K)',
    description: 'High-quality multi-step grade school mathematics word problems created by human problem writers.',
    license: 'MIT',
    licenseUrl: 'https://github.com/openai/grade-school-math/blob/master/LICENSE',
    sourceUrl: 'https://github.com/openai/grade-school-math',
    citation: 'Cobbe et al., "Training Verifiers to Solve Math Word Problems", OpenAI / arXiv:2110.14168 (2021).',
    subjects: ['mathematics'],
    grades: ['Grade 7', 'Grade 8'],
  },
  math_hendrycks: {
    id: 'math_hendrycks',
    name: 'MATH (Hendrycks Competition Math)',
    description: 'Challenging high school and competition mathematics problems across algebra, geometry, and calculus with rigorous LaTeX step-by-step solutions.',
    license: 'MIT',
    licenseUrl: 'https://github.com/hendrycks/math/blob/main/LICENSE',
    sourceUrl: 'https://github.com/hendrycks/math',
    citation: 'Hendrycks et al., "Measuring Mathematical Problem Solving With the MATH Dataset", NeurIPS 2021.',
    subjects: ['mathematics'],
    grades: ['Grade 9', 'Grade 10'],
  },
  arc: {
    id: 'arc',
    name: 'ARC (AI2 Reasoning Challenge)',
    description: 'Standardized multiple-choice science questions spanning physics, chemistry, and biology designed to test scientific reasoning.',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://allenai.org/data/arc',
    citation: 'Clark et al., "Think you have Solved Question Answering? Try ARC, the AI2 Reasoning Challenge", Allen Institute for AI / arXiv:1803.05457 (2018).',
    subjects: ['physics', 'chemistry', 'biology'],
    grades: ['Grade 7', 'Grade 8', 'Grade 9'],
  },
  openbookqa: {
    id: 'openbookqa',
    name: 'OpenBookQA',
    description: 'Elementary to middle school science questions assessing core scientific facts with distractor explanations and multi-hop reasoning.',
    license: 'Apache-2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    sourceUrl: 'https://allenai.org/data/open-book-qa',
    citation: 'Mihaylov et al., "Can a Suit of Armor Conduct Electricity? A New Dataset for Open Book Question Answering", EMNLP 2018.',
    subjects: ['physics', 'chemistry', 'biology'],
    grades: ['Grade 8', 'Grade 9'],
  },
};

/**
 * Curated array of all imported, openly licensed questions.
 */
export const IMPORTED_OPEN_QUESTIONS: PracticeQuestion[] = [
  ...GSM8K_QUESTIONS,
  ...MATH_DATASET_QUESTIONS,
  ...ARC_QUESTIONS,
  ...OPENBOOKQA_QUESTIONS,
];

export function getImportedQuestions(): PracticeQuestion[] {
  return [...IMPORTED_OPEN_QUESTIONS];
}

export function getImportedQuestionsByConcept(conceptId: string): PracticeQuestion[] {
  const norm = conceptId.toLowerCase();
  return IMPORTED_OPEN_QUESTIONS.filter((q) =>
    q.conceptIds.some((c) => c.toLowerCase().includes(norm) || norm.includes(c.toLowerCase())),
  );
}

export interface ImportedDatasetMetrics {
  totalImportedQuestions: number;
  byDataset: Record<string, number>;
  bySubject: Record<string, number>;
  byLicense: Record<string, number>;
  verifiedCount: number;
}

/**
 * Computes honest numbers derived directly from imported open datasets (Rule 4).
 */
export function getImportedDatasetMetrics(): ImportedDatasetMetrics {
  const byDataset: Record<string, number> = {};
  const bySubject: Record<string, number> = {};
  const byLicense: Record<string, number> = {};
  let verifiedCount = 0;

  for (const q of IMPORTED_OPEN_QUESTIONS) {
    const ds = q.datasetId ?? 'unknown';
    byDataset[ds] = (byDataset[ds] ?? 0) + 1;
    bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1;
    byLicense[q.license] = (byLicense[q.license] ?? 0) + 1;
    if (q.verified) {
      verifiedCount++;
    }
  }

  return {
    totalImportedQuestions: IMPORTED_OPEN_QUESTIONS.length,
    byDataset,
    bySubject,
    byLicense,
    verifiedCount,
  };
}

