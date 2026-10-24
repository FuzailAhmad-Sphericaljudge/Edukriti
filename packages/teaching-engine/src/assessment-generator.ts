import {
  assessmentQuestionSchema,
  type LessonPlan,
  type AssessmentQuestion,
} from '@edukriti/contracts';
import type { AiProvider } from '@edukriti/ai';
import { z } from 'zod';
import {
  CONCEPT_KNOWLEDGE_GRAPH,
  resolveConceptGraph,
  type ConceptNode,
} from './concept-graph.ts';
import { evaluateCheckpointWithAi } from './rubric-evaluator.ts';

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

function localizeText(language: LessonPlan['language'], english: string, hinglish: string, hindi: string) {
  return language === 'hindi' ? hindi : language === 'hinglish' ? hinglish : english;
}

/**
 * Curated question sets for the 4 canonical topics.
 */
const CANONICAL_TOPIC_QUESTIONS: Record<
  string,
  (plan: LessonPlan) => AssessmentQuestionDefinition[]
> = {
  electricity: (plan) => [
    {
      id: `${plan.id}-assessment-1`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'What best describes voltage in a circuit?',
        'Circuit mein voltage ko best kaise describe karenge?',
        'परिपथ में वोल्टेज का सबसे अच्छा वर्णन क्या है?',
      ),
      choices: [
        { id: 'a', text: 'The push or potential difference that drives charge' },
        { id: 'b', text: 'The amount of resistance in a wire' },
        { id: 'c', text: 'The charge permanently stored in a bulb' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'Voltage as the driving force',
    },
    {
      id: `${plan.id}-assessment-2`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'If resistance increases while voltage stays constant, what happens to current?',
        'Voltage same rahe aur resistance badhe, toh current ka kya hoga?',
        'वोल्टेज समान रहे और प्रतिरोध बढ़े, तो धारा का क्या होगा?',
      ),
      choices: [
        { id: 'a', text: 'It increases' },
        { id: 'b', text: 'It decreases' },
        { id: 'c', text: 'It always becomes zero' },
      ],
      expectedAnswer: 'b',
      targetConcept: 'Resistance and Ohm’s Law',
    },
    {
      id: `${plan.id}-assessment-3`,
      type: 'short_answer',
      prompt: localizeText(
        plan.language,
        'Explain electric current in your own words.',
        'Electric current ko apne words mein explain karo.',
        'विद्युत धारा को अपने शब्दों में समझाइए।',
      ),
      expectedAnswer: 'flow charge circuit',
      targetConcept: 'Electric charge and current',
    },
    {
      id: `${plan.id}-assessment-4`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'Which equation correctly represents Ohm’s Law?',
        'Ohm ka kaunsa equation sahi hai?',
        'ओम का कौन सा नियम सही समीकरण है?',
      ),
      choices: [
        { id: 'a', text: 'V = I × R' },
        { id: 'b', text: 'V = I + R' },
        { id: 'c', text: 'R = V × I' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'Resistance and Ohm’s Law',
    },
    {
      id: `${plan.id}-assessment-5`,
      type: 'short_answer',
      prompt: localizeText(
        plan.language,
        'Give one everyday example of a complete electric circuit.',
        'Ek complete electric circuit ka real-world example batao.',
        'एक पूर्ण विद्युत परिपथ का दैनिक उदाहरण दीजिए।',
      ),
      expectedAnswer: 'battery wire bulb switch circuit',
      targetConcept: 'Applying ideas to a simple circuit',
    },
  ],

  newton: (plan) => [
    {
      id: `${plan.id}-assessment-1`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'What does Newton’s First Law describe?',
        'Newton ka First Law kya describe karta hai?',
        'न्यूटन का पहला नियम क्या दर्शाता है?',
      ),
      choices: [
        { id: 'a', text: 'Inertia: an object resists changes to motion unless acted upon by a net force' },
        { id: 'b', text: 'Force equals mass divided by acceleration' },
        { id: 'c', text: 'Objects always accelerate without force' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'Newton’s First Law',
    },
    {
      id: `${plan.id}-assessment-2`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'If force is doubled while mass remains constant, what happens to acceleration?',
        'Force double ho aur mass constant rahe, toh acceleration par kya asar hoga?',
        'यदि बल दोगुना हो और द्रव्यमान स्थिर रहे, तो त्वरण पर क्या प्रभाव पड़ेगा?',
      ),
      choices: [
        { id: 'a', text: 'It doubles (F = ma)' },
        { id: 'b', text: 'It is cut in half' },
        { id: 'c', text: 'It remains zero' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'Newton’s Second Law',
    },
    {
      id: `${plan.id}-assessment-3`,
      type: 'short_answer',
      prompt: localizeText(
        plan.language,
        'Explain one everyday example of action and reaction (Newton’s Third Law).',
        'Action aur reaction (Newton ke Third Law) ka ek real-world example explain karo.',
        'क्रिया और प्रतिक्रिया (न्यूटन के तीसरे नियम) का एक उदाहरण समझाइए।',
      ),
      expectedAnswer: 'rocket swim walk ground jump recoil boat push',
      targetConcept: 'Newton’s Third Law',
    },
    {
      id: `${plan.id}-assessment-4`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'Why do passenger bodies lurch forward when a bus suddenly brakes?',
        'Bus ke achanak brake lagane par log aage kyu girte hain?',
        'बस के अचानक ब्रेक लगाने पर यात्री आगे की ओर क्यों झुकते हैं?',
      ),
      choices: [
        { id: 'a', text: 'Inertia of motion keeps the upper body moving forward' },
        { id: 'b', text: 'Gravity pulls forward during braking' },
        { id: 'c', text: 'Air friction pushes from behind' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'Inertia and Motion',
    },
  ],

  react: (plan) => [
    {
      id: `${plan.id}-assessment-1`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'In React, what are props used for?',
        'React mein props kis kaam aate hain?',
        'रिएक्ट में प्रॉप्स का उपयोग किसलिए किया जाता है?',
      ),
      choices: [
        { id: 'a', text: 'Passing read-only data from parent to child components' },
        { id: 'b', text: 'Mutating component state directly inside render' },
        { id: 'c', text: 'Connecting directly to a SQL database' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'Props and Data Flow',
    },
    {
      id: `${plan.id}-assessment-2`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'What trigger causes a React functional component to re-render?',
        'React component ka re-render kis event se trigger hota hai?',
        'रिएक्ट कंपोनेंट का पुनः रेंडर किस घटना से शुरू होता है?',
      ),
      choices: [
        { id: 'a', text: 'State or props change via setter or parent update' },
        { id: 'b', text: 'Declaring a regular local variable inside the component' },
        { id: 'c', text: 'Window scrolling on the page' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'State and Interaction',
    },
    {
      id: `${plan.id}-assessment-3`,
      type: 'short_answer',
      prompt: localizeText(
        plan.language,
        'Explain the core benefit of the component model in your own words.',
        'Component model ka main benefit apne words mein explain karo.',
        'कंपोनेंट मॉडल का मुख्य लाभ अपने शब्दों में समझाइए।',
      ),
      expectedAnswer: 'reusable modular maintainable composable isolated ui',
      targetConcept: 'The Component Model',
    },
  ],

  ai: (plan) => [
    {
      id: `${plan.id}-assessment-1`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'What is the fundamental difference between training and inference in machine learning?',
        'Machine learning mein training aur inference mein kya farak hai?',
        'मशीन लर्निंग में प्रशिक्षण और अनुमान के बीच क्या अंतर है?',
      ),
      choices: [
        { id: 'a', text: 'Training optimizes model weights from data; inference runs the learned model on new inputs' },
        { id: 'b', text: 'Training executes code; inference compiles JavaScript' },
        { id: 'c', text: 'Inference creates the dataset; training displays the UI' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'Training and Inference',
    },
    {
      id: `${plan.id}-assessment-2`,
      type: 'mcq',
      prompt: localizeText(
        plan.language,
        'Why is high-quality, representative data essential for AI systems?',
        'AI systems ke liye diverse aur high-quality data kyu zaroori hai?',
        'एआई प्रणालियों के लिए उच्च गुणवत्ता वाला डेटा क्यों आवश्यक है?',
      ),
      choices: [
        { id: 'a', text: 'Models learn patterns and biases directly from training distributions' },
        { id: 'b', text: 'Data increases the CPU clock frequency' },
        { id: 'c', text: 'It prevents the computer from overheating' },
      ],
      expectedAnswer: 'a',
      targetConcept: 'Data, Models, and Learning',
    },
    {
      id: `${plan.id}-assessment-3`,
      type: 'short_answer',
      prompt: localizeText(
        plan.language,
        'Explain one important ethical limit or responsible use practice for AI systems.',
        'AI ka ek responsible use practice ya limitation apne words mein batao.',
        'एआई प्रणालियों के जिम्मेदार उपयोग का एक नियम समझाइए।',
      ),
      expectedAnswer: 'bias hallucination privacy verification safety transparency accountability',
      targetConcept: 'Limits and Responsible Use',
    },
  ],
};

/**
 * Builds assessment questions for any topic using the concept graph and learner weak concepts.
 */
export function buildAssessment(
  plan: LessonPlan,
  weakConcepts: string[] = [],
): AssessmentQuestionDefinition[] {
  const count = plan.durationMinutes === 60 ? 5 : 3;
  const titleLower = plan.title.toLowerCase();

  // Match canonical topics first for backward compatibility
  let canonicalKey: string | null = null;
  if (/electric|circuit|voltage|current|resistance|ohm/i.test(titleLower)) {
    canonicalKey = 'electricity';
  } else if (/newton|force|motion|inertia/i.test(titleLower)) {
    canonicalKey = 'newton';
  } else if (/react|component|jsx|props|state/i.test(titleLower)) {
    canonicalKey = 'react';
  } else if (/artificial intelligence|machine learning|\bai\b/i.test(titleLower)) {
    canonicalKey = 'ai';
  }

  if (canonicalKey && CANONICAL_TOPIC_QUESTIONS[canonicalKey]) {
    const canonicalQuestions = CANONICAL_TOPIC_QUESTIONS[canonicalKey]!(plan);

    // If student has weak concepts, prioritize question targeting the weak concept
    if (weakConcepts.length > 0) {
      const prioritized = [...canonicalQuestions].sort((a, b) => {
        const aWeak = weakConcepts.some((w) => a.targetConcept.toLowerCase().includes(w.toLowerCase()));
        const bWeak = weakConcepts.some((w) => b.targetConcept.toLowerCase().includes(w.toLowerCase()));
        return aWeak && !bWeak ? -1 : !aWeak && bWeak ? 1 : 0;
      });
      return prioritized.slice(0, count).map((q) => ({
        ...assessmentQuestionSchema.parse(q),
        expectedAnswer: q.expectedAnswer,
        targetConcept: q.targetConcept,
      }));
    }

    return canonicalQuestions.slice(0, count).map((q) => ({
      ...assessmentQuestionSchema.parse(q),
      expectedAnswer: q.expectedAnswer,
      targetConcept: q.targetConcept,
    }));
  }

  // Generate dynamic questions from concept graph and segments
  const resolvedNodes = resolveConceptGraph(plan.title, count);
  const questions: AssessmentQuestionDefinition[] = [];

  for (let i = 0; i < count; i++) {
    const node = resolvedNodes[i % Math.max(1, resolvedNodes.length)];
    const segment = plan.segments[i % plan.segments.length]!;
    const conceptName = node ? node.conceptName : segment.title;
    const isShortAnswer = i === count - 1;

    if (isShortAnswer) {
      const promptText = node
        ? (node.applicationCheckpoint.prompt[plan.language === 'hindi' ? 'hindi' : plan.language === 'hinglish' ? 'hinglish' : 'english'] || `Explain ${conceptName} in your own words.`)
        : `Explain the fundamental mechanism of ${conceptName} in your own words.`;

      questions.push({
        id: `${plan.id}-assessment-${i + 1}`,
        type: 'short_answer',
        prompt: promptText,
        expectedAnswer: node ? node.applicationCheckpoint.keyIdeas.join(' ') : conceptName,
        targetConcept: conceptName,
      });
    } else {
      const distractors = plan.segments
        .filter((s) => s.id !== segment.id)
        .slice(0, 2)
        .map((s, cIdx) => ({
          id: cIdx === 0 ? 'b' : 'c',
          text: s.objective,
        }));

      questions.push({
        id: `${plan.id}-assessment-${i + 1}`,
        type: 'mcq',
        prompt: `Which statement best explains the core principle of ${conceptName}?`,
        choices: [
          { id: 'a', text: segment.objective },
          ...distractors,
        ],
        expectedAnswer: 'a',
        targetConcept: conceptName,
      });
    }
  }

  return questions.map((q) => ({
    ...assessmentQuestionSchema.parse(q),
    expectedAnswer: q.expectedAnswer,
    targetConcept: q.targetConcept,
  }));
}

/**
 * Builds assessment questions tailored dynamically to any lesson plan using AI.
 * Incorporates learner weak concepts to create targeted questions.
 * Falls back deterministically if provider fails or is offline.
 */
export async function buildAssessmentWithAi(
  provider: AiProvider,
  plan: LessonPlan,
  weakConcepts: string[] = [],
): Promise<AssessmentQuestionDefinition[]> {
  const count = plan.durationMinutes === 60 ? 5 : 3;
  const prompt = {
    instructions: `# Role
You are an expert assessment designer creating a ${count}-question quiz for a lesson on "${plan.title}".
Language: ${plan.language}

# Rules
- Build exactly ${count} questions covering the lesson segments.
- Include a mix of MCQ (with 3-4 plausible choices labeled a, b, c, d) and 1 conceptual short-answer question at the end.
- Each question must specify the expectedAnswer and targetConcept.
- Match lesson language: ${plan.language} (English / Hindi / Hinglish).
${weakConcepts.length > 0 ? `- IMPORTANT: Focus at least one question specifically on addressing the learner's weak concepts: [${weakConcepts.join(', ')}].` : ''}`,
    input: {
      lessonTitle: plan.title,
      language: plan.language,
      weakConcepts,
      segments: plan.segments.map((s) => ({ title: s.title, objective: s.objective })),
      questionCount: count,
    },
  };

  try {
    const generated = await provider.generateStructured(aiGeneratedAssessmentSchema, prompt, {
      schemaName: 'lesson_assessment',
      schemaDescription: 'Dynamic multi-question assessment tailored to lesson content and weak concepts',
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
    return buildAssessment(plan, weakConcepts);
  }
}
