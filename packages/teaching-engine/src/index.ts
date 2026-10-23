import {
  assessmentAttemptResponseSchema,
  assessmentQuestionSchema,
  learningReportSchema,
  lessonAdaptationSchema,
  responseEvaluationSchema,
  lessonPlanSchema,
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

export function buildDeterministicLessonPlan(request: LessonRequest, evidence: LessonEvidence[] = [], id = crypto.randomUUID(), now = new Date().toISOString()): LessonPlan {
  const topic = request.topic?.trim() || evidence[0]?.text.split(/[.!?\n]/)[0]?.slice(0, 90) || 'Uploaded material';
  const count = segmentCount(request.durationMinutes);
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
    segments: concepts.map((concept, index) => {
      const source = evidence[index % Math.max(evidence.length, 1)];
      const hasCheckpoint = index > 0 && (index === count - 1 || index % 2 === 1);
      return {
        id: `${id}-segment-${index + 1}`,
        title: concept,
        objective: index === count - 1 ? `Use and verify the learner’s understanding of ${concept}` : `Build a clear mental model of ${concept}`,
        estimatedMinutes: Number(minutesPerSegment.toFixed(1)),
        narration: localizedNarration(request.language, request.level, concept, topic, source),
        visualType: visualFor(topic, concept),
        visualBrief: `Create a ${visualFor(topic, concept).replace('_', ' ')} that demonstrates ${concept} for a ${request.level} learner. Keep labels in ${request.language}.`,
        citations: source ? [{ sourceId: source.sourceId, chunkId: source.chunkId, page: source.page, excerpt: source.text.slice(0, 500) }] : [],
        checkpoint: hasCheckpoint ? {
          id: `${id}-checkpoint-${index + 1}`,
          prompt: checkpointPrompt(request.language, concept),
          type: 'explain_in_own_words' as const,
          targetConcept: concept,
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

  const prompt = {
    instructions: `# Role
You are Edukriti, an expert, encouraging, adaptive teacher building an interactive lesson plan.
Produce a structured lesson plan adhering strictly to the schema.

# Guidelines
- Match language: ${request.language} (English / Hindi / Hinglish).
- Level: ${request.level}.
- Duration: exactly ${request.durationMinutes} minutes with ${count} logical segments.
- Style: ${request.style}.
- Learner goal: ${request.goal}.
- Narration should be conversational spoken teaching with natural explanations and transitions.
- Checkpoints should check conceptual understanding rather than pure memorization.
- Citations must strictly reference provided evidence when present.`,
    input: {
      topic,
      level: request.level,
      language: request.language,
      durationMinutes: request.durationMinutes,
      style: request.style,
      goal: request.goal,
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

    return lessonPlanSchema.parse({
      ...generated,
      id,
      learnerId: request.learnerId,
      language: request.language,
      durationMinutes: request.durationMinutes,
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

type CheckpointContext = {
  id: string;
  targetConcept: string;
  language: LessonPlan['language'];
};

const conceptSignals: Array<{ pattern: RegExp; signals: RegExp; misconception?: RegExp }> = [
  { pattern: /voltage|driving force/i, signals: /push|pressure|potential|difference|drive|energy/i, misconception: /same as current|is current/i },
  { pattern: /current|charge/i, signals: /flow|charge|electron|ampere|circuit/i, misconception: /used up|gets used|finish(?:es|ed)?/i },
  { pattern: /resistance|ohm/i, signals: /oppose|restrict|slow|limit|current|ohm/i, misconception: /creates current|adds current/i },
  { pattern: /newton|force|motion/i, signals: /force|mass|acceleration|motion|reaction|inertia/i },
  { pattern: /component|jsx|react/i, signals: /component|render|props|state|interface|reuse/i },
  { pattern: /photosynthesis|chlorophyll|light reaction/i, signals: /chlorophyll|sunlight|atp|carbon|glucose|oxygen|water/i, misconception: /plants breathe only co2|only at night|without light/i },
  { pattern: /cell|mitosis|meiosis|organelle/i, signals: /nucleus|membrane|mitosis|chromosome|dna|division|energy/i, misconception: /mitosis creates gametes|cells do not divide/i },
  { pattern: /tectonic|earthquake|subduction/i, signals: /plate|crust|boundary|subduction|mantle|seismic|wave/i, misconception: /continents float on water/i },
  { pattern: /chemical bond|covalent|ionic/i, signals: /valence|electron|transfer|sharing|octet|attraction/i, misconception: /ionic bonds share electrons|bonds are sticks/i },
  { pattern: /derivative|calculus|rate of change/i, signals: /rate of change|slope|tangent|instantaneous|limit/i, misconception: /divide by zero|slope is always constant/i },
  { pattern: /gravity|orbit|kepler/i, signals: /mass|distance|attraction|orbit|velocity|gravitational/i, misconception: /no gravity in space|heavier falls faster in vacuum/i },
];

function localizedFeedback(language: LessonPlan['language'], correct: boolean, concept: string) {
  if (language === 'hindi') return correct ? `बहुत अच्छा — आपने ${concept} का मुख्य विचार सही समझाया।` : `अच्छी कोशिश। उत्तर में ${concept} का मुख्य संबंध अभी स्पष्ट नहीं है।`;
  if (language === 'hinglish') return correct ? `Bilkul sahi — aapne ${concept} ka core idea clearly explain kiya.` : `Good try. ${concept} ka main connection abhi clear nahi hua, so ek nayi analogy se dekhte hain.`;
  return correct ? `Exactly — you explained the core idea of ${concept}.` : `Good attempt. The key relationship in ${concept} is not clear yet, so let’s try a different analogy.`;
}

export function evaluateCheckpoint(context: CheckpointContext, learnerResponse: string): ResponseEvaluation {
  const response = learnerResponse.trim();
  const rule = conceptSignals.find((entry) => entry.pattern.test(context.targetConcept));
  const currentIsConsumed = /current.{0,24}(used up|gets used|finish(?:es|ed)?)/i.test(response);
  const misconceptionMatch = currentIsConsumed || (rule?.misconception?.test(response) ?? false);
  const conceptWords = context.targetConcept.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const semanticMatch = rule?.signals.test(response) ?? conceptWords.some((word) => response.toLowerCase().includes(word));
  const developedAnswer = response.split(/\s+/).length >= 4;
  const isCorrect = developedAnswer && semanticMatch && !misconceptionMatch;
  const misconception = misconceptionMatch
    ? currentIsConsumed ? 'The learner thinks electric current is consumed by a component instead of flowing around the complete circuit.' : `The learner treats ${context.targetConcept} as an interchangeable or consumable quantity.`
    : isCorrect ? null : `The response does not yet connect the defining cause-and-effect relationship in ${context.targetConcept}.`;

  return responseEvaluationSchema.parse({
    checkpointId: context.id,
    isCorrect,
    confidence: misconceptionMatch ? 0.92 : semanticMatch ? 0.84 : 0.68,
    understoodConcepts: isCorrect ? [context.targetConcept] : [],
    misconception,
    feedback: localizedFeedback(context.language, isCorrect, context.targetConcept),
    nextAction: isCorrect ? 'continue' : 'new_analogy',
  });
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
  if (evaluation.isCorrect) return null;
  const concept = context.targetConcept;
  const analogy = /voltage|current|resistance|electric/i.test(concept)
    ? 'Imagine a water pipe: voltage is the push from the pump, current is the amount of water flowing, and resistance is the narrowness that limits the flow.'
    : `Imagine ${concept} as a small system with an input, a rule, and an observable result. Change one part at a time and watch what happens.`;
  const explanation = context.language === 'hindi'
    ? `इसे एक नए उदाहरण से समझते हैं। ${analogy} अब कारण, बदलाव और परिणाम को अलग-अलग पहचानिए।`
    : context.language === 'hinglish'
      ? `Chalo ek different analogy try karte hain. ${analogy} Ab cause, change aur result ko alag-alag identify karo.`
      : `Let’s switch to a different analogy. ${analogy} Now identify the cause, the change, and the result separately.`;
  return lessonAdaptationSchema.parse({ strategy: 'new_analogy', title: `${concept}, explained another way`, explanation, visualType: 'diagram', visualBrief: `Show a three-part cause → change → result diagram for ${concept}.` });
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

export type AssessmentQuestionDefinition = AssessmentQuestion & {
  expectedAnswer: string;
  targetConcept: string;
};

const aiGeneratedAssessmentSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(['mcq', 'short_answer']),
      prompt: z.string().min(1).max(1000),
      choices: z.array(
        z.object({
          id: z.string().min(1).max(12),
          text: z.string().min(1).max(500),
        }),
      ).min(2).max(6).optional(),
      expectedAnswer: z.string().min(1).max(500),
      targetConcept: z.string().min(1).max(200),
    }),
  ).min(3).max(5),
});

function assessmentPrompt(language: LessonPlan['language'], english: string, hinglish: string, hindi: string) {
  return language === 'hindi' ? hindi : language === 'hinglish' ? hinglish : english;
}

export function buildAssessment(plan: LessonPlan): AssessmentQuestionDefinition[] {
  const count = plan.durationMinutes === 60 ? 5 : 3;
  const electricity = /electric|circuit|voltage|current|resistance|ohm/i.test(plan.title);
  if (electricity) {
    const definitions: AssessmentQuestionDefinition[] = [
      { id: `${plan.id}-assessment-1`, type: 'mcq', prompt: assessmentPrompt(plan.language, 'What best describes voltage in a circuit?', 'Circuit mein voltage ko best kaise describe karenge?', 'परिपथ में वोल्टेज का सबसे अच्छा वर्णन क्या है?'), choices: [{ id: 'a', text: 'The push or potential difference that drives charge' }, { id: 'b', text: 'The amount of resistance in a wire' }, { id: 'c', text: 'The charge permanently stored in a bulb' }], expectedAnswer: 'a', targetConcept: 'Voltage as the driving force' },
      { id: `${plan.id}-assessment-2`, type: 'mcq', prompt: assessmentPrompt(plan.language, 'If resistance increases while voltage stays constant, what happens to current?', 'Voltage same rahe aur resistance badhe, toh current ka kya hoga?', 'वोल्टेज समान रहे और प्रतिरोध बढ़े, तो धारा का क्या होगा?'), choices: [{ id: 'a', text: 'It increases' }, { id: 'b', text: 'It decreases' }, { id: 'c', text: 'It always becomes zero' }], expectedAnswer: 'b', targetConcept: 'Resistance and Ohm’s Law' },
      { id: `${plan.id}-assessment-3`, type: 'short_answer', prompt: assessmentPrompt(plan.language, 'Explain electric current in your own words.', 'Electric current ko apne words mein explain karo.', 'विद्युत धारा को अपने शब्दों में समझाइए।'), expectedAnswer: 'flow charge circuit', targetConcept: 'Electric charge and current' },
      { id: `${plan.id}-assessment-4`, type: 'mcq', prompt: 'Which equation represents Ohm’s Law?', choices: [{ id: 'a', text: 'V = I × R' }, { id: 'b', text: 'V = I + R' }, { id: 'c', text: 'R = V × I' }], expectedAnswer: 'a', targetConcept: 'Resistance and Ohm’s Law' },
      { id: `${plan.id}-assessment-5`, type: 'short_answer', prompt: 'Give one everyday example of a complete electric circuit.', expectedAnswer: 'battery wire bulb switch circuit', targetConcept: 'Applying ideas to a simple circuit' },
    ];
    return definitions.slice(0, count).map((question) => ({ ...assessmentQuestionSchema.parse(question), expectedAnswer: question.expectedAnswer, targetConcept: question.targetConcept }));
  }

  const newton = /newton|force|motion/i.test(plan.title);
  if (newton) {
    const definitions: AssessmentQuestionDefinition[] = [
      { id: `${plan.id}-assessment-1`, type: 'mcq', prompt: assessmentPrompt(plan.language, 'What does Newton’s First Law describe?', 'Newton ka First Law kya describe karta hai?', 'न्यूटन का पहला नियम क्या दर्शाता है?'), choices: [{ id: 'a', text: 'Inertia: an object resists changes to motion unless acted upon by a net force' }, { id: 'b', text: 'Force equals mass divided by acceleration' }, { id: 'c', text: 'Objects always accelerate without force' }], expectedAnswer: 'a', targetConcept: 'Newton’s First Law' },
      { id: `${plan.id}-assessment-2`, type: 'mcq', prompt: assessmentPrompt(plan.language, 'If force is doubled while mass remains constant, what happens to acceleration?', 'Force double ho aur mass constant rahe, toh acceleration par kya asar hoga?', 'यदि बल दोगुना हो और द्रव्यमान स्थिर रहे, तो त्वरण पर क्या प्रभाव पड़ेगा?'), choices: [{ id: 'a', text: 'It doubles (F = ma)' }, { id: 'b', text: 'It is cut in half' }, { id: 'c', text: 'It remains zero' }], expectedAnswer: 'a', targetConcept: 'Newton’s Second Law' },
      { id: `${plan.id}-assessment-3`, type: 'short_answer', prompt: assessmentPrompt(plan.language, 'Explain one everyday example of action and reaction (Newton’s Third Law).', 'Action aur reaction (Newton ke Third Law) ka ek real-world example explain karo.', 'क्रिया और प्रतिक्रिया (न्यूटन के तीसरे नियम) का एक उदाहरण समझाइए।'), expectedAnswer: 'rocket swim walk ground jump recoil boat push', targetConcept: 'Newton’s Third Law' },
    ];
    return definitions.slice(0, count).map((question) => ({ ...assessmentQuestionSchema.parse(question), expectedAnswer: question.expectedAnswer, targetConcept: question.targetConcept }));
  }

  return Array.from({ length: count }, (_, index) => {
    const segment = plan.segments[index % plan.segments.length]!;
    if (index === count - 1) return { id: `${plan.id}-assessment-${index + 1}`, type: 'short_answer' as const, prompt: `Explain ${segment.title} and give one practical example.`, expectedAnswer: segment.title, targetConcept: segment.title };
    const distractors = plan.segments.filter((item) => item.id !== segment.id).slice(0, 2).map((item, choiceIndex) => ({ id: choiceIndex === 0 ? 'b' : 'c', text: item.objective }));
    return { id: `${plan.id}-assessment-${index + 1}`, type: 'mcq' as const, prompt: `Which statement best explains ${segment.title}?`, choices: [{ id: 'a', text: segment.objective }, ...distractors], expectedAnswer: 'a', targetConcept: segment.title };
  });
}

/**
 * Builds assessment questions tailored dynamically to any lesson plan using AI.
 * Falls back deterministically if provider fails or is offline.
 */
export async function buildAssessmentWithAi(
  provider: AiProvider,
  plan: LessonPlan,
): Promise<AssessmentQuestionDefinition[]> {
  const count = plan.durationMinutes === 60 ? 5 : 3;
  const prompt = {
    instructions: `# Role
You are an expert assessment designer creating a ${count}-question quiz for a lesson on "${plan.title}".
Language: ${plan.language}

# Rules
- Build exactly ${count} questions covering the lesson segments.
- Include a mix of MCQ (with 3-4 plausible choices labeled a, b, c, d) and 1 conceptual short-answer question.
- Each question must specify the expectedAnswer and targetConcept.
- Match lesson language: ${plan.language} (English / Hindi / Hinglish).`,
    input: {
      lessonTitle: plan.title,
      language: plan.language,
      segments: plan.segments.map((s) => ({ title: s.title, objective: s.objective })),
      questionCount: count,
    },
  };

  try {
    const generated = await provider.generateStructured(aiGeneratedAssessmentSchema, prompt, {
      schemaName: 'lesson_assessment',
      schemaDescription: 'Dynamic multi-question assessment tailored to lesson content',
    });

    return generated.questions.slice(0, count).map((q, idx) => ({
      id: `${plan.id}-assessment-${idx + 1}`,
      type: q.type,
      prompt: q.prompt,
      choices: q.choices,
      expectedAnswer: q.expectedAnswer,
      targetConcept: q.targetConcept,
    }));
  } catch {
    return buildAssessment(plan);
  }
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
