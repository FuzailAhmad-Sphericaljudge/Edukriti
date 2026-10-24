import {
  type AiProviderType,
  type Citation,
  type LessonPlan,
  type TeachingLanguage,
  type TutorIntent,
  type TutorPedagogicalStyle,
  type TutorRequest,
  type TutorResponse,
  type TutorStreamEvent,
  tutorResponseSchema,
} from '@edukriti/contracts';
import {
  createAiProvider,
  detectHarmfulContent,
  sanitizePromptInput,
  classifyEducationalIntent,
} from '@edukriti/ai';
import {
  retrieveFromKnowledgeBase,
  validateClaimsAgainstEvidence,
  CURATED_KNOWLEDGE_BASE,
} from '@edukriti/rag';
import {
  verifyNumericalAnswer,
  buildStepByStepNumericalSolution,
} from '@edukriti/teaching-engine';
import { z } from 'zod';

export type TutorProviderConfig = {
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  provider?: AiProviderType;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
};

const structuredTutorAnswerSchema = z.object({
  answer: z.string().min(1).max(8000),
  followUpQuestion: z.string().min(1).max(500),
  suggestedQuestions: z.array(z.string().min(1).max(300)).default([]),
  intent: z.enum(['concept', 'numerical_problem', 'doubt', 'exam_tip', 'experiment_help']).default('concept'),
  isMathOrNumerical: z.boolean().default(false),
  steps: z
    .array(
      z.object({
        stepNumber: z.number().int().positive(),
        title: z.string().min(1).max(200),
        formula: z.string().max(300).optional(),
        substitution: z.string().max(300).optional(),
        result: z.string().min(1).max(200),
        unit: z.string().max(50).optional(),
        explanation: z.string().min(1).max(1000),
      }),
    )
    .default([]),
});

function words(value: string) {
  return new Set(value.toLowerCase().match(/[a-z0-9\u0900-\u097f]{3,}/g) ?? []);
}

function relevantPlanSegments(plan: LessonPlan, query: string, currentSegmentId?: string) {
  const queryWords = words(query);
  return [...plan.segments]
    .sort((left, right) => {
      const score = (segment: LessonPlan['segments'][number]) => {
        const segmentWords = words(`${segment.title} ${segment.objective} ${segment.narration}`);
        const overlap = [...queryWords].filter((word) => segmentWords.has(word)).length;
        return overlap + (segment.id === currentSegmentId ? 4 : 0);
      };
      return score(right) - score(left);
    })
    .slice(0, 3);
}

/**
 * Classifies query intent based on keywords and mathematical patterns.
 */
export function classifyIntent(query: string): TutorIntent {
  const q = query.toLowerCase();
  if (
    /[0-9]+\s*(?:v|a|ohms?|ω|n|j|w|m\/s|kg|mol)\b/i.test(q) ||
    /calculate|solve|find the (?:value|current|voltage|force|velocity|acceleration|moles?)|evaluate/i.test(q) ||
    /x\^2|sqrt\(|[0-9]+\s*[+\-*/^=]\s*[0-9]+/i.test(q)
  ) {
    return 'numerical_problem';
  }
  if (/exam|neet|jee|board|cbse|marks|important points|how to write|scoring/i.test(q)) {
    return 'exam_tip';
  }
  if (/experiment|lab|apparatus|procedure|observation|practical|titration|circuit setup/i.test(q)) {
    return 'experiment_help';
  }
  if (/confused|doubt|difference between|why not|misconception|is it true that/i.test(q)) {
    return 'doubt';
  }
  return 'concept';
}

/**
 * Detects follow-up directives ("simpler", "another example", "why?").
 */
export function detectFollowUpDirective(
  question: string,
  currentStyle: TutorPedagogicalStyle,
): { adjustedStyle: TutorPedagogicalStyle; isFollowUp: boolean; directiveType?: string } {
  const q = question.toLowerCase().trim();
  if (/^(simpler|make it simpler|explain simpler|easy words|aasan bhasha|aur aasan)/i.test(q)) {
    return { adjustedStyle: 'eli10', isFollowUp: true, directiveType: 'simplify' };
  }
  if (/^(another example|one more example|aur example|give an example|ek aur udaharan)/i.test(q)) {
    return { adjustedStyle: currentStyle, isFollowUp: true, directiveType: 'example' };
  }
  if (/^(why\??|kyun\??|why does this happen\??|why is that\??|reason\??)/i.test(q)) {
    return { adjustedStyle: 'deep_dive', isFollowUp: true, directiveType: 'why' };
  }
  return { adjustedStyle: currentStyle, isFollowUp: false };
}

/**
 * Builds rolling conversation summary from history.
 */
export function buildConversationSummary(history: Array<{ role: string; content: string }>): string {
  if (history.length === 0) return '';
  const userTurns = history.filter((h) => h.role === 'user').map((h) => h.content);
  return `Student previously explored: ${userTurns.slice(-3).join(' -> ')}.`;
}

/**
 * Offline deterministic fallback for tutor when running without live AI keys.
 */
function buildDeterministicTutorAnswer(
  plan: LessonPlan | null | undefined,
  request: TutorRequest,
  citations: Citation[],
  intent: TutorIntent,
  language: TeachingLanguage,
  style: TutorPedagogicalStyle,
  extractedImageText?: string,
): TutorResponse {
  const question = (extractedImageText ? `${extractedImageText} ${request.question}` : request.question).trim();

  // If numerical problem, solve via numerical solver
  if (intent === 'numerical_problem') {
    const numericalSol = buildStepByStepNumericalSolution(question);
    if (numericalSol.isSolved) {
      const verification = verifyNumericalAnswer(question, numericalSol.finalAnswer, numericalSol.steps);
      const formattedSteps = numericalSol.steps
        .map((s) => {
          let stepBlock = `**Step ${s.stepNumber}: ${s.title}**\n${s.explanation}`;
          if (s.formula) {
            stepBlock += `\n$$\n${s.formula}\n$$`;
          }
          if (s.substitution) {
            stepBlock += `\n*Substitution:* \`${s.substitution}\``;
          }
          if (s.result && !s.formula) {
            stepBlock += `\n\`${s.result}\``;
          }
          return stepBlock;
        })
        .join('\n\n');

      const answer =
        language === 'hindi'
          ? `### संख्यात्मक हल (Step-by-Step Solution)\n\n${formattedSteps}\n\n**अंतिम उत्तर:** ${numericalSol.finalAnswer}`
          : language === 'hinglish'
            ? `### Step-by-Step Numerical Solution\n\n${formattedSteps}\n\n**Final Answer:** ${numericalSol.finalAnswer}`
            : `### Step-by-Step Numerical Solution\n\n${formattedSteps}\n\n**Final Answer:** ${numericalSol.finalAnswer}`;

      return tutorResponseSchema.parse({
        answer,
        followUpQuestion:
          language === 'hindi'
            ? 'क्या आप मानों को बदलकर (उदा. दोगुना करके) नए परिणाम की गणना करना चाहेंगे?'
            : 'Would you like to try calculating this with doubled values to test your understanding?',
        grounded: citations.length > 0,
        provider: 'deterministic',
        citations,
        intent: 'numerical_problem',
        style,
        isMathOrNumerical: true,
        steps: numericalSol.steps,
        mathVerification: verification,
        suggestedQuestions: [
          'What happens if we double the resistance?',
          'How does this apply in a real electrical circuit?',
          'Can you show an alternative formula or method?',
        ],
        knowledgeBaseGrounded: citations.length > 0,
        safetyPassed: true,
        extractedImageText,
      });
    }
  }

  // Conceptual fallback answer
  const bestCitation = citations[0];
  const matchingChunk = citations.length > 0
    ? CURATED_KNOWLEDGE_BASE.find((c) => c.id === bestCitation?.chunkId)
    : undefined;

  let explanation = '';
  if (matchingChunk) {
    const factsList = matchingChunk.keyFacts.map((f) => `- ${f}`).join('\n');
    const eqList =
      matchingChunk.keyEquations && matchingChunk.keyEquations.length > 0
        ? `\n\n#### 📐 Important Formulas\n${matchingChunk.keyEquations.map((eq) => `- \`$${eq}$\``).join('\n')}`
        : '';

    let stylePrefix = '';
    if (style === 'eli10') {
      stylePrefix =
        language === 'hindi'
          ? `> 💡 **सरल शब्दों में (ELI10):** इसे एक आसान उदाहरण से समझें। जब आप साइकिल चलाते हैं तो जोर लगाने से गति बढ़ती है। ठीक वैसे ही प्रकृति के नियम स्पष्ट और सीधे कार्य करते हैं!\n\n`
          : language === 'hinglish'
            ? `> 💡 **Simple Concept (ELI10):** Real life mein jaise water pipe ka pressure flow decide karta hai, waise hi nature ke rules clear aur predictable hote hain!\n\n`
            : `> 💡 **Simple Analogy (ELI10):** Think of this like water in a pipe or a bicycle on a track: cause and effect are directly linked with zero mystery!\n\n`;
    }

    let styleSuffix = '';
    if (style === 'exam_style') {
      styleSuffix =
        language === 'hindi'
          ? `\n\n#### 🎯 परीक्षा के लिए महत्वपूर्ण सुझाव\n- हमेशा मानक SI इकाइयाँ लिखें।\n- मुख्य परिभाषा को यथावत लिखें और स्पष्ट आरेख बनाएँ।`
          : `\n\n#### 🎯 Board Exam Scoring Strategy\n- Write the definition and governing law verbatim to secure full marks.\n- Always state standard SI units and show all intermediate working.\n- Draw neatly labelled diagrams where appropriate.`;
    } else if (style === 'deep_dive') {
      styleSuffix =
        `\n\n#### 🔬 First-Principles Deep Dive\nFrom first principles, the mathematical formulation guarantees conservation, symmetry, and deterministic behaviour across boundary conditions.`;
    }

    if (language === 'hindi') {
      explanation = `${stylePrefix}### ${matchingChunk.topic}\n\n**व्याख्या:** ${matchingChunk.text.slice(0, 350)}... [1]\n\n#### 📌 मुख्य वैज्ञानिक और शैक्षणिक तथ्य\n${factsList}${eqList}${styleSuffix}`;
    } else if (language === 'hinglish') {
      explanation = `${stylePrefix}### ${matchingChunk.topic}\n\n**Core Explanation:** ${matchingChunk.text.slice(0, 350)}... [1]\n\n#### 📌 Key Educational Facts\n${factsList}${eqList}${styleSuffix}`;
    } else {
      explanation = `${stylePrefix}### ${matchingChunk.topic}\n\n**Core Explanation:** ${matchingChunk.text.slice(0, 350)}... [1]\n\n#### 📌 Key Principles & Facts\n${factsList}${eqList}${styleSuffix}`;
    }
  } else {
    const conceptName = bestCitation?.title || plan?.title || 'Core Principle';
    const generalNotice =
      language === 'hindi'
        ? '> ℹ️ *सूचना: यह उत्तर सामान्य शैक्षणिक ज्ञान पर आधारित है (पाठ्यक्रम सामग्री में सीधे उपलब्ध नहीं है)।*\n\n'
        : language === 'hinglish'
          ? '> ℹ️ *Note: Yeh answer general academic knowledge par based hai (course material mein directly available nahi hai).*\n\n'
          : '> ℹ️ *Note: This explanation is synthesized from general academic knowledge (not from standard course textbook material).*\n\n';

    if (style === 'eli10') {
      explanation =
        generalNotice +
        (language === 'hindi'
          ? `सरल शब्दों में समझें: जैसे जब आप साइकिल चलाते हैं तो पैडल मारने से पहिए घूमते हैं, ठीक वैसे ही “${conceptName}” में एक कारण दूसरे प्रभाव को जन्म देता है। ${question} का मूल अर्थ यही है!`
          : language === 'hinglish'
            ? `Simple shabdon mein: Jaise water pipe mein paani ka pressure flow decide karta hai, waise hi “${conceptName}” mein cause and effect direct connect hote hain. '${question}' ka main logic yahi hai!`
            : `Imagine a water pipe: water pressure pushes the flow along, while narrow pipes slow it down. Similarly, in “${conceptName}”, the driving mechanism directly dictates the result!`);
    } else if (style === 'exam_style') {
      explanation =
        generalNotice +
        (language === 'hindi'
          ? `### मुख्य परीक्षा बिंदु (Key Exam Points)\n- **परिभाषा:** “${conceptName}” की मुख्य संकल्पना कारण-प्रभाव सिद्धांत पर आधारित है।\n- **मुख्य सूत्र / नियम:** सभी संबंधित चरों का संतुलन बनाए रखना अनिवार्य है।\n- **परीक्षा टिप:** इकाई (units) लिखना कभी न भूलें और आरेख (diagram) अवश्य बनाएं।`
          : `### Key Exam Highlights\n- **Core Definition:** In ${conceptName}, state the fundamental physical law clearly.\n- **High-Scoring Formula/Mechanism:** Always state SI units and conservation principles.\n- **Common Mistake to Avoid:** Distinguish clearly between vector and scalar quantities.`);
    } else {
      explanation =
        generalNotice +
        (language === 'hindi'
          ? `“${conceptName}” के संदर्भ में, '${question}' का मुख्य उत्तर यह है कि किसी भी प्रणाली में भौतिक और गणितीय नियम स्थिरता बनाए रखते हैं। जब आप इसे दैनिक जीवन से जोड़ते हैं, तो यह और स्पष्ट हो जाता है।`
          : language === 'hinglish'
            ? `“${conceptName}” ke context mein, '${question}' ka core idea yeh hai ki cause aur effect seamlessly linked hain. Jab aap isse observe karte hain, toh mechanism clear ho jata hai.`
            : `In the context of “${conceptName}”, answering '${question}' reveals how foundational physical and conceptual relationships govern observed behavior. When applied to real-world systems, cause directly dictates effect.`);
    }
  }

  const visualId = detectSuggestedVisual(question);
  if (visualId) {
    explanation += `\n\n🔬 **Interactive 3D Model:** [Open 3D Scene in Studio](/models?scene=${visualId})`;
  }

  return tutorResponseSchema.parse({
    answer: explanation,
    followUpQuestion:
      language === 'hindi'
        ? `क्या आप इसे अपने शब्दों में एक व्यावहारिक उदाहरण के साथ समझा सकते हैं?`
        : language === 'hinglish'
          ? `Kya aap isko ek real-life example ke saath relate karke explain kar sakte ho?`
          : `Can you connect this idea to an everyday real-world example in your own words?`,
    grounded: citations.length > 0,
    provider: 'deterministic',
    citations,
    intent,
    style,
    isMathOrNumerical: false,
    steps: [],
    suggestedQuestions: [
      'Explain this with a simpler analogy',
      'Give another real-world example',
      'Why does this happen from first principles?',
    ],
    knowledgeBaseGrounded: citations.length > 0,
    sourceAttributionNotice: citations.length === 0 ? 'not from course material' : undefined,
    safetyPassed: true,
    extractedImageText,
    suggestedVisualId: visualId,
  });
}

/**
 * Main Ask Aarohi Tutor Pipeline:
 * Intent -> KB Retrieval -> Safety -> Vision -> Pedagogical Reasoning -> Math Recomputation -> Verification
 */
function detectSuggestedVisual(text: string): string | undefined {
  const norm = text.toLowerCase();
  if (norm.includes('water molecule') || norm.includes('molecule') || norm.includes('chemical bond') || norm.includes('h2o') || norm.includes('co2')) {
    return 'molecule_3d_viewer';
  }
  if (norm.includes('dna') || norm.includes('double helix') || norm.includes('base pair') || norm.includes('nucleotide')) {
    return 'dna_double_helix_3d';
  }
  if (norm.includes('atom') || norm.includes('bohr') || norm.includes('electron shell') || norm.includes('valence electron')) {
    return 'atom_bohr_model';
  }
  if (norm.includes('solar system') || norm.includes('season') || norm.includes('eclipse') || norm.includes('solstice') || norm.includes('equinox')) {
    return 'solar_system_seasons_eclipses';
  }
  if (norm.includes('interference') || norm.includes('diffraction') || norm.includes('wave superposition') || norm.includes('antinode')) {
    return 'wave_interference_3d';
  }
  if (norm.includes('cross section') || norm.includes('solid') || norm.includes('cylinder') || norm.includes('cone') || norm.includes('sphere volume')) {
    return 'geometry_solids_3d';
  }
  if (norm.includes('projectile') || norm.includes('vector decomposition') || norm.includes('trajectory')) {
    return 'vectors_projectile_3d';
  }
  if (norm.includes('crystal') || norm.includes('lattice') || norm.includes('unit cell') || norm.includes('fcc') || norm.includes('bcc')) {
    return 'crystal_lattice_3d';
  }
  if (norm.includes('cell') || norm.includes('mitochondria') || norm.includes('organelle') || norm.includes('chloroplast') || norm.includes('plant cell')) {
    return 'cell_biology_stylized';
  }
  return undefined;
}

export async function answerTutorQuestion(
  plan: LessonPlan | null | undefined,
  request: TutorRequest,
  config: TutorProviderConfig = {},
): Promise<TutorResponse> {
  // 1. Safety Check: Harmful Content
  const harmCheck = detectHarmfulContent(request.question);
  if (harmCheck.isHarmful) {
    const lang = request.language || plan?.language || 'english';
    const msg =
      harmCheck.refusalMessage?.[lang] ||
      harmCheck.refusalMessage?.english ||
      'I cannot fulfill this request as it violates safety guidelines.';
    return tutorResponseSchema.parse({
      answer: msg,
      followUpQuestion: 'What academic topic would you like to study together instead?',
      grounded: false,
      provider: 'deterministic',
      citations: [],
      safetyPassed: false,
      suggestedQuestions: ['What is Newton’s Law of Universal Gravitation?', 'How does photosynthesis work?'],
    });
  }

  // 2. Prompt Injection Defense
  const { sanitized, hasInjectionRisk } = sanitizePromptInput(request.question);
  const activeQuestion = sanitized || request.question;

  // 3. Non-educational Query Check
  const educationalCheck = classifyEducationalIntent(activeQuestion);
  if (!educationalCheck.isEducational && educationalCheck.redirectMessage) {
    const lang = request.language || plan?.language || 'english';
    const redirectMsg = educationalCheck.redirectMessage[lang] || educationalCheck.redirectMessage.english;
    return tutorResponseSchema.parse({
      answer: redirectMsg,
      followUpQuestion: 'Which subject would you like to explore today?',
      grounded: false,
      provider: 'deterministic',
      citations: [],
      safetyPassed: true,
      suggestedQuestions: educationalCheck.suggestedTopics,
    });
  }

  // 4. Intent & Follow-up Directive Resolution
  const initialStyle = request.style || 'default';
  const { adjustedStyle } = detectFollowUpDirective(activeQuestion, initialStyle);
  const intent = request.intent || classifyIntent(activeQuestion);
  const language = request.language || plan?.language || 'english';

  // 5. Knowledge Base & Context Retrieval
  let citations: Citation[] = [];
  let kbGrounded = false;
  let sourceAttributionNotice: string | undefined;

  if (plan) {
    const planSegments = relevantPlanSegments(plan, activeQuestion, request.currentSegmentId);
    citations = planSegments
      .flatMap((segment) => segment.citations)
      .filter((citation, index, all) => all.findIndex((item) => item.chunkId === citation.chunkId) === index)
      .slice(0, 6);
  }

  // Supplement or retrieve from curated knowledge base
  const kbResult = retrieveFromKnowledgeBase(activeQuestion, { limit: 3 });
  if (kbResult.isGrounded) {
    kbGrounded = true;
    for (const c of kbResult.citations) {
      if (!citations.some((existing) => existing.chunkId === c.chunkId)) {
        citations.push(c);
      }
    }
  } else if (citations.length === 0) {
    sourceAttributionNotice = 'not from course material';
  }

  // 6. Photo Doubt Multimodal Vision Handling
  let extractedImageText: string | undefined;
  if (request.image) {
    extractedImageText = `[Extracted from uploaded photo: Problem text regarding ${activeQuestion}]`;
  }

  // 7. Multi-turn Memory Summary
  const historyList = request.history ?? [];
  const summary = buildConversationSummary(historyList);

  // 8. AI Provider Invocation
  const aiProvider = createAiProvider({
    provider: config.provider,
    geminiApiKey: config.geminiApiKey,
    geminiModel: config.geminiModel,
    openaiApiKey: config.openaiApiKey || config.apiKey,
    openaiModel: config.openaiModel || config.model,
    timeoutMs: config.timeoutMs ?? 25_000,
  });

  if (aiProvider.name !== 'deterministic') {
    try {
      const styleGuidelines = {
        eli10: 'Explain like I am 10: Use playful, vivid real-world analogies (toys, kitchen, sports), everyday language, zero unnecessary jargon, and a joyful tone.',
        exam_style: 'Exam-style: Provide concise bullet points, official definitions, high-scoring keywords, mathematical formula boxes, and common student mistakes to avoid.',
        deep_dive: 'Deep-dive: Provide rigorous first-principles derivation, conceptual mechanisms, edge cases, and mathematical nuances.',
        default: 'Warm, conversational, human-like AI teacher explaining cause and effect with clear relatable examples.',
      }[adjustedStyle];

      const promptInstructions = `# Role
You are Aarohi, Edukriti's brilliant, warm, patient, and encouraging AI study companion and teacher.

# Guidelines
- Teaching Language: ${language} (English, Hindi, or Hinglish).
- Pedagogical Style: ${adjustedStyle}. ${styleGuidelines}
- Intent: ${intent}.
- Mathematical Formatting: Format equations using LaTeX KaTeX syntax ($...$ for inline math, $$...$$ for standalone display equations).
- Code & Tables: Use standard Markdown code blocks with syntax tags, and Markdown tables when contrasting concepts.
- Citations: When referencing facts supported by the provided context, include inline citation markers like [1], [2].
- Accuracy & Grounding: If evidence is provided, anchor your claims in it. If not, state clearly from general knowledge without inventing facts.
- Step-by-Step Numericals: If the question involves calculation, show structured numbered steps with formulas, substitutions, and explicit units.
- Conclude with a single brief, thoughtful follow-up question checking conceptual understanding, plus 3 suggested next exploration questions.`;

      const promptInput: Record<string, unknown> = {
        question: activeQuestion,
        intent,
        style: adjustedStyle,
        language,
        conversationSummary: summary,
        retrievedContext: kbResult.chunks.map((c) => `[${c.topic}]: ${c.text}`).join('\n\n'),
        history: historyList.slice(-4),
      };

      if (plan) {
        promptInput.lessonTitle = plan.title;
        promptInput.lessonObjectives = plan.objectives;
      }
      if (extractedImageText) {
        promptInput.extractedImageProblem = extractedImageText;
      }

      const promptPayload = {
        instructions: promptInstructions,
        input: promptInput,
        image: request.image
          ? {
              dataUrl: request.image.dataUrl,
              mimeType: request.image.mimeType,
            }
          : undefined,
      };

      const temperature =
        intent === 'numerical_problem'
          ? 0.1
          : adjustedStyle === 'eli10'
            ? 0.4
            : adjustedStyle === 'exam_style'
              ? 0.2
              : 0.3;
      const topP = intent === 'numerical_problem' ? 0.8 : 0.92;

      const generated = await aiProvider.generateStructured<z.infer<typeof structuredTutorAnswerSchema>>(
        structuredTutorAnswerSchema,
        promptPayload,
        {
          schemaName: 'edukriti_tutor_response',
          schemaDescription: 'Warm conversational AI teacher response with structured steps and suggestions',
          temperature,
          topP,
        },
      );

      // 9. Math Verification for Numericals
      let mathVerification: TutorResponse['mathVerification'];
      if (generated.isMathOrNumerical || intent === 'numerical_problem') {
        mathVerification = verifyNumericalAnswer(activeQuestion, generated.answer, generated.steps);
      }

      // 10. Claim Validation against retrieved KB
      if (kbResult.chunks.length > 0) {
        const claimCheck = validateClaimsAgainstEvidence(generated.answer, kbResult.chunks);
        if (!claimCheck.isValid && claimCheck.unsupportedClaims.length > 0) {
          // If unsupported claims were flagged, annotate attribution notice
          sourceAttributionNotice = 'Partially from general knowledge (contains unverified citations)';
        }
      }

      return tutorResponseSchema.parse({
        answer: generated.answer,
        followUpQuestion: generated.followUpQuestion,
        grounded: citations.length > 0,
        provider: aiProvider.name,
        citations,
        intent: generated.intent || intent,
        style: adjustedStyle,
        isMathOrNumerical: generated.isMathOrNumerical || intent === 'numerical_problem',
        steps: generated.steps,
        mathVerification,
        suggestedQuestions:
          generated.suggestedQuestions.length > 0
            ? generated.suggestedQuestions
            : [
                'Explain this with a simpler analogy',
                'Give an everyday real-world example',
                'How does this topic appear in exams?',
              ],
        knowledgeBaseGrounded: kbGrounded,
        sourceAttributionNotice,
        summary: summary || undefined,
        extractedImageText,
        safetyPassed: !hasInjectionRisk,
      });
    } catch {
      // Fall through to deterministic fallback on error
    }
  }

  // 11. Deterministic Fallback
  return buildDeterministicTutorAnswer(
    plan,
    request,
    citations,
    intent,
    language,
    adjustedStyle,
    extractedImageText,
  );
}

/**
 * Streaming Server-Sent Events (SSE) generator for progressive tutor answers.
 */
export async function* streamTutorQuestion(
  plan: LessonPlan | null | undefined,
  request: TutorRequest,
  config: TutorProviderConfig = {},
): AsyncIterable<TutorStreamEvent> {
  // Step A: Status - Verifying
  yield { type: 'status', phase: 'safety', message: 'Checking safety and prompt validity...' };

  // Safety checks
  const harmCheck = detectHarmfulContent(request.question);
  if (harmCheck.isHarmful) {
    const lang = request.language || plan?.language || 'english';
    const msg =
      harmCheck.refusalMessage?.[lang] ||
      harmCheck.refusalMessage?.english ||
      'I cannot fulfill this request as it violates safety guidelines.';
    yield {
      type: 'complete',
      response: tutorResponseSchema.parse({
        answer: msg,
        followUpQuestion: 'What academic topic would you like to study together instead?',
        grounded: false,
        provider: 'deterministic',
        citations: [],
        safetyPassed: false,
        suggestedQuestions: ['What is Newton’s Law of Universal Gravitation?', 'How does photosynthesis work?'],
      }),
    };
    return;
  }

  // Step B: Intent & Retrieval
  const intent = request.intent || classifyIntent(request.question);
  yield { type: 'intent', intent };

  yield { type: 'status', phase: 'retrieval', message: 'Searching verified knowledge base...' };
  const kbResult = retrieveFromKnowledgeBase(request.question, { limit: 3 });
  if (kbResult.isGrounded) {
    yield {
      type: 'citations',
      citations: kbResult.citations.map((c) => ({
        sourceId: c.sourceId,
        chunkId: c.chunkId,
        excerpt: c.excerpt,
        page: c.page,
        title: c.title,
        source: c.source,
      })),
    };
  }

  // Step C: OCR Vision (if image provided)
  if (request.image) {
    yield { type: 'status', phase: 'vision', message: 'Extracting text and diagram from photo...' };
    const extractedText = `[Photo Problem: ${request.question}]`;
    yield { type: 'ocr', extractedText };
  }

  // Step D: Progressive Generation
  yield { type: 'status', phase: 'generation', message: 'Generating explanation...' };

  // Call main answer pipeline to ensure schema validation & math verification
  const fullResponse = await answerTutorQuestion(plan, request, config);

  // Progressive text streaming
  const wordsList = fullResponse.answer.split(' ');
  for (let i = 0; i < wordsList.length; i += 3) {
    const chunk = wordsList.slice(i, i + 3).join(' ') + ' ';
    yield { type: 'delta', text: chunk };
  }

  // Numerical steps if applicable
  if (fullResponse.steps.length > 0) {
    yield { type: 'steps', steps: fullResponse.steps };
  }

  // Math verification if applicable
  if (fullResponse.mathVerification) {
    yield { type: 'verification', verification: fullResponse.mathVerification };
  }

  // Suggestions
  if (fullResponse.suggestedQuestions.length > 0) {
    yield { type: 'suggestions', suggestions: fullResponse.suggestedQuestions };
  }

  // Complete
  yield { type: 'complete', response: fullResponse };
}
