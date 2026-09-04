import { z } from 'zod';

export const identifierSchema = z.string().min(1).max(128);
export const utcTimestampSchema = z.iso.datetime({ offset: true });

export const learnerLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const teachingLanguageSchema = z.enum(['english', 'hindi', 'hinglish']);
export const lessonDurationSchema = z.union([z.literal(5), z.literal(20), z.literal(60)]);
export const teachingStyleSchema = z.enum(['simple_examples', 'visual', 'exam_focused', 'practical']);

export const learnerProfileSchema = z.object({
  id: identifierSchema,
  displayName: z.string().trim().min(1).max(80),
  level: learnerLevelSchema,
  preferredLanguage: teachingLanguageSchema,
  strongConcepts: z.array(z.string()).default([]),
  weakConcepts: z.array(z.string()).default([]),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
});

export const learningSourceSchema = z.object({
  id: identifierSchema,
  learnerId: identifierSchema,
  kind: z.enum(['pdf', 'docx', 'pptx', 'text']),
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(128),
  byteSize: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
  status: z.enum(['uploaded', 'processing', 'ready', 'failed']),
  pageCount: z.number().int().nonnegative().nullable().default(null),
  chunkCount: z.number().int().nonnegative().nullable().default(null),
  createdAt: utcTimestampSchema,
});

export const sourceIngestionResponseSchema = z.object({
  source: learningSourceSchema,
  message: z.string().min(1),
});

export const retrievalRequestSchema = z.object({
  sourceId: identifierSchema,
  query: z.string().trim().min(2).max(1000),
  limit: z.number().int().min(1).max(10).default(5),
});

export const retrievalCitationSchema = z.object({
  sourceId: identifierSchema,
  chunkId: identifierSchema,
  pageStart: z.number().int().positive(),
  pageEnd: z.number().int().positive(),
  excerpt: z.string().min(1).max(700),
  score: z.number().nonnegative(),
});

export const retrievalResponseSchema = z.object({
  query: z.string(),
  grounded: z.boolean(),
  citations: z.array(retrievalCitationSchema),
});

export const lessonRequestSchema = z
  .object({
    learnerId: identifierSchema,
    topic: z.string().trim().min(2).max(500).optional(),
    sourceId: identifierSchema.optional(),
    level: learnerLevelSchema,
    language: teachingLanguageSchema,
    durationMinutes: lessonDurationSchema,
    style: teachingStyleSchema,
    goal: z.string().trim().min(2).max(1000),
  })
  .refine((value) => Boolean(value.topic || value.sourceId), {
    message: 'A topic or uploaded source is required.',
    path: ['topic'],
  });

export const citationSchema = z.object({
  sourceId: identifierSchema,
  chunkId: identifierSchema,
  page: z.number().int().positive().optional(),
  excerpt: z.string().max(500),
});

export const checkpointSchema = z.object({
  id: identifierSchema,
  prompt: z.string().min(1),
  type: z.enum(['mcq', 'short_answer', 'explain_in_own_words', 'application']),
  choices: z.array(z.string()).min(2).max(6).optional(),
  targetConcept: z.string().min(1),
});

export const lessonSegmentSchema = z.object({
  id: identifierSchema,
  title: z.string().min(1),
  objective: z.string().min(1),
  estimatedMinutes: z.number().positive(),
  narration: z.string().min(1),
  visualType: z.enum(['diagram', 'equation', 'graph', 'timeline', 'map', 'code', 'illustration', 'key_points']),
  visualBrief: z.string().min(1),
  citations: z.array(citationSchema),
  checkpoint: checkpointSchema.optional(),
});

export const lessonPlanSchema = z.object({
  id: identifierSchema,
  learnerId: identifierSchema,
  title: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  language: teachingLanguageSchema,
  durationMinutes: lessonDurationSchema,
  segments: z.array(lessonSegmentSchema).min(1),
  createdAt: utcTimestampSchema,
});

export const lessonPlanGenerationResponseSchema = z.object({
  plan: lessonPlanSchema,
  grounded: z.boolean(),
  provider: z.enum(['deterministic', 'openai']),
});

export const lessonPlanJsonSchema = z.toJSONSchema(lessonPlanSchema);

export const responseEvaluationSchema = z.object({
  checkpointId: identifierSchema,
  isCorrect: z.boolean(),
  confidence: z.number().min(0).max(1),
  understoodConcepts: z.array(z.string()),
  misconception: z.string().nullable(),
  feedback: z.string().min(1),
  nextAction: z.enum(['continue', 'simplify', 'new_analogy', 'new_example', 'change_visual', 'change_difficulty']),
});

export const learningReportSchema = z.object({
  lessonId: identifierSchema,
  learnerId: identifierSchema,
  scorePercent: z.number().min(0).max(100),
  strongConcepts: z.array(z.string()),
  weakConcepts: z.array(z.string()),
  misconceptions: z.array(z.string()),
  revisionAdvice: z.array(z.string()),
  recommendedNextTopic: z.string().min(1),
  completedAt: utcTimestampSchema,
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});

export type LearnerProfile = z.infer<typeof learnerProfileSchema>;
export type LearningSource = z.infer<typeof learningSourceSchema>;
export type SourceIngestionResponse = z.infer<typeof sourceIngestionResponseSchema>;
export type RetrievalRequest = z.infer<typeof retrievalRequestSchema>;
export type RetrievalResponse = z.infer<typeof retrievalResponseSchema>;
export type LessonRequest = z.infer<typeof lessonRequestSchema>;
export type LessonPlan = z.infer<typeof lessonPlanSchema>;
export type LessonPlanGenerationResponse = z.infer<typeof lessonPlanGenerationResponseSchema>;
export type ResponseEvaluation = z.infer<typeof responseEvaluationSchema>;
export type LearningReport = z.infer<typeof learningReportSchema>;
