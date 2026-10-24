import {
  responseEvaluationSchema,
  lessonAdaptationSchema,
  suggestVisualForTopic,
  type AdaptationStrategy,
  type CheckpointRubric,
  type LessonAdaptation,
  type LessonPlan,
  type ResponseEvaluation,
  type VisualInteractiveManifest,
} from '@edukriti/contracts';
import type { AiProvider } from '@edukriti/ai';
import {
  CONCEPT_KNOWLEDGE_GRAPH,
  resolveConceptGraph,
  type ConceptNode,
} from './concept-graph.ts';

export type CheckpointContext = {
  id: string;
  targetConcept: string;
  language: LessonPlan['language'];
  rubric?: CheckpointRubric;
  prerequisiteConcept?: string;
  remediationAttempt?: number;
};

/**
 * Finds or synthesizes a CheckpointRubric for a given target concept.
 */
export function findOrBuildRubric(context: CheckpointContext): CheckpointRubric {
  if (context.rubric) {
    return context.rubric;
  }

  const normalized = context.targetConcept.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  // Direct exact/fuzzy match against knowledge graph nodes
  const directNode = Object.values(CONCEPT_KNOWLEDGE_GRAPH).find((n) => {
    const cleanId = n.id.toLowerCase().replace(/_/g, ' ');
    const cleanName = n.conceptName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    return normalized.includes(cleanId) || normalized.includes(cleanName) || cleanName.includes(normalized);
  });

  const matchedNode = directNode || resolveConceptGraph(context.targetConcept, 1)[0];
  if (matchedNode) {
    return {
      checkpointId: context.id,
      targetConcept: matchedNode.conceptName,
      keyIdeas: matchedNode.applicationCheckpoint.keyIdeas,
      commonMisconceptions: matchedNode.commonMisconceptions,
      passingCriteria: matchedNode.applicationCheckpoint.passingCriteria,
    };
  }

  // Fallback synthetic rubric
  return {
    checkpointId: context.id,
    targetConcept: context.targetConcept,
    keyIdeas: [
      `Core defining mechanism of ${context.targetConcept}`,
      `Cause-and-effect relationship in ${context.targetConcept}`,
    ],
    commonMisconceptions: [
      {
        misconception: `Treating ${context.targetConcept} as an interchangeable or consumable quantity.`,
        triggerPatterns: ['used up', 'consumed', 'same as', 'always increases', 'disappears'],
        explanationCorrection: `Understand the conservation and governing principles of ${context.targetConcept}.`,
        recommendedStrategy: 'new_analogy',
      },
    ],
    passingCriteria: `Student must explain the core idea and avoid known misconceptions.`,
  };
}

/**
 * Localized feedback string generator.
 */
function buildLocalizedFeedback(
  language: LessonPlan['language'],
  isCorrect: boolean,
  concept: string,
  misconceptionText?: string | null,
  keyIdeasPresent: string[] = [],
): string {
  const acknowledgedPart = keyIdeasPresent.length > 0 ? keyIdeasPresent[0] : null;

  if (language === 'hindi') {
    if (isCorrect) {
      return `उत्कृष्ट! आपने “${concept}” का सिद्धांत सही रूप से समझाया है।`;
    }
    if (misconceptionText) {
      const partialNotice = acknowledgedPart ? `आपने सही पहचाना कि “${acknowledgedPart}”। ` : '';
      return `${partialNotice}परंतु यहाँ एक सामान्य भ्रम है: “${misconceptionText}”। आइए इसे एक नए उदाहरण से स्पष्ट करते हैं।`;
    }
    const partialNotice = acknowledgedPart ? `आपने सही पहचाना कि “${acknowledgedPart}”। ` : 'अच्छी कोशिश! ';
    return `${partialNotice}आपके उत्तर में “${concept}” के मुख्य संबंध अभी पूरी तरह स्पष्ट नहीं हैं। आइए इसे चरण-दर-चरण दोहराएं।`;
  }

  if (language === 'hinglish') {
    if (isCorrect) {
      return `Bilkul sahi! Aapne “${concept}” ka core principle accurately pakad liya.`;
    }
    if (misconceptionText) {
      const partialNotice = acknowledgedPart ? `Aapne sahi point pakda ki “${acknowledgedPart}”. ` : 'Good attempt! ';
      return `${partialNotice}Lekin yahan ek common confusion hai: “${misconceptionText}”. Let's clarify this with a new visual analogy.`;
    }
    const partialNotice = acknowledgedPart ? `Aapne sahi note kiya ki “${acknowledgedPart}”. ` : 'Good attempt! ';
    return `${partialNotice}“${concept}” ka main relationship abhi complete nahi lag raha. Chalo isse ek simpler angle se samjhte hain.`;
  }

  // English
  if (isCorrect) {
    return `Excellent! You clearly captured the essential principles of “${concept}”.`;
  }
  if (misconceptionText) {
    const partialNotice = acknowledgedPart ? `You correctly recognized that “${acknowledgedPart}”. ` : 'Good effort! ';
    return `${partialNotice}However, there is a common misconception here: “${misconceptionText}”. Let’s revisit this with a fresh perspective.`;
  }
  const partialNotice = acknowledgedPart ? `You correctly noted that “${acknowledgedPart}”. ` : 'Good try! ';
  return `${partialNotice}Your response does not yet connect the defining cause-and-effect relationship in “${concept}”. Let's walk through it together.`;
}

/**
 * Deterministic rubric-based checkpoint evaluator.
 * Evaluates learner answers against key ideas and common misconceptions without calling an LLM.
 */
export function evaluateCheckpointRubric(
  context: CheckpointContext,
  learnerResponse: string,
): ResponseEvaluation {
  const response = learnerResponse.trim();
  const lowerResponse = response.toLowerCase();
  const rubric = findOrBuildRubric(context);

  // 1. Detect common misconceptions
  let detectedMisconception: string | null = null;
  let recommendedStrategy: AdaptationStrategy = 'new_analogy';

  for (const mis of rubric.commonMisconceptions) {
    const isTriggered = mis.triggerPatterns.some((pattern) => {
      const lowerPat = pattern.toLowerCase();
      if (lowerResponse.includes(lowerPat)) return true;
      // Also check if stemmed words of the trigger pattern exist in the response
      const patWords = lowerPat.split(/\s+/).filter((w) => w.length >= 4);
      return (
        patWords.length >= 2 &&
        patWords.every((w) => {
          const stem = w.replace(/(ing|es|s|ed)$/, '');
          return lowerResponse.includes(stem);
        })
      );
    });

    if (isTriggered) {
      detectedMisconception = mis.misconception;
      recommendedStrategy = mis.recommendedStrategy;
      break;
    }
  }

  // Legacy fallback patterns for charge/current consumption
  if (!detectedMisconception && /current.{0,24}(used up|gets used|finish(?:es|ed)?|consumed)/i.test(response)) {
    detectedMisconception = 'The learner thinks electric current is consumed by a component instead of flowing around the complete circuit.';
    recommendedStrategy = 'new_analogy';
  }

  // 2. Check key ideas
  const keyIdeasPresent: string[] = [];
  const keyIdeasMissing: string[] = [];

  for (const idea of rubric.keyIdeas) {
    const keywords = idea
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    const matchesWordCount = keywords.filter((w) => lowerResponse.includes(w)).length;
    const isPresent = keywords.length > 0 && matchesWordCount >= Math.min(2, keywords.length);

    if (isPresent) {
      keyIdeasPresent.push(idea);
    } else {
      keyIdeasMissing.push(idea);
    }
  }

  // Also check if any significant concept words match
  const conceptWords = context.targetConcept.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const matchesConceptSignal = /pressure|push|flow|rate|oppose|resist|inertia|accelerat|force|reaction/i.test(response) ||
    conceptWords.some((w) => lowerResponse.includes(w));

  const wordCount = response.split(/\s+/).filter(Boolean).length;
  const hasSubstance = wordCount >= 3;
  const rubricScore = Math.round((keyIdeasPresent.length / Math.max(1, rubric.keyIdeas.length)) * 100);

  // Passing condition: substance + no misconception + at least 1 key idea or sufficient semantic signal
  const isCorrect = hasSubstance && !detectedMisconception && (keyIdeasPresent.length > 0 || matchesConceptSignal || rubricScore >= 50);

  const confidence = detectedMisconception ? 0.94 : isCorrect ? 0.88 : 0.72;
  const nextAction = isCorrect
    ? 'continue'
    : recommendedStrategy === 'new_analogy'
      ? 'new_analogy'
      : recommendedStrategy === 'simpler_prerequisite'
        ? 'simpler_prerequisite'
        : recommendedStrategy === 'worked_example'
          ? 'worked_example'
          : recommendedStrategy === 'visual_walkthrough'
            ? 'visual_walkthrough'
            : 'interactive';

  const feedback = buildLocalizedFeedback(
    context.language,
    isCorrect,
    context.targetConcept,
    detectedMisconception,
    keyIdeasPresent,
  );

  return responseEvaluationSchema.parse({
    checkpointId: context.id,
    isCorrect,
    confidence,
    understoodConcepts: isCorrect ? [context.targetConcept] : [],
    misconception: detectedMisconception,
    feedback,
    nextAction,
    rubricScore,
    missingKeyIdeas: keyIdeasMissing,
    detectedMisconceptions: detectedMisconception ? [detectedMisconception] : [],
  });
}

/**
 * AI-powered checkpoint evaluator with rubric guidance.
 * Falls back deterministically to evaluateCheckpointRubric if the provider fails.
 */
export async function evaluateCheckpointWithAi(
  provider: AiProvider,
  context: CheckpointContext,
  learnerResponse: string,
): Promise<ResponseEvaluation> {
  const rubric = findOrBuildRubric(context);

  const prompt = {
    instructions: `# Role
You are an expert pedagogical grader evaluating a student's answer to an in-lesson checkpoint.
Target Concept: "${context.targetConcept}"
Language: ${context.language}

# Checkpoint Rubric
- Target Concept: ${rubric.targetConcept}
- Key Ideas to identify:
${rubric.keyIdeas.map((idea, i) => `  ${i + 1}. ${idea}`).join('\n')}
- Common Misconceptions to diagnose:
${rubric.commonMisconceptions.map((m, i) => `  ${i + 1}. [${m.recommendedStrategy}] ${m.misconception} (Correction: ${m.explanationCorrection})`).join('\n')}
- Passing Criteria: ${rubric.passingCriteria}

# Grading Rules
1. Conceptual Evaluation: Do not demand exact words; reward valid analogies, intuition, and reasoning.
2. Misconception Detection: If the student falls into one of the listed misconceptions, explicitly tag it and recommend the matching pedagogical strategy ('new_analogy' | 'worked_example' | 'simpler_prerequisite' | 'visual_walkthrough' | 'interactive').
3. Feedback: Provide kind, encouraging, constructive feedback strictly in ${context.language}. If incorrect, highlight what was missing and give a warm correction.
4. Next Action: If correct, set 'continue'. If incorrect, set appropriate remedial action.`,
    input: {
      targetConcept: context.targetConcept,
      learnerResponse,
      language: context.language,
      rubric,
    },
  };

  try {
    const evaluation = await provider.generateStructured(responseEvaluationSchema, prompt, {
      schemaName: 'rubric_checkpoint_evaluation',
      schemaDescription: 'Semantic assessment of student response against a concept rubric',
    });

    return responseEvaluationSchema.parse({
      ...evaluation,
      checkpointId: context.id,
    });
  } catch {
    return evaluateCheckpointRubric(context, learnerResponse);
  }
}

/**
 * Adaptive Re-teaching v2:
 * Generates an adaptive re-teaching payload selecting among 5 pedagogical strategies:
 * 1. new_analogy
 * 2. worked_example
 * 3. simpler_prerequisite
 * 4. visual_walkthrough
 * 5. interactive
 *
 * Tracks remediation attempt and logs wasEffective for closed-loop adaptation.
 */
export function buildAdaptationV2(
  context: CheckpointContext,
  evaluation: ResponseEvaluation,
  attempt = 1,
): LessonAdaptation | null {
  if (evaluation.isCorrect) return null;

  const concept = context.targetConcept;
  const rubric = findOrBuildRubric(context);
  const nodes = resolveConceptGraph(concept, 2);
  const node = nodes[0];
  let prereqNode = nodes[1];
  if (!prereqNode && node?.prerequisites?.length) {
    for (const pid of node.prerequisites) {
      if (CONCEPT_KNOWLEDGE_GRAPH[pid]) {
        prereqNode = CONCEPT_KNOWLEDGE_GRAPH[pid];
        break;
      }
    }
  }

  // Strategy selection: use nextAction from evaluation or fallback to new_analogy
  let strategy: AdaptationStrategy = (evaluation.nextAction !== 'continue' ? evaluation.nextAction : 'new_analogy') as AdaptationStrategy;
  if (attempt >= 3 && prereqNode) {
    strategy = 'simpler_prerequisite';
  } else if (attempt === 2 && strategy === 'new_analogy') {
    strategy = 'worked_example';
  }

  const langKey = context.language === 'hindi' ? 'hindi' : context.language === 'hinglish' ? 'hinglish' : 'english';

  let explanation = '';
  let replacementInteractive: VisualInteractiveManifest | undefined;
  let remediationAction = '';

  switch (strategy) {
    case 'worked_example':
      if (context.language === 'hindi') {
        explanation = `आइए एक उदाहरण हल करके देखते हैं: यदि हम किसी परिपथ में 12V की बैटरी से 4Ω का प्रतिरोध जोड़ते हैं, तो धारा I = V / R = 12 / 4 = 3 एम्पीयर होगी। यहाँ आवेश नष्ट नहीं होता, केवल ऊर्जा का रूपांतरण होता है।`;
      } else if (context.language === 'hinglish') {
        explanation = `Chalo ek concrete calculation dekhte hain: Agar 12V ki battery se 4 ohm resistor connect karein, toh current I = V / R = 12 / 4 = 3 A hoga. Resistor current ko consume nahi karta, bas flow rate ko limit karta hai.`;
      } else {
        explanation = `Let’s walk through a concrete example: If a 12V battery is connected to a 4Ω resistor, the current is I = V / R = 12 / 4 = 3 A. The resistor limits the flow rate but zero charge is consumed.`;
      }
      remediationAction = 'Try calculating the current if the resistor is changed to 6Ω.';
      break;

    case 'simpler_prerequisite':
      const prereqName = prereqNode ? prereqNode.conceptName : 'Foundational concepts';
      const prereqAnalogy = prereqNode?.analogy?.[langKey];
      const analogyNote = prereqAnalogy ? ` Key intuition: ${prereqAnalogy}.` : '';
      if (prereqNode?.suggestedVisualId) {
        replacementInteractive = suggestVisualForTopic(prereqNode.conceptName, prereqNode.suggestedVisualId);
      }
      if (context.language === 'hindi') {
        const hiNote = prereqAnalogy ? ` मुख्य दृष्टि: ${prereqAnalogy} ` : ' ';
        explanation = `इस अवधारणा को पूरी तरह समझने से पहले, आइए इसके पूर्व-आवश्यक आधार “${prereqName}” को संक्षिप्त में दोहराएं।${hiNote}जब तक मूल आधार स्पष्ट न हो, आगे का संबंध समझना कठिन होता है।`;
      } else if (context.language === 'hinglish') {
        const hingNote = prereqAnalogy ? ` Quick intuition: ${prereqAnalogy} ` : ' ';
        explanation = `Is concept ko master karne se pehle, chalo iske prerequisite “${prereqName}” ko quickly recap karte hain.${hingNote}Ek baar base clear ho jaye toh aage sab click ho jayega.`;
      } else {
        explanation = `Before moving ahead with this concept, let’s quickly review its foundational prerequisite: “${prereqName}”.${analogyNote} When the core foundation is rock-solid, this relationship becomes clear.`;
      }
      remediationAction = `Review ${prereqName} before re-attempting this checkpoint.`;
      break;

    case 'visual_walkthrough':
      if (context.language === 'hindi') {
        explanation = `आइए इस चित्र के मुख्य बिंदुओं पर ध्यान केंद्रित करें: देखिए कि कैसे इनपुट से आउटपुट तक ऊर्जा का प्रवाह निरंतर बना रहता है।`;
      } else if (context.language === 'hinglish') {
        explanation = `Diagram ke key indicators dekho: observe karo kaise charges closed loop mein continuously circulate karte hain bina ruke ya khatam hue.`;
      } else {
        explanation = `Look closely at the diagram indicators: observe how charge continuously circulates around the entire closed loop without being consumed at any point.`;
      }
      remediationAction = 'Trace the flow path in the diagram from the positive terminal back to the negative terminal.';
      break;

    case 'interactive':
      replacementInteractive = suggestVisualForTopic(concept, node?.suggestedVisualId);
      if (context.language === 'hindi') {
        explanation = `सिद्धांत को शब्दों में पढ़ने के बजाय, आइए इसे इंटरैक्टिव सिमुलेटर में स्वयं चलाकर देखें! स्लाइडर को बदलें और वास्तविक प्रभाव को लाइव मापें।`;
      } else if (context.language === 'hinglish') {
        explanation = `Theory padhne ke bajaye, chalo isse live interactive simulation mein test karte hain! Slider adjust karo aur values live change hote dekho.`;
      } else {
        explanation = `Instead of reading theory, let’s test this live in the interactive simulation! Adjust the sliders and observe the real-time effect on measurements.`;
      }
      remediationAction = 'Move the slider in the interactive simulation and record the live reading.';
      break;

    case 'new_analogy':
    default:
      if (node) {
        explanation = node.analogy[langKey];
      } else if (context.language === 'hindi') {
        explanation = `इसे एक पाइप और पानी के पंप की तरह सोचिए: पंप (वोल्टेज) पानी को आगे धकेलता है, पाइप का संकरापन (प्रतिरोध) प्रवाह को धीमा करता है, और प्रति सेकंड बहने वाला पानी (करंट) है।`;
      } else if (context.language === 'hinglish') {
        explanation = `Isko water pipe system ki tarah socho: pump ka pressure voltage hai, pipe ki narrowness resistance hai, aur per-second flow rate current hai.`;
      } else {
        explanation = `Imagine a closed water circuit: the water pump is voltage, the narrow constriction is resistance, and the gallons flowing per second is electric current.`;
      }
      remediationAction = 'Reflect on this analogy and rephrase your answer using your own words.';
      break;
  }

  return lessonAdaptationSchema.parse({
    strategy,
    title: `${concept}, explained another way`,
    explanation,
    visualType: 'diagram',
    visualBrief: `Show an adaptive remediation visual for ${concept} using ${strategy}.`,
    interactive: replacementInteractive,
    wasEffective: undefined,
    remediationAttempt: attempt,
    remediationAction,
  });
}
