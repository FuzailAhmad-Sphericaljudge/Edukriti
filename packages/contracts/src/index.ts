import { z } from 'zod';

export const identifierSchema = z.string().min(1).max(128);
export const utcTimestampSchema = z.iso.datetime({ offset: true });

export const learnerLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const teachingLanguageSchema = z.enum(['english', 'hindi', 'hinglish']);
export const lessonDurationSchema = z.union([z.literal(5), z.literal(20), z.literal(60)]);
export const teachingStyleSchema = z.enum(['simple_examples', 'visual', 'exam_focused', 'practical']);
export const lessonVariantModeSchema = z.enum(['standard', 'exam_focused', 'practical']);
export type LessonVariantMode = z.infer<typeof lessonVariantModeSchema>;

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
    variantMode: lessonVariantModeSchema.optional(),
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
  title: z.string().optional(),
  source: z.string().optional(),
});

export const visualManifestKindSchema = z.enum(['diagram', 'scene3d', 'sim', 'lab']);
export type VisualManifestKind = z.infer<typeof visualManifestKindSchema>;

export const narrationCueSchema = z.object({
  atSecond: z.number().nonnegative().optional(),
  phrase: z.string().optional(),
  action: z.string().min(1),
  label: z.string().optional(),
});
export type NarrationCue = z.infer<typeof narrationCueSchema>;

export const visualInteractiveManifestSchema = z.object({
  kind: visualManifestKindSchema,
  id: z.string().min(1).max(128),
  params: z.record(z.string(), z.unknown()).default({}),
  narrationCues: z.array(narrationCueSchema).optional().default([]),
});
export type VisualInteractiveManifest = z.infer<typeof visualInteractiveManifestSchema>;

export const adaptationStrategySchema = z.enum([
  'new_analogy',
  'worked_example',
  'simpler_prerequisite',
  'visual_walkthrough',
  'interactive',
  'simplify',
  'new_example',
  'change_visual',
  'change_difficulty',
]);
export type AdaptationStrategy = z.infer<typeof adaptationStrategySchema>;

export const commonMisconceptionItemSchema = z.object({
  misconception: z.string().min(1),
  triggerPatterns: z.array(z.string()).default([]),
  explanationCorrection: z.string().min(1),
  recommendedStrategy: adaptationStrategySchema.default('new_analogy'),
});
export type CommonMisconceptionItem = z.infer<typeof commonMisconceptionItemSchema>;

export const checkpointRubricSchema = z.object({
  checkpointId: identifierSchema,
  targetConcept: z.string().min(1),
  keyIdeas: z.array(z.string().min(1)).min(1),
  commonMisconceptions: z.array(commonMisconceptionItemSchema).default([]),
  passingCriteria: z.string().min(1),
});
export type CheckpointRubric = z.infer<typeof checkpointRubricSchema>;

export const checkpointSchema = z.object({
  id: identifierSchema,
  prompt: z.string().min(1),
  type: z.enum(['mcq', 'short_answer', 'explain_in_own_words', 'application']),
  choices: z.array(z.string()).min(2).max(6).optional(),
  targetConcept: z.string().min(1),
  rubric: checkpointRubricSchema.optional(),
});

export const lessonSegmentSchema = z.object({
  id: identifierSchema,
  title: z.string().min(1),
  objective: z.string().min(1),
  estimatedMinutes: z.number().positive(),
  narration: z.string().min(1),
  visualType: z.enum(['diagram', 'equation', 'graph', 'timeline', 'map', 'code', 'illustration', 'key_points']),
  visualBrief: z.string().min(1),
  interactive: visualInteractiveManifestSchema.optional(),
  citations: z.array(citationSchema),
  checkpoint: checkpointSchema.optional(),
});

export const spacedRevisionPromptSchema = z.object({
  intervalDays: z.union([z.literal(1), z.literal(3), z.literal(7), z.literal(14)]),
  concept: z.string().min(1),
  prompt: z.string().min(1),
  format: z.enum(['flashcard', 'quick_problem', 'concept_check']).default('concept_check'),
});
export type SpacedRevisionPrompt = z.infer<typeof spacedRevisionPromptSchema>;

export const lessonPlanSchema = z.object({
  id: identifierSchema,
  learnerId: identifierSchema,
  title: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  language: teachingLanguageSchema,
  durationMinutes: lessonDurationSchema,
  variantMode: lessonVariantModeSchema.default('standard'),
  segments: z.array(lessonSegmentSchema).min(1),
  prerequisiteConcepts: z.array(z.string()).default([]),
  conceptGraphNodes: z.array(z.string()).default([]),
  spacedRevision: z.array(spacedRevisionPromptSchema).default([]),
  createdAt: utcTimestampSchema,
});

export const aiProviderTypeSchema = z.enum(['deterministic', 'openai', 'gemini']);
export type AiProviderType = z.infer<typeof aiProviderTypeSchema>;

export const lessonPlanGenerationResponseSchema = z.object({
  plan: lessonPlanSchema,
  grounded: z.boolean(),
  provider: aiProviderTypeSchema,
});

export const tutorTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(3000),
});

export const tutorIntentSchema = z.enum([
  'concept',
  'numerical_problem',
  'doubt',
  'exam_tip',
  'experiment_help',
]);

export const tutorPedagogicalStyleSchema = z.enum([
  'default',
  'eli10',
  'exam_style',
  'deep_dive',
]);

export const tutorLearnerLevelSchema = z.enum([
  'elementary',
  'high_school',
  'college',
  'competitive_exam',
]);

export const tutorNumericStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1).max(200),
  formula: z.string().max(300).optional(),
  substitution: z.string().max(300).optional(),
  result: z.string().min(1).max(200),
  unit: z.string().max(50).optional(),
  explanation: z.string().min(1).max(1000),
});

export const tutorMathVerificationSchema = z.object({
  isVerified: z.boolean(),
  computedValue: z.number().nullable(),
  expectedValue: z.number().nullable(),
  tolerance: z.number().optional(),
  notes: z.string().optional(),
});

export const tutorImageAttachmentSchema = z.object({
  dataUrl: z.string().min(1).max(8_000_000),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  caption: z.string().max(200).optional(),
});

export const tutorRequestSchema = z.object({
  lessonId: identifierSchema.optional(),
  question: z.string().trim().min(1).max(3000),
  currentSegmentId: identifierSchema.optional(),
  history: z.array(tutorTurnSchema).max(20).optional().default([]),
  intent: tutorIntentSchema.optional(),
  style: tutorPedagogicalStyleSchema.optional().default('default'),
  level: tutorLearnerLevelSchema.optional().default('high_school'),
  language: teachingLanguageSchema.optional().default('english'),
  image: tutorImageAttachmentSchema.optional(),
  clientRequestId: z.string().optional(),
});

export const tutorResponseSchema = z.object({
  answer: z.string().min(1).max(8000),
  followUpQuestion: z.string().min(1).max(500),
  grounded: z.boolean(),
  provider: aiProviderTypeSchema,
  citations: z.array(citationSchema).max(10),
  intent: tutorIntentSchema.default('concept'),
  style: tutorPedagogicalStyleSchema.default('default'),
  isMathOrNumerical: z.boolean().default(false),
  steps: z.array(tutorNumericStepSchema).default([]),
  mathVerification: tutorMathVerificationSchema.optional(),
  suggestedQuestions: z.array(z.string().min(1).max(300)).default([]),
  knowledgeBaseGrounded: z.boolean().default(false),
  sourceAttributionNotice: z.string().optional(),
  summary: z.string().max(2000).optional(),
  extractedImageText: z.string().max(4000).optional(),
  safetyPassed: z.boolean().default(true),
});

export const tutorStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('status'), phase: z.string(), message: z.string() }),
  z.object({ type: z.literal('intent'), intent: tutorIntentSchema }),
  z.object({ type: z.literal('delta'), text: z.string() }),
  z.object({ type: z.literal('citations'), citations: z.array(citationSchema) }),
  z.object({ type: z.literal('steps'), steps: z.array(tutorNumericStepSchema) }),
  z.object({ type: z.literal('verification'), verification: tutorMathVerificationSchema }),
  z.object({ type: z.literal('suggestions'), suggestions: z.array(z.string()) }),
  z.object({ type: z.literal('ocr'), extractedText: z.string() }),
  z.object({ type: z.literal('complete'), response: tutorResponseSchema }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string() }),
]);

export const tutorNoteSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  intent: tutorIntentSchema.default('concept'),
  subject: z.string().optional(),
  tags: z.array(z.string()).default([]),
  savedAt: utcTimestampSchema,
});

export const tutorFeedbackSchema = z.object({
  id: z.string().min(1),
  rating: z.enum(['positive', 'negative']),
  comment: z.string().max(500).optional(),
  questionSnippet: z.string().min(1).max(300),
  timestamp: utcTimestampSchema,
});

export const tutorExportPayloadSchema = z.object({
  format: z.enum(['markdown', 'json']),
  notes: z.array(tutorNoteSchema).min(1),
  exportedAt: utcTimestampSchema,
});

export const lessonPlanJsonSchema = z.toJSONSchema(lessonPlanSchema);

export const responseEvaluationSchema = z.object({
  checkpointId: identifierSchema,
  isCorrect: z.boolean(),
  confidence: z.number().min(0).max(1),
  understoodConcepts: z.array(z.string()),
  misconception: z.string().nullable(),
  feedback: z.string().min(1),
  nextAction: z.enum([
    'continue',
    'new_analogy',
    'worked_example',
    'simpler_prerequisite',
    'visual_walkthrough',
    'interactive',
    'simplify',
    'change_visual',
    'change_difficulty',
  ]),
  rubricScore: z.number().min(0).max(100).optional(),
  missingKeyIdeas: z.array(z.string()).default([]),
  detectedMisconceptions: z.array(z.string()).default([]),
});

export const checkpointAttemptRequestSchema = z.object({
  lessonId: identifierSchema,
  checkpointId: identifierSchema,
  response: z.string().trim().min(2).max(2000),
  clientRequestId: z.uuid(),
  remediationAttempt: z.number().int().positive().optional().default(1),
});

export const lessonAdaptationSchema = z.object({
  strategy: adaptationStrategySchema,
  title: z.string().min(1),
  explanation: z.string().min(1),
  visualType: lessonSegmentSchema.shape.visualType,
  visualBrief: z.string().min(1),
  interactive: visualInteractiveManifestSchema.optional(),
  wasEffective: z.boolean().optional(),
  remediationAttempt: z.number().int().positive().default(1),
  remediationAction: z.string().optional(),
});

export const checkpointAttemptResponseSchema = z.object({
  attemptId: z.uuid(),
  evaluation: responseEvaluationSchema,
  adaptation: lessonAdaptationSchema.nullable(),
  attemptedAt: utcTimestampSchema,
});

export const assessmentChoiceSchema = z.object({
  id: z.string().min(1).max(12),
  text: z.string().min(1).max(500),
});

export const assessmentQuestionSchema = z.object({
  id: identifierSchema,
  prompt: z.string().min(1).max(1000),
  type: z.enum(['mcq', 'short_answer']),
  choices: z.array(assessmentChoiceSchema).min(2).max(6).optional(),
});

export const assessmentSchema = z.object({
  lessonId: identifierSchema,
  questions: z.array(assessmentQuestionSchema).min(3).max(5),
});

export const assessmentAttemptRequestSchema = z.object({
  lessonId: identifierSchema,
  questionId: identifierSchema,
  response: z.string().trim().min(1).max(2000),
  clientRequestId: z.uuid(),
});

export const assessmentAttemptResponseSchema = z.object({
  attemptId: z.uuid(),
  questionId: identifierSchema,
  isCorrect: z.boolean(),
  feedback: z.string().min(1),
  understoodConcepts: z.array(z.string()),
  weakConcepts: z.array(z.string()),
  misconception: z.string().nullable(),
  attemptedAt: utcTimestampSchema,
});

export const learningReportRequestSchema = z.object({ lessonId: identifierSchema });

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

export const aiHealthResponseSchema = z.object({
  status: z.enum(['healthy', 'fallback', 'degraded']),
  provider: aiProviderTypeSchema,
  configuredProvider: aiProviderTypeSchema,
  model: z.string().min(1),
  latencyMs: z.number().int().nonnegative(),
  timestamp: utcTimestampSchema,
  features: z.object({
    lessonGeneration: z.boolean(),
    tutor: z.boolean(),
    checkpointEvaluation: z.boolean(),
    adaptiveAssessment: z.boolean(),
    offlineFallbackReady: z.boolean(),
  }),
  credentials: z.object({
    geminiConfigured: z.boolean(),
    openaiConfigured: z.boolean(),
  }),
  error: z.string().nullable().optional(),
});

export type LearnerProfile = z.infer<typeof learnerProfileSchema>;
export type TeachingLanguage = z.infer<typeof teachingLanguageSchema>;
export type Citation = z.infer<typeof citationSchema>;
export type LearningSource = z.infer<typeof learningSourceSchema>;
export type SourceIngestionResponse = z.infer<typeof sourceIngestionResponseSchema>;
export type RetrievalRequest = z.infer<typeof retrievalRequestSchema>;
export type RetrievalResponse = z.infer<typeof retrievalResponseSchema>;
export type LessonRequest = z.infer<typeof lessonRequestSchema>;
export type LessonPlan = z.infer<typeof lessonPlanSchema>;
export type LessonPlanGenerationResponse = z.infer<typeof lessonPlanGenerationResponseSchema>;
export type TutorTurn = z.infer<typeof tutorTurnSchema>;
export type TutorIntent = z.infer<typeof tutorIntentSchema>;
export type TutorPedagogicalStyle = z.infer<typeof tutorPedagogicalStyleSchema>;
export type TutorLearnerLevel = z.infer<typeof tutorLearnerLevelSchema>;
export type TutorNumericStep = z.infer<typeof tutorNumericStepSchema>;
export type TutorMathVerification = z.infer<typeof tutorMathVerificationSchema>;
export type TutorImageAttachment = z.infer<typeof tutorImageAttachmentSchema>;
export type TutorRequest = z.input<typeof tutorRequestSchema>;
export type TutorRequestOutput = z.output<typeof tutorRequestSchema>;
export type TutorResponse = z.infer<typeof tutorResponseSchema>;
export type TutorStreamEvent = z.infer<typeof tutorStreamEventSchema>;
export type TutorNote = z.infer<typeof tutorNoteSchema>;
export type TutorFeedback = z.infer<typeof tutorFeedbackSchema>;
export type TutorExportPayload = z.infer<typeof tutorExportPayloadSchema>;
export type ResponseEvaluation = z.infer<typeof responseEvaluationSchema>;
export type CheckpointAttemptRequest = z.infer<typeof checkpointAttemptRequestSchema>;
export type LessonAdaptation = z.infer<typeof lessonAdaptationSchema>;
export type CheckpointAttemptResponse = z.infer<typeof checkpointAttemptResponseSchema>;
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentAttemptRequest = z.infer<typeof assessmentAttemptRequestSchema>;
export type AssessmentAttemptResponse = z.infer<typeof assessmentAttemptResponseSchema>;
export type LearningReport = z.infer<typeof learningReportSchema>;
export type AiHealthResponse = z.infer<typeof aiHealthResponseSchema>;

// ============================================================================
// PHASE 4: PRACTICE AT SCALE SCHEMAS & QUESTION MODELS
// ============================================================================

export const questionTypeSchema = z.enum([
  'mcq',
  'numeric',
  'short',
  'multi_select',
  'assertion_reason',
  'fill_blank',
  'match',
]);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export const questionDifficultySchema = z.enum(['easy', 'medium', 'hard', 'olympiad']);
export type QuestionDifficulty = z.infer<typeof questionDifficultySchema>;

export const solutionStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  formula: z.string().optional(),
  intermediateValue: z.string().optional(),
  unit: z.string().optional(),
});
export type SolutionStep = z.infer<typeof solutionStepSchema>;

export const distractorReasonSchema = z.object({
  choiceId: z.string().min(1),
  errorTag: z.string().min(1),
  explanation: z.string().min(1),
});
export type DistractorReason = z.infer<typeof distractorReasonSchema>;

export const matchPairSchema = z.object({
  leftId: z.string().min(1),
  leftText: z.string().min(1),
  rightId: z.string().min(1),
  rightText: z.string().min(1),
});
export type MatchPair = z.infer<typeof matchPairSchema>;

export const practiceQuestionSchema = z.object({
  id: identifierSchema,
  type: questionTypeSchema,
  conceptIds: z.array(z.string().min(1)).min(1),
  subject: z.enum(['physics', 'chemistry', 'mathematics', 'biology', 'computer_science', 'history_polity', 'general']),
  grade: z.string().min(1),
  difficulty: questionDifficultySchema,
  prompt: z.string().min(1),
  choices: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
  })).optional(),
  matchPairs: z.array(matchPairSchema).optional(),
  expectedAnswer: z.union([
    z.string(),
    z.array(z.string()),
    z.number(),
    z.record(z.string(), z.string()),
  ]),
  tolerance: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  solutionSteps: z.array(solutionStepSchema).min(1),
  commonErrorTags: z.array(z.string()).default([]),
  distractorExplanations: z.array(distractorReasonSchema).default([]),
  source: z.string().min(1),
  license: z.string().min(1),
  verified: z.boolean().default(false),
  verifiedReason: z.string().optional(),
  templateFamilyId: z.string().optional(),
  seed: z.number().int().optional(),
  createdAt: utcTimestampSchema,
});
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;

export const practiceSubmissionSchema = z.object({
  questionId: identifierSchema,
  learnerId: identifierSchema,
  submittedAnswer: z.union([z.string(), z.array(z.string()), z.number(), z.record(z.string(), z.string())]),
  timeSpentSeconds: z.number().nonnegative(),
});
export type PracticeSubmission = z.infer<typeof practiceSubmissionSchema>;

export const practiceEvaluationResultSchema = z.object({
  questionId: identifierSchema,
  isCorrect: z.boolean(),
  score: z.number().min(0).max(1),
  expectedAnswer: z.union([z.string(), z.array(z.string()), z.number(), z.record(z.string(), z.string())]),
  submittedAnswer: z.union([z.string(), z.array(z.string()), z.number(), z.record(z.string(), z.string())]),
  explanation: z.string(),
  diagnosedError: z.object({
    errorTag: z.string(),
    whyWrong: z.string(),
  }).optional(),
  solutionSteps: z.array(solutionStepSchema),
  updatedIrtTheta: z.number().optional(),
  recommendedNextConcept: z.string().optional(),
});
export type PracticeEvaluationResult = z.infer<typeof practiceEvaluationResultSchema>;

export const mockTestRequestSchema = z.object({
  learnerId: identifierSchema,
  title: z.string().min(1),
  subjects: z.array(z.string()).min(1),
  questionCount: z.number().int().min(5).max(60).default(15),
  durationMinutes: z.number().int().min(5).max(180).default(30),
  difficulty: questionDifficultySchema.default('medium'),
});
export type MockTestRequest = z.infer<typeof mockTestRequestSchema>;

export const mockTestSectionAnalysisSchema = z.object({
  subject: z.string(),
  totalQuestions: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  accuracyPercentage: z.number().min(0).max(100),
  averageTimeSeconds: z.number().nonnegative(),
  weakConcepts: z.array(z.string()),
  strongConcepts: z.array(z.string()),
});
export type MockTestSectionAnalysis = z.infer<typeof mockTestSectionAnalysisSchema>;

export const mockTestResultSchema = z.object({
  testId: identifierSchema,
  learnerId: identifierSchema,
  title: z.string(),
  totalQuestions: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  scorePercentage: z.number().min(0).max(100),
  percentileRank: z.number().min(0).max(100),
  totalTimeSpentSeconds: z.number().nonnegative(),
  sectionalAnalysis: z.array(mockTestSectionAnalysisSchema),
  weakConcepts: z.array(z.string()),
  reviewSchedule: z.array(z.object({
    conceptId: z.string(),
    recommendedReviewDate: z.string(),
    reviewReason: z.string(),
  })),
  completedAt: utcTimestampSchema,
});
export type MockTestResult = z.infer<typeof mockTestResultSchema>;

export const questionBankQuerySchema = z.object({
  subject: z.string().optional(),
  conceptId: z.string().optional(),
  difficulty: questionDifficultySchema.optional(),
  type: questionTypeSchema.optional(),
  grade: z.string().optional(),
  verifiedOnly: z.boolean().optional().default(false),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
});
export type QuestionBankQuery = z.infer<typeof questionBankQuerySchema>;

export const questionBankStatsSchema = z.object({
  totalQuestions: z.number().int().nonnegative(),
  verifiedQuestions: z.number().int().nonnegative(),
  generatorFamilyCount: z.number().int().nonnegative(),
  estimatedParametricInstances: z.number().int().nonnegative(),
  bySubject: z.record(z.string(), z.number()),
  byType: z.record(z.string(), z.number()),
  byDifficulty: z.record(z.string(), z.number()),
});
export type QuestionBankStats = z.infer<typeof questionBankStatsSchema>;

export const questionReportRequestSchema = z.object({
  questionId: identifierSchema,
  learnerId: identifierSchema,
  issueType: z.enum(['wrong_answer', 'typo', 'unclear_prompt', 'incorrect_explanation', 'other']),
  details: z.string().min(5).max(1000),
});
export type QuestionReportRequest = z.infer<typeof questionReportRequestSchema>;

export * from './vetted-visual-registry.ts';
