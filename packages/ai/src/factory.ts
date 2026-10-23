import type { AiProvider, AiProviderConfig } from './types.ts';
import { GeminiProvider } from './gemini-provider.ts';
import { OpenAIProvider } from './openai-provider.ts';
import { FallbackProvider, globalFallbackProvider } from './fallback-provider.ts';
import { ResilientAiAdapter } from './resilient-adapter.ts';

export function createAiProvider(config: AiProviderConfig = {}): AiProvider {
  const providerType = config.provider ||
    (config.geminiApiKey ? 'gemini' : config.openaiApiKey ? 'openai' : 'deterministic');

  let primary: AiProvider;
  switch (providerType) {
    case 'gemini':
      if (!config.geminiApiKey) {
        return globalFallbackProvider;
      }
      primary = new GeminiProvider({
        apiKey: config.geminiApiKey,
        model: config.geminiModel,
        baseUrl: config.geminiBaseUrl,
        timeoutMs: config.timeoutMs,
      });
      break;

    case 'openai':
      if (!config.openaiApiKey) {
        return globalFallbackProvider;
      }
      primary = new OpenAIProvider({
        apiKey: config.openaiApiKey,
        model: config.openaiModel,
        baseUrl: config.openaiBaseUrl,
        timeoutMs: config.timeoutMs,
      });
      break;

    case 'deterministic':
    default:
      return globalFallbackProvider;
  }

  return new ResilientAiAdapter(primary, globalFallbackProvider, {
    maxRetries: config.maxRetries ?? 1,
  });
}

export function createProviderFromEnv(env: Record<string, string | undefined> = {}): AiProvider {
  const geminiApiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  const openaiApiKey = env.OPENAI_API_KEY || (typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : undefined);
  const provider = (env.LLM_PROVIDER as 'gemini' | 'openai' | 'deterministic' | undefined) ||
    (typeof process !== 'undefined' ? (process.env?.LLM_PROVIDER as 'gemini' | 'openai' | 'deterministic' | undefined) : undefined);
  const geminiModel = env.GEMINI_MODEL || env.LLM_MODEL || (typeof process !== 'undefined' ? (process.env?.GEMINI_MODEL || process.env?.LLM_MODEL) : undefined);
  const openaiModel = env.OPENAI_MODEL || env.LLM_MODEL || (typeof process !== 'undefined' ? (process.env?.OPENAI_MODEL || process.env?.LLM_MODEL) : undefined);

  return createAiProvider({
    provider,
    geminiApiKey,
    geminiModel,
    openaiApiKey,
    openaiModel,
  });
}
