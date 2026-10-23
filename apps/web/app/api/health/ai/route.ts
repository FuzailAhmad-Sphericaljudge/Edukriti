import { z } from 'zod';
import { createAiProvider, sanitizeSecrets } from '@edukriti/ai';
import { env } from 'cloudflare:workers';

const healthPingSchema = z.object({
  status: z.string(),
  ack: z.string().optional(),
});

export async function GET() {
  const configuredProvider =
    env.LLM_PROVIDER || (env.GEMINI_API_KEY ? 'gemini' : env.OPENAI_API_KEY ? 'openai' : 'deterministic');
  const configuredModel =
    configuredProvider === 'gemini'
      ? env.GEMINI_MODEL || env.LLM_MODEL || 'gemini-2.5-flash'
      : configuredProvider === 'openai'
        ? env.OPENAI_MODEL || env.LLM_MODEL || 'gpt-4o-mini'
        : 'offline-deterministic-v1';

  const aiProvider = createAiProvider({
    provider: env.LLM_PROVIDER as 'gemini' | 'openai' | 'deterministic' | undefined,
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL || env.LLM_MODEL,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL || env.LLM_MODEL,
    timeoutMs: 8_000,
  });

  const startTime = Date.now();
  let callSuccess = false;
  let errorMessage: string | null = null;
  let activeProvider = aiProvider.name;

  try {
    const res = await aiProvider.generateStructured<{ status: string; ack?: string }>(
      healthPingSchema,
      'Respond with {"status": "ok", "ack": "healthy"}',
      {
        schemaName: 'health_check_ping',
        maxOutputTokens: 60,
        timeoutMs: 8_000,
      },
    );
    callSuccess = Boolean(res.status);
  } catch (err) {
    callSuccess = false;
    activeProvider = 'deterministic';
    errorMessage = sanitizeSecrets(err instanceof Error ? err.message : String(err));
  }

  const latencyMs = Date.now() - startTime;

  return Response.json({
    status: callSuccess ? (activeProvider === 'deterministic' && configuredProvider !== 'deterministic' ? 'fallback' : 'healthy') : 'degraded',
    provider: activeProvider,
    configuredProvider,
    model: configuredModel,
    latencyMs,
    timestamp: new Date().toISOString(),
    features: {
      lessonGeneration: true,
      tutor: true,
      checkpointEvaluation: true,
      adaptiveAssessment: true,
      offlineFallbackReady: true,
    },
    credentials: {
      geminiConfigured: Boolean(env.GEMINI_API_KEY),
      openaiConfigured: Boolean(env.OPENAI_API_KEY),
    },
    error: errorMessage,
  });
}
