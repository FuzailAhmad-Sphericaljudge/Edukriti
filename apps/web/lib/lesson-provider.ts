import type { AiProviderType, LessonPlan, LessonRequest } from '@edukriti/contracts';
import { generateLessonPlanWithAi, type LessonEvidence } from '@edukriti/teaching-engine';
import { createAiProvider } from '@edukriti/ai';

export type ProviderResult = {
  plan: LessonPlan;
  provider: AiProviderType;
};

export type LessonProviderConfig = {
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  provider?: AiProviderType;
  timeoutMs?: number;
};

export async function generateLessonPlan(
  request: LessonRequest,
  evidence: LessonEvidence[],
  lessonId: string,
  config: LessonProviderConfig = {},
): Promise<ProviderResult> {
  const aiProvider = createAiProvider({
    provider: config.provider,
    geminiApiKey: config.geminiApiKey,
    geminiModel: config.geminiModel,
    openaiApiKey: config.openaiApiKey,
    openaiModel: config.openaiModel,
    timeoutMs: config.timeoutMs ?? 30_000,
  });

  const plan = await generateLessonPlanWithAi(aiProvider, request, evidence, lessonId);

  return {
    plan,
    provider: aiProvider.name,
  };
}
