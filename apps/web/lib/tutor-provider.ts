import {
  type AiProviderType,
  type LessonPlan,
  type TutorRequest,
  type TutorResponse,
  tutorResponseSchema,
} from '@edukriti/contracts';
import { createAiProvider } from '@edukriti/ai';
import { z } from 'zod';

const modelAnswerSchema = z.object({
  answer: z.string().min(1).max(3000),
  followUpQuestion: z.string().min(1).max(500),
});

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

function words(value: string) {
  return new Set(value.toLowerCase().match(/[a-z0-9\u0900-\u097f]{3,}/g) ?? []);
}

function relevantSegments(plan: LessonPlan, request: TutorRequest) {
  const queryWords = words(
    `${request.history
      .filter((turn) => turn.role === 'user')
      .map((turn) => turn.content)
      .join(' ')} ${request.question}`,
  );
  return [...plan.segments]
    .sort((left, right) => {
      const score = (segment: LessonPlan['segments'][number]) => {
        const segmentWords = words(`${segment.title} ${segment.objective} ${segment.narration}`);
        const overlap = [...queryWords].filter((word) => segmentWords.has(word)).length;
        return overlap + (segment.id === request.currentSegmentId ? 4 : 0);
      };
      return score(right) - score(left);
    })
    .slice(0, 3);
}

function fallbackAnswer(
  plan: LessonPlan,
  request: TutorRequest,
  segments: ReturnType<typeof relevantSegments>,
) {
  const best = segments[0] ?? plan.segments[0]!;
  const concept = best.title;
  const objective = best.objective;

  const bridge =
    plan.language === 'hindi'
      ? `बहुत अच्छा सवाल! “${concept}” के संदर्भ में, इसका मुख्य विचार यह है: ${objective}।`
      : plan.language === 'hinglish'
        ? `Great question! “${concept}” ke context mein, core idea yeh hai: ${objective}।`
        : `Great question! In the context of “${concept}”, the key idea is: ${objective}.`;

  const explanation =
    plan.language === 'hindi'
      ? `जब आप ${request.question.trim()} के बारे में सोचते हैं, तो याद रखिए कि कारण और प्रभाव आपस में जुड़े हैं। ${best.narration.slice(0, 240)}...`
      : plan.language === 'hinglish'
        ? `Jab aap '${request.question.trim()}' sochte hain, toh dhyan rakhein ki cause aur effect kaise connect hote hain. ${best.narration.slice(0, 240)}...`
        : `When exploring '${request.question.trim()}', notice how the underlying mechanism drives the result. ${best.narration.slice(0, 240)}...`;

  const followUpQuestion =
    plan.language === 'hindi'
      ? `क्या आप इसे अपने शब्दों में एक नए उदाहरण के साथ जोड़कर समझा सकते हैं?`
      : plan.language === 'hinglish'
        ? `Kya aap isko apne words mein ek everyday example ke saath connect kar sakte ho?`
        : `Can you connect this to an everyday example in your own words?`;

  return { answer: `${bridge} ${explanation}`, followUpQuestion };
}

export async function answerTutorQuestion(
  plan: LessonPlan,
  request: TutorRequest,
  config: TutorProviderConfig = {},
): Promise<TutorResponse> {
  const segments = relevantSegments(plan, request);
  const citations = segments
    .flatMap((segment) => segment.citations)
    .filter(
      (citation, index, all) =>
        all.findIndex((item) => item.chunkId === citation.chunkId) === index,
    )
    .slice(0, 6);

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
      const prompt = {
        instructions: `# Role
You are Aarohi, Edukriti's warm, patient, human-like AI teacher answering a student in real-time.

# Guidelines
- Answer language: ${plan.language} (English, Hindi, or Hinglish).
- Start with a direct, conversational explanation connecting cause and effect.
- Use one concrete, relatable real-world example or analogy.
- Keep sentences short, vocal-friendly, and easy to absorb.
- Ground claims in the provided lesson segment context: ${segments.map((s) => `${s.title}: ${s.narration}`).join('\n')}.
- Conclude with a single brief, thoughtful follow-up question checking understanding.`,
        input: {
          lessonTitle: plan.title,
          question: request.question,
          history: request.history,
          currentSegment: segments[0]?.title,
        },
      };

      const generated = await aiProvider.generateStructured<{ answer: string; followUpQuestion: string }>(
        modelAnswerSchema,
        prompt,
        {
          schemaName: 'edukriti_tutor_answer',
          schemaDescription: 'Warm conversational AI teacher response',
        },
      );

      return tutorResponseSchema.parse({
        ...generated,
        grounded: citations.length > 0,
        provider: aiProvider.name,
        citations,
      });
    } catch {
      // Fallback cleanly on error
    }
  }

  return tutorResponseSchema.parse({
    ...fallbackAnswer(plan, request, segments),
    grounded: citations.length > 0,
    provider: 'deterministic',
    citations,
  });
}
