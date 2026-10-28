import { z } from 'zod';

export const instrumentTypeSchema = z.enum([
  'voltmeter',
  'ammeter',
  'multimeter',
  'rheostat',
  'battery_key',
  'resistor',
  'stopwatch',
  'metre_scale',
  'vernier_caliper',
  'screw_gauge',
  'spring_balance',
  'measuring_cylinder',
  'burette',
  'pipette',
  'ph_meter',
  'thermometer',
  'beam_balance',
  'convex_lens',
  'pendulum_bob',
  'glass_slab',
  'calorimeter'
]);
export type InstrumentType = z.infer<typeof instrumentTypeSchema>;

export const connectionPinSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['positive', 'negative', 'ground', 'in', 'out', 'tap']),
});
export type ConnectionPin = z.infer<typeof connectionPinSchema>;

export const instrumentSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: instrumentTypeSchema,
  leastCount: z.number().positive(),
  unit: z.string(),
  minRange: z.number(),
  maxRange: z.number(),
  zeroError: z.number().default(0),
  pins: z.array(connectionPinSchema).default([]),
});
export type InstrumentSpec = z.infer<typeof instrumentSpecSchema>;

export const apparatusItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  spec: instrumentSpecSchema,
  quantity: z.number().int().positive().default(1),
  roleDescription: z.string(),
});
export type ApparatusItem = z.infer<typeof apparatusItemSchema>;

export const connectionSchema = z.object({
  fromInstrumentId: z.string(),
  fromPin: z.string(),
  toInstrumentId: z.string(),
  toPin: z.string(),
});
export type Connection = z.infer<typeof connectionSchema>;

export const variableSpecSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  unit: z.string(),
  role: z.enum(['independent', 'dependent', 'controlled']),
  description: z.string(),
});
export type VariableSpec = z.infer<typeof variableSpecSchema>;

export const observationColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  unit: z.string(),
  calculatedFromFormula: z.string().optional(),
});
export type ObservationColumn = z.infer<typeof observationColumnSchema>;

export type ObservationRow = Record<string, number>;

export const graphConfigSchema = z.object({
  xKey: z.string(),
  yKey: z.string(),
  xLabel: z.string(),
  yLabel: z.string(),
  xUnit: z.string(),
  yUnit: z.string(),
  expectedSlope: z.number().optional(),
  slopeFormula: z.string(),
  interpretation: z.string(),
});
export type GraphConfig = z.infer<typeof graphConfigSchema>;

export const vivaQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctOptionIndex: z.number().int().min(0),
  explanation: z.string(),
  misconceptionTag: z.string().optional(),
});
export type VivaQuestion = z.infer<typeof vivaQuestionSchema>;

export const safetyPrecautionSchema = z.object({
  id: z.string(),
  note: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
});
export type SafetyPrecaution = z.infer<typeof safetyPrecautionSchema>;

export const demonstrationCueSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string(),
  narration: z.string(),
  targetControls: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])),
  expectedObservation: z.record(z.string(), z.number()),
  durationMs: z.number().positive().default(3000),
});
export type DemonstrationCue = z.infer<typeof demonstrationCueSchema>;

export interface SimulationResult {
  stateValues: Record<string, number>;
  displayReadings: Record<string, { value: number; formatted: string; unit: string }>;
  isConnectionValid: boolean;
  connectionError?: string;
  warnings: string[];
}

export interface CalculationResult {
  calculatedValue: number;
  theoreticalValue: number;
  percentageError: number;
  unit: string;
  formulaSteps: string[];
  isAccurate: boolean;
}

export interface ReadingPracticeExercise {
  id: string;
  instrumentId: string;
  instrumentType: InstrumentType;
  prompt: string;
  trueMainScaleReading: number;
  trueVernierOrCircularReading: number;
  trueLeastCount: number;
  zeroError: number;
  trueTotalReading: number;
  unit: string;
}

export interface ExperimentDefinition {
  id: string;
  title: string;
  subject: 'physics' | 'chemistry';
  grade: string;
  conceptIds: string[];
  aim: string;
  apparatus: ApparatusItem[];
  requiredConnections?: Connection[];
  variables: VariableSpec[];
  defaultParams: Record<string, number | boolean | string>;
  paramSchemas?: Record<string, z.ZodTypeAny>;
  simulate: (params: Record<string, number | boolean | string>, connections?: Connection[]) => SimulationResult;
  observationColumns: ObservationColumn[];
  sampleObservations: ObservationRow[];
  graph: GraphConfig;
  theoreticalFormula: string;
  calculateResult: (observations: ObservationRow[]) => CalculationResult;
  vivaQuestions: VivaQuestion[];
  safetyNotes: SafetyPrecaution[];
  demonstrationScript: DemonstrationCue[];
  readingPracticeExercises?: ReadingPracticeExercise[];
}

export const labReportSubmissionSchema = z.object({
  experimentId: z.string(),
  studentName: z.string().default('Student'),
  observations: z.array(z.record(z.string(), z.number())).min(2),
  calculatedValue: z.number(),
  vivaAnswers: z.record(z.string(), z.number()), // questionId -> chosenOptionIndex
});
export type LabReportSubmission = z.infer<typeof labReportSubmissionSchema>;

export const labReportGradeSchema = z.object({
  experimentId: z.string(),
  overallScore: z.number().min(0).max(100),
  letterGrade: z.enum(['A+', 'A', 'B', 'C', 'D']),
  readingAccuracyScore: z.number().min(0).max(100),
  graphQualityScore: z.number().min(0).max(100),
  calculationScore: z.number().min(0).max(100),
  vivaScore: z.number().min(0).max(100),
  percentageError: z.number(),
  theoreticalValue: z.number(),
  experimentalValue: z.number(),
  strengths: z.array(z.string()),
  diagnosedMisconceptions: z.array(z.string()),
  teacherFeedback: z.string(),
  conceptRevisionLinks: z.array(z.string()),
});
export type LabReportGrade = z.infer<typeof labReportGradeSchema>;

