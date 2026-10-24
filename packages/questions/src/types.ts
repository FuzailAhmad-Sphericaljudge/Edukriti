import type { PracticeQuestion, QuestionDifficulty } from '@edukriti/contracts';
import type { SeededRng } from './prng.ts';

export interface ParameterRangeDef {
  name: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface ParametricTemplate {
  familyId: string;
  title: string;
  subject: 'physics' | 'chemistry' | 'mathematics' | 'biology' | 'computer_science';
  conceptIds: string[];
  grade: string;
  difficulty: QuestionDifficulty;
  parameterRanges: Record<string, ParameterRangeDef>;
  generate: (seed: number, rng?: SeededRng) => PracticeQuestion;
  estimateCombinations: () => number;
}

