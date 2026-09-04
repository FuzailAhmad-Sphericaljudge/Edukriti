import { assessmentAttemptResponseSchema, assessmentQuestionSchema, learningReportSchema, lessonAdaptationSchema, responseEvaluationSchema, lessonPlanSchema, type AssessmentAttemptResponse, type AssessmentQuestion, type LearningReport, type LessonAdaptation, type LessonPlan, type LessonRequest, type ResponseEvaluation } from '@edukriti/contracts';

export type LessonEvidence = {
  sourceId: string;
  chunkId: string;
  page: number;
  text: string;
};

const topicSequences: Array<{ pattern: RegExp; concepts: string[] }> = [
  { pattern: /electric|circuit|ohm|voltage|current|resistance/i, concepts: ['Electric charge and current', 'Voltage as the driving force', 'Resistance and Ohm’s Law', 'Applying ideas to a simple circuit', 'Practice and reflection', 'Challenge problem'] },
  { pattern: /newton|force|motion/i, concepts: ['Motion and force', 'Newton’s First Law', 'Newton’s Second Law', 'Newton’s Third Law', 'Everyday applications', 'Challenge problem'] },
  { pattern: /react|component|jsx/i, concepts: ['The component model', 'JSX and rendering', 'Props and data flow', 'State and interaction', 'Building a small feature', 'Interview practice'] },
  { pattern: /artificial intelligence|machine learning|\bai\b/i, concepts: ['What makes a system intelligent', 'Data, models, and learning', 'Training and inference', 'Common AI applications', 'Limits and responsible use', 'Next learning steps'] },
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

export function lessonMinutes(plan: LessonPlan) {
  return plan.segments.reduce((total, segment) => total + segment.estimatedMinutes, 0);
}

export function speechLocale(language: LessonPlan['language']) {
  return language === 'hindi' ? 'hi-IN' : 'en-IN';
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

export type AssessmentQuestionDefinition = AssessmentQuestion & {
  expectedAnswer: string;
  targetConcept: string;
};

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

  return Array.from({ length: count }, (_, index) => {
    const segment = plan.segments[index % plan.segments.length]!;
    if (index === count - 1) return { id: `${plan.id}-assessment-${index + 1}`, type: 'short_answer' as const, prompt: `Explain ${segment.title} and give one practical example.`, expectedAnswer: segment.title, targetConcept: segment.title };
    const distractors = plan.segments.filter((item) => item.id !== segment.id).slice(0, 2).map((item, choiceIndex) => ({ id: choiceIndex === 0 ? 'b' : 'c', text: item.objective }));
    return { id: `${plan.id}-assessment-${index + 1}`, type: 'mcq' as const, prompt: `Which statement best explains ${segment.title}?`, choices: [{ id: 'a', text: segment.objective }, ...distractors], expectedAnswer: 'a', targetConcept: segment.title };
  });
}

export function evaluateAssessmentAnswer(plan: LessonPlan, question: AssessmentQuestionDefinition, learnerResponse: string, attemptId: string, attemptedAt = new Date().toISOString()): AssessmentAttemptResponse {
  const semanticEvaluation = question.type === 'short_answer' ? evaluateCheckpoint({ id: question.id, targetConcept: question.targetConcept, language: plan.language }, learnerResponse) : null;
  const isCorrect = question.type === 'mcq' ? learnerResponse === question.expectedAnswer : Boolean(semanticEvaluation?.isCorrect);
  const feedback = isCorrect
    ? assessmentPrompt(plan.language, 'Correct — that shows a clear understanding.', 'Bilkul sahi — concept clear hai.', 'सही उत्तर — अवधारणा स्पष्ट है।')
    : semanticEvaluation?.feedback ?? assessmentPrompt(plan.language, 'Not quite. Review this concept in the lesson report.', 'Not quite. Is concept ko report mein revise karein.', 'यह सही नहीं है। रिपोर्ट में इस अवधारणा को दोहराएँ।');
  return assessmentAttemptResponseSchema.parse({ attemptId, questionId: question.id, isCorrect, feedback, understoodConcepts: isCorrect ? [question.targetConcept] : [], weakConcepts: isCorrect ? [] : [question.targetConcept], misconception: semanticEvaluation?.misconception ?? null, attemptedAt });
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
