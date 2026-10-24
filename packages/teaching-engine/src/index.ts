import {
  assessmentAttemptResponseSchema,
  assessmentQuestionSchema,
  learningReportSchema,
  lessonAdaptationSchema,
  responseEvaluationSchema,
  lessonPlanSchema,
  suggestVisualForTopic,
  getVettedVisualRegistry,
  validateVisualSelection,
  type AssessmentAttemptResponse,
  type AssessmentQuestion,
  type LearningReport,
  type LessonAdaptation,
  type LessonPlan,
  type LessonRequest,
  type ResponseEvaluation,
} from '@edukriti/contracts';
import type { AiProvider } from '@edukriti/ai';
import { z } from 'zod';
import {
  resolveConceptGraph,
  buildSpokenStyleNarration,
  buildCheckpointRubric,
  type ConceptNode,
} from './concept-graph.ts';

export type LessonEvidence = {
  sourceId: string;
  chunkId: string;
  page: number;
  text: string;
};

/**
 * ============================================================================
 * OFFLINE DETERMINISTIC FALLBACK DATA & REGISTRY
 * Used when running offline or as fallback when no AI provider key is configured.
 * ============================================================================
 */
const topicSequences: Array<{ pattern: RegExp; concepts: string[] }> = [
  { pattern: /electric|circuit|ohm|voltage|current|resistance/i, concepts: ['Electric charge and current', 'Voltage as the driving force', 'Resistance and Ohm’s Law', 'Applying ideas to a simple circuit', 'Practice and reflection', 'Challenge problem'] },
  { pattern: /newton|force|motion/i, concepts: ['Motion and force', 'Newton’s First Law', 'Newton’s Second Law', 'Newton’s Third Law', 'Everyday applications', 'Challenge problem'] },
  { pattern: /react|component|jsx/i, concepts: ['The component model', 'JSX and rendering', 'Props and data flow', 'State and interaction', 'Building a small feature', 'Interview practice'] },
  { pattern: /artificial intelligence|machine learning|\bai\b/i, concepts: ['What makes a system intelligent', 'Data, models, and learning', 'Training and inference', 'Common AI applications', 'Limits and responsible use', 'Next learning steps'] },
  { pattern: /photosynthesis|plant|chloroplast|light reaction/i, concepts: ['Light absorption and chlorophyll', 'The light-dependent reactions', 'ATP and NADPH energy carriers', 'The Calvin cycle (carbon fixation)', 'Factors affecting photosynthesis rate', 'Real-world ecological impact'] },
  { pattern: /cell|mitosis|meiosis|organelle|nucleus/i, concepts: ['Structure of eukaryotic cells', 'Cell organelles and functions', 'DNA and genetic replication', 'Mitosis and cell division', 'Cellular respiration overview', 'Application to growth and healing'] },
  { pattern: /plate tectonics|earthquake|volcano|crust|mantle/i, concepts: ['Earth layers and lithosphere', 'Tectonic plate boundaries', 'Subduction and mountain building', 'Earthquake generation and seismic waves', 'Volcanic activity and hotspots', 'Predicting geological hazards'] },
  { pattern: /chemical bond|covalent|ionic|valen/i, concepts: ['Atomic structure and valence electrons', 'Ionic bonding and electron transfer', 'Covalent bonding and electron sharing', 'Polarity and molecular shapes', 'Intermolecular forces', 'Predicting substance properties'] },
  { pattern: /calculus|derivative|integral|limit/i, concepts: ['The concept of a mathematical limit', 'Instantaneous rate of change', 'The derivative as slope of tangent', 'Rules of differentiation', 'Definite integrals and area under curve', 'Real-world rate of change problem'] },
  { pattern: /gravity|planetary|orbit|kepler/i, concepts: ['Universal gravitation principle', 'Mass versus weight', 'Kepler’s laws of planetary motion', 'Orbital velocity and satellites', 'Escape velocity and space flight', 'Gravitational challenge problem'] },
  { pattern: /thermodynamics|heat|temperature|entropy/i, concepts: ['Thermal energy versus temperature', 'First Law of Thermodynamics (Energy)', 'Heat transfer mechanisms', 'Second Law of Thermodynamics (Entropy)', 'Heat engines and efficiency', 'Everyday thermodynamic systems'] },
  { pattern: /dna|genetics|heredity|mendel/i, concepts: ['DNA double helix structure', 'Genes and chromosomes', 'Mendel’s laws of inheritance', 'Dominant and recessive alleles', 'Transcription and translation', 'Genetic engineering ethics'] },
  { pattern: /indian constitution|fundamental rights|preamble|parliament/i, concepts: ['Preamble and core constitutional philosophy', 'Fundamental Rights and Duties', 'Directive Principles of State Policy', 'Separation of powers and Parliament', 'The Independent Judiciary', 'Constitutional amendments and democracy'] },
  { pattern: /macroeconomics|inflation|gdp|monetary/i, concepts: ['Gross Domestic Product (GDP)', 'Aggregate supply and demand', 'Inflation and purchasing power', 'Fiscal policy and government spending', 'Central banks and monetary policy', 'Economic growth challenge problem'] },
];

function segmentCount(minutes: 5 | 20 | 60) {
  return minutes === 5 ? 2 : minutes === 20 ? 4 : 6;
}

function visualFor(topic: string, concept: string) {
  const text = `${topic} ${concept}`.toLocaleLowerCase();
  if (/math|equation|ohm|voltage|current|resistance|force/.test(text)) return 'equation' as const;
  if (/history|event|century/.test(text)) return 'timeline' as const;
  if (/geography|country|river|location/.test(text)) return 'map' as const;
  if (/react|javascript|python|code|program/.test(text)) return 'code' as const;
  if (/data|trend|statistics/.test(text)) return 'graph' as const;
  if (/biology|cell|organ|circuit|system|process/.test(text)) return 'diagram' as const;
  return 'key_points' as const;
}

function conceptsFor(topic: string, evidence: LessonEvidence[], count: number) {
  const sequence = topicSequences.find((entry) => entry.pattern.test(topic))?.concepts;
  if (sequence) return sequence.slice(0, count);
  const evidenceConcepts = evidence.map((item) => item.text.split(/[.!?\n]/)[0]?.trim()).filter((item): item is string => Boolean(item && item.length > 8));
  const fallbacks = [`Foundations of ${topic}`, `How ${topic} works`, `${topic} in practice`, `Reviewing ${topic}`, `Applying ${topic}`, `Going further with ${topic}`];
  return Array.from({ length: count }, (_, index) => evidenceConcepts[index] || fallbacks[index]);
}

function localizedNarration(language: LessonRequest['language'], level: LessonRequest['level'], concept: string, topic: string, evidence?: LessonEvidence) {
  const sourceIdea = evidence?.text.slice(0, 420);
  const depth = level === 'beginner' ? 'a simple everyday example' : level === 'intermediate' ? 'a practical example and the key technical terms' : 'the precise mechanism, assumptions, and a challenging application';
  if (language === 'hindi') return `आज हम “${concept}” समझेंगे। पहले मूल विचार देखिए: ${sourceIdea || `${concept}, ${topic} का एक महत्वपूर्ण भाग है।`} अब इसे ${depth} के साथ चरण-दर-चरण जोड़ते हैं।`;
  if (language === 'hinglish') return `Aaj hum “${concept}” ko step-by-step samjhenge. Core idea yeh hai: ${sourceIdea || `${concept} is an important part of ${topic}.`} Ab isse ${depth} ke through connect karte hain, taaki concept sirf yaad nahi balki clear ho.`;
  return `Let’s understand “${concept}” step by step. The core idea is: ${sourceIdea || `${concept} is an important part of ${topic}.`} We will connect it using ${depth} so the learner can explain and apply it.`;
}

function checkpointPrompt(language: LessonRequest['language'], concept: string) {
  if (language === 'hindi') return `अपने शब्दों में बताइए: “${concept}” का मुख्य विचार क्या है?`;
  if (language === 'hinglish') return `Apne words mein batao: “${concept}” ka main idea kya hai?`;
  return `Explain in your own words: what is the main idea behind “${concept}”?`;
}

export function buildDeterministicLessonPlan(
  request: LessonRequest,
  evidence: LessonEvidence[] = [],
  id = crypto.randomUUID(),
  now = new Date().toISOString(),
): LessonPlan {
  const topic = request.topic?.trim() || evidence[0]?.text.split(/[.!?\n]/)[0]?.slice(0, 90) || 'Uploaded material';
  const count = segmentCount(request.durationMinutes);
  const variantMode = request.variantMode ?? 'standard';
  const graphNodes = resolveConceptGraph(topic, count);
  const concepts = conceptsFor(topic, evidence, count);
  const minutesPerSegment = request.durationMinutes / count;

  return lessonPlanSchema.parse({
    id,
    learnerId: request.learnerId,
    title: `${topic}: a ${request.durationMinutes}-minute guided lesson`,
    objectives: [
      `Explain the essential ideas of ${topic}`,
      `Apply ${topic} through an appropriate example`,
      `Check understanding and identify misconceptions`,
    ],
    language: request.language,
    durationMinutes: request.durationMinutes,
    variantMode,
    prerequisiteConcepts: graphNodes.flatMap((n) => n.prerequisites),
    conceptGraphNodes: graphNodes.map((n) => n.id),
    spacedRevision: graphNodes.flatMap((n) => n.spacedRevision),
    segments: concepts.map((concept, index) => {
      const source = evidence[index % Math.max(evidence.length, 1)];
      const node = graphNodes[index];
      const hasCheckpoint = index > 0 && (index === count - 1 || index % 2 === 1);
      const checkpointId = `${id}-checkpoint-${index + 1}`;

      const narration = node
        ? buildSpokenStyleNarration(node, request.language, variantMode)
        : localizedNarration(request.language, request.level, concept, topic, source);

      const interactive = suggestVisualForTopic(
        concept,
        node?.suggestedVisualId,
      );

      return {
        id: `${id}-segment-${index + 1}`,
        title: concept,
        objective: index === count - 1 ? `Use and verify the learner’s understanding of ${concept}` : `Build a clear mental model of ${concept}`,
        estimatedMinutes: Number(minutesPerSegment.toFixed(1)),
        narration,
        visualType: visualFor(topic, concept),
        visualBrief: `Create a ${visualFor(topic, concept).replace('_', ' ')} that demonstrates ${concept} for a ${request.level} learner. Keep labels in ${request.language}.`,
        interactive,
        citations: source ? [{ sourceId: source.sourceId, chunkId: source.chunkId, page: source.page, excerpt: source.text.slice(0, 500) }] : [],
        checkpoint: hasCheckpoint ? {
          id: checkpointId,
          prompt: node
            ? (node.applicationCheckpoint.prompt[request.language === 'hindi' ? 'hindi' : request.language === 'hinglish' ? 'hinglish' : 'english'] || checkpointPrompt(request.language, concept))
            : checkpointPrompt(request.language, concept),
          type: (node?.applicationCheckpoint.type ?? 'explain_in_own_words') as 'explain_in_own_words' | 'application' | 'short_answer',
          targetConcept: concept,
          rubric: node ? buildCheckpointRubric(node, checkpointId) : undefined,
        } : undefined,
      };
    }),
    createdAt: now,
  });
}

/**
 * Generates an end-to-end personalized lesson plan using the configured AI provider.
 * Falls back deterministically to buildDeterministicLessonPlan if provider throws or fails.
 */
export async function generateLessonPlanWithAi(
  provider: AiProvider,
  request: LessonRequest,
  evidence: LessonEvidence[] = [],
  id = crypto.randomUUID(),
  now = new Date().toISOString(),
): Promise<LessonPlan> {
  const count = segmentCount(request.durationMinutes);
  const topic = request.topic?.trim() || evidence[0]?.text.split(/[.!?\n]/)[0]?.slice(0, 90) || 'Uploaded material';
  const variantMode = request.variantMode ?? 'standard';
  const graphNodes = resolveConceptGraph(topic, count);
  const vettedRegistry = getVettedVisualRegistry().map((v) => ({
    id: v.id,
    kind: v.kind,
    title: v.title,
    paramKeys: v.paramKeys,
    defaultParams: v.defaultParams,
  }));

  const prompt = {
    instructions: `# Role
You are Edukriti, an expert, encouraging, adaptive teacher building an interactive lesson plan.
Produce a structured lesson plan adhering strictly to the schema.

# Guidelines
- Match language: ${request.language} (English / Hindi / Hinglish).
- Level: ${request.level}.
- Duration: exactly ${request.durationMinutes} minutes with ${count} logical segments.
- Variant Mode: ${variantMode} (standard / exam_focused / practical).
- Style: ${request.style}.
- Learner goal: ${request.goal}.
- Narration: Conversational spoken-style teaching. Integrate a real-world example, clear analogy, and address common misconceptions.
- Visual Interactive: You must NEVER write code. For interactive segments, select ONLY an id and params from the vetted visual registry.
- Checkpoints: Application-focused, verifying conceptual understanding. Include a grading rubric (key ideas, misconceptions, passing criteria).
- Spaced Revision: Include 1-day, 3-day, 7-day, and 14-day spaced revision prompts tied to key concepts.
- Citations: Strictly reference provided evidence when present.`,
    input: {
      topic,
      level: request.level,
      language: request.language,
      durationMinutes: request.durationMinutes,
      variantMode,
      style: request.style,
      goal: request.goal,
      prerequisiteConcepts: graphNodes.flatMap((n) => n.prerequisites),
      suggestedConcepts: graphNodes.map((n) => n.conceptName),
      vettedVisualRegistry: vettedRegistry,
      evidence: evidence.map((e) => ({
        sourceId: e.sourceId,
        chunkId: e.chunkId,
        page: e.page,
        text: e.text.slice(0, 500),
      })),
    },
  };

  try {
    const generated = await provider.generateStructured(lessonPlanSchema, prompt, {
      schemaName: 'edukriti_lesson_plan',
      schemaDescription: 'Structured personalized lesson plan',
    });

    // Validate interactive selections against vetted registry (enforcing Rule 3)
    const cleanedSegments = generated.segments.map((seg, idx) => {
      let interactive = seg.interactive;
      if (interactive) {
        const validation = validateVisualSelection(interactive.id, interactive.params);
        if (validation.isValid && validation.validatedParams) {
          interactive = {
            ...interactive,
            params: validation.validatedParams,
          };
        } else {
          // Fall back to vetted visual suggestion or strip invalid params
          const suggested = suggestVisualForTopic(seg.title, graphNodes[idx]?.suggestedVisualId);
          interactive = suggested;
        }
      }
      return {
        ...seg,
        interactive,
      };
    });

    return lessonPlanSchema.parse({
      ...generated,
      id,
      learnerId: request.learnerId,
      language: request.language,
      durationMinutes: request.durationMinutes,
      variantMode,
      segments: cleanedSegments,
      prerequisiteConcepts: generated.prerequisiteConcepts?.length
        ? generated.prerequisiteConcepts
        : graphNodes.flatMap((n) => n.prerequisites),
      conceptGraphNodes: generated.conceptGraphNodes?.length
        ? generated.conceptGraphNodes
        : graphNodes.map((n) => n.id),
      spacedRevision: generated.spacedRevision?.length
        ? generated.spacedRevision
        : graphNodes.flatMap((n) => n.spacedRevision),
      createdAt: now,
    });
  } catch {
    return buildDeterministicLessonPlan(request, evidence, id, now);
  }
}

export function lessonMinutes(plan: LessonPlan) {
  return plan.segments.reduce((total, segment) => total + segment.estimatedMinutes, 0);
}

export function speechLocale(language: LessonPlan['language']) {
  return language === 'hindi' ? 'hi-IN' : 'en-IN';
}

export function speechChunks(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  return sentences.length ? sentences : [text.trim()].filter(Boolean);
}

export function teachingVoiceScore(name: string, voiceLanguage: string, lessonLanguage: LessonPlan['language']) {
  const normalizedName = name.toLowerCase();
  const normalizedLanguage = voiceLanguage.toLowerCase();
  const target = speechLocale(lessonLanguage).toLowerCase();
  let score = normalizedLanguage === target ? 100 : normalizedLanguage.startsWith(target.slice(0, 2)) ? 65 : 0;
  if (/natural|neural|online/.test(normalizedName)) score += 45;
  if (/swara|neerja|heera|kalpana|veena|zira|aria|samantha/.test(normalizedName)) score += 30;
  if (/microsoft|google/.test(normalizedName)) score += 10;
  return score;
}

export function captionAt(text: string, characterIndex: number) {
  const sentences = Array.from(text.matchAll(/[^.!?]+[.!?]?/g));
  const current = sentences.find((match) => {
    const start = match.index ?? 0;
    return characterIndex >= start && characterIndex < start + match[0].length;
  });
  return (current?.[0] ?? sentences.at(-1)?.[0] ?? text).trim();
}

export function lessonProgress(segmentIndex: number, segmentCountValue: number) {
  if (segmentCountValue <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(((segmentIndex + 1) / segmentCountValue) * 100)));
}

export {
  evaluateCheckpointRubric,
  buildAdaptationV2,
  findOrBuildRubric,
  type CheckpointContext,
} from './rubric-evaluator.ts';
import {
  evaluateCheckpointRubric,
  buildAdaptationV2,
  type CheckpointContext,
} from './rubric-evaluator.ts';

export function evaluateCheckpoint(context: CheckpointContext, learnerResponse: string): ResponseEvaluation {
  return evaluateCheckpointRubric(context, learnerResponse);
}

/**
 * Evaluates a learner's checkpoint response using the AI provider.
 * Analyzes semantic meaning, misconceptions, confidence, and suggests pedagogical next actions.
 * Falls back deterministically if AI provider fails or is offline.
 */
export async function evaluateCheckpointWithAi(
  provider: AiProvider,
  context: CheckpointContext,
  learnerResponse: string,
): Promise<ResponseEvaluation> {
  const prompt = {
    instructions: `# Role
You are an expert educational evaluator evaluating a student's response to an in-lesson checkpoint.
Target concept: "${context.targetConcept}"
Language: ${context.language}

# Rules
- Evaluate conceptual understanding, not exact rote memorization.
- Diagnose if there is a known misconception (e.g. current being consumed, confusing voltage with current, action-reaction acting on same body).
- If the learner is confused or incorrect, write kind, constructive feedback in ${context.language} and select an appropriate nextAction ('new_analogy', 'simplify', 'new_example', 'change_visual').
- If correct, acknowledge what they understood accurately and set nextAction to 'continue'.`,
    input: {
      targetConcept: context.targetConcept,
      learnerResponse,
      language: context.language,
    },
  };

  try {
    const evaluation = await provider.generateStructured(responseEvaluationSchema, prompt, {
      schemaName: 'checkpoint_evaluation',
      schemaDescription: 'Semantic assessment of student checkpoint response',
    });
    return responseEvaluationSchema.parse({
      ...evaluation,
      checkpointId: context.id,
    });
  } catch {
    return evaluateCheckpoint(context, learnerResponse);
  }
}

export function buildAdaptation(context: CheckpointContext, evaluation: ResponseEvaluation): LessonAdaptation | null {
  return buildAdaptationV2(context, evaluation, 1);
}

/**
 * Builds an adaptive teaching segment when a student struggles with a checkpoint.
 * Falls back to deterministic adaptation if provider fails.
 */
export async function buildAdaptationWithAi(
  provider: AiProvider,
  context: CheckpointContext,
  evaluation: ResponseEvaluation,
): Promise<LessonAdaptation | null> {
  if (evaluation.isCorrect) return null;

  const prompt = {
    instructions: `# Role
You are Aarohi, an adaptive tutor creating a fresh teaching angle for a student struggling with "${context.targetConcept}".
Language: ${context.language}

# Adaptation Strategy: ${evaluation.nextAction}
- Create an intuitive analogy or simplified breakdown.
- Do NOT repeat the failed explanation verbatim.
- Connect cause, mechanism, and real-life observable result.
- Select an appropriate visualType from: 'diagram', 'equation', 'graph', 'timeline', 'map', 'code', 'illustration', 'key_points'.`,
    input: {
      targetConcept: context.targetConcept,
      misconception: evaluation.misconception,
      feedback: evaluation.feedback,
      strategy: evaluation.nextAction,
      language: context.language,
    },
  };

  try {
    const result = await provider.generateStructured(lessonAdaptationSchema, prompt, {
      schemaName: 'lesson_adaptation',
      schemaDescription: 'Adaptive re-teaching segment',
    });
    return lessonAdaptationSchema.parse(result);
  } catch {
    return buildAdaptation(context, evaluation);
  }
}

export {
  buildAssessment,
  buildAssessmentWithAi,
  type AssessmentQuestionDefinition,
} from './assessment-generator.ts';
import {
  buildAssessment,
  buildAssessmentWithAi,
  type AssessmentQuestionDefinition,
} from './assessment-generator.ts';

function assessmentPrompt(language: LessonPlan['language'], english: string, hinglish: string, hindi: string) {
  return language === 'hindi' ? hindi : language === 'hinglish' ? hinglish : english;
}

export function evaluateAssessmentAnswer(plan: LessonPlan, question: AssessmentQuestionDefinition, learnerResponse: string, attemptId: string, attemptedAt = new Date().toISOString()): AssessmentAttemptResponse {
  const semanticEvaluation = question.type === 'short_answer' ? evaluateCheckpoint({ id: question.id, targetConcept: question.targetConcept, language: plan.language }, learnerResponse) : null;
  const isCorrect = question.type === 'mcq' ? learnerResponse === question.expectedAnswer : Boolean(semanticEvaluation?.isCorrect);
  const feedback = isCorrect
    ? assessmentPrompt(plan.language, 'Correct — that shows a clear understanding.', 'Bilkul sahi — concept clear hai.', 'सही उत्तर — अवधारणा स्पष्ट है।')
    : semanticEvaluation?.feedback ?? assessmentPrompt(plan.language, 'Not quite. Review this concept in the lesson report.', 'Not quite. Is concept ko report mein revise karein.', 'यह सही नहीं है। रिपोर्ट में इस अवधारणा को दोहराएँ।');
  return assessmentAttemptResponseSchema.parse({ attemptId, questionId: question.id, isCorrect, feedback, understoodConcepts: isCorrect ? [question.targetConcept] : [], weakConcepts: isCorrect ? [] : [question.targetConcept], misconception: semanticEvaluation?.misconception ?? null, attemptedAt });
}

/**
 * Evaluates a learner's assessment response using AI for deep semantic understanding.
 * Falls back to evaluateAssessmentAnswer if provider is offline or throws.
 */
export async function evaluateAssessmentAnswerWithAi(
  provider: AiProvider,
  plan: LessonPlan,
  question: AssessmentQuestionDefinition,
  learnerResponse: string,
  attemptId: string,
  attemptedAt = new Date().toISOString(),
): Promise<AssessmentAttemptResponse> {
  if (question.type === 'mcq') {
    const isCorrect = learnerResponse.trim().toLowerCase() === question.expectedAnswer.trim().toLowerCase();
    const feedback = isCorrect
      ? assessmentPrompt(plan.language, 'Correct — that shows a clear understanding.', 'Bilkul sahi — concept clear hai.', 'सही उत्तर — अवधारणा स्पष्ट है।')
      : assessmentPrompt(
          plan.language,
          `Not quite. The correct answer was (${question.expectedAnswer}). Review this in your report.`,
          `Not quite. Sahi answer (${question.expectedAnswer}) tha. Report mein isse revise karein.`,
          `यह सही नहीं है। सही उत्तर (${question.expectedAnswer}) था। रिपोर्ट में इसे दोहराएँ।`,
        );
    return assessmentAttemptResponseSchema.parse({
      attemptId,
      questionId: question.id,
      isCorrect,
      feedback,
      understoodConcepts: isCorrect ? [question.targetConcept] : [],
      weakConcepts: isCorrect ? [] : [question.targetConcept],
      misconception: isCorrect ? null : `Confusion regarding ${question.targetConcept}`,
      attemptedAt,
    });
  }

  // Short answer: evaluate conceptually with AI
  const semanticEval = await evaluateCheckpointWithAi(
    provider,
    { id: question.id, targetConcept: question.targetConcept, language: plan.language },
    learnerResponse,
  );

  return assessmentAttemptResponseSchema.parse({
    attemptId,
    questionId: question.id,
    isCorrect: semanticEval.isCorrect,
    feedback: semanticEval.feedback,
    understoodConcepts: semanticEval.isCorrect ? [question.targetConcept] : [],
    weakConcepts: semanticEval.isCorrect ? [] : [question.targetConcept],
    misconception: semanticEval.misconception,
    attemptedAt,
  });
}

export function buildLearningReport(plan: LessonPlan, attempts: AssessmentAttemptResponse[], completedAt = new Date().toISOString()): LearningReport {
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const strongConcepts = [...new Set(attempts.flatMap((attempt) => attempt.understoodConcepts))];
  const weakConcepts = [...new Set(attempts.flatMap((attempt) => attempt.weakConcepts))];
  const misconceptions = [...new Set(attempts.flatMap((attempt) => attempt.misconception ? [attempt.misconception] : []))];
  const topic = plan.title.split(':')[0]?.trim() || plan.title;
  return learningReportSchema.parse({
    lessonId: plan.id,
    learnerId: plan.learnerId,
    scorePercent: Math.round((correct / Math.max(attempts.length, 1)) * 100),
    strongConcepts,
    weakConcepts,
    misconceptions,
    revisionAdvice: weakConcepts.length ? weakConcepts.map((concept) => `Review ${concept} using the lesson visual, then explain it aloud without notes.`) : ['Try a harder application problem to deepen your understanding.'],
    recommendedNextTopic: weakConcepts[0] ? `Practice: ${weakConcepts[0]}` : `Advanced applications of ${topic}`,
    completedAt,
  });
}

export * from './numerical-solver.ts';
export * from './golden-eval-set.ts';
export * from './concept-graph.ts';
