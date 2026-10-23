import type { z } from 'zod';
import type {
  AiEmbedOptions,
  AiProvider,
  AiRequestOptions,
  AiStreamOptions,
  PromptInput,
} from './types.ts';
import { normalizePrompt } from './prompt-utils.ts';
import { globalAiCache } from './cache.ts';
import { aiLogger } from './logger.ts';

type FallbackGenerator<T> = (prompt: PromptInput, options?: AiRequestOptions) => T;

export class FallbackProvider implements AiProvider {
  readonly name = 'deterministic' as const;
  readonly defaultModel = 'offline-deterministic-v1';
  private customGenerators = new Map<string, FallbackGenerator<unknown>>();

  registerGenerator<T>(schemaName: string, generator: FallbackGenerator<T>) {
    this.customGenerators.set(schemaName, generator as FallbackGenerator<unknown>);
  }

  async generateStructured<T>(
    schema: z.ZodType<T>,
    prompt: PromptInput,
    options: AiRequestOptions = {},
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = options.schemaName
      ? `structured:${options.schemaName}:${JSON.stringify(prompt)}`
      : `structured:${JSON.stringify(prompt)}`;

    const cached = globalAiCache.get<T>(cacheKey);
    if (cached !== undefined) {
      aiLogger.log({
        provider: this.name,
        action: 'generateStructured',
        model: this.defaultModel,
        status: 'success',
        meta: { cached: true },
      });
      return cached;
    }

    aiLogger.log({
      provider: this.name,
      action: 'generateStructured',
      model: this.defaultModel,
      status: 'start',
    });

    // Check if custom generator registered
    if (options.schemaName && this.customGenerators.has(options.schemaName)) {
      const generator = this.customGenerators.get(options.schemaName)!;
      const result = schema.parse(generator(prompt, options));
      globalAiCache.set(cacheKey, result);
      return result;
    }

    // Default synthesis for common Edukriti contracts
    const { rawText } = normalizePrompt(prompt);
    const parsed = this.synthesizeDefault(schema, rawText, options);
    globalAiCache.set(cacheKey, parsed);

    aiLogger.log({
      provider: this.name,
      action: 'generateStructured',
      model: this.defaultModel,
      durationMs: Date.now() - startTime,
      status: 'success',
    });

    return parsed;
  }

  private synthesizeDefault<T>(
    schema: z.ZodType<T>,
    rawText: string,
    options: AiRequestOptions,
  ): T {
    // Attempt parsing a minimal structure or standard mock
    const schemaName = options.schemaName?.toLowerCase() || '';

    if (schemaName.includes('tutor') || rawText.includes('edukriti_tutor_answer')) {
      const answer = {
        answer: `Let's break this down: ${rawText.slice(0, 100)}. Core concept connects step-by-step with practical examples.`,
        followUpQuestion: 'Can you explain the main idea in your own words?',
      };
      return schema.parse(answer);
    }

    if (schemaName.includes('evaluation') || rawText.includes('checkpoint')) {
      const evalObj = {
        checkpointId: 'fallback-eval',
        isCorrect: true,
        confidence: 0.85,
        understoodConcepts: ['Core Principle'],
        misconception: null,
        feedback: 'Good explanation of the primary concept.',
        nextAction: 'continue',
      };
      return schema.parse(evalObj);
    }

    // Try dummy parse
    try {
      return schema.parse({});
    } catch {
      throw new Error(
        `FallbackProvider cannot synthesize structure without a registered schema generator for "${options.schemaName}".`,
      );
    }
  }

  async generateText(
    prompt: PromptInput,
    options: AiRequestOptions = {},
  ): Promise<string> {
    const { rawText } = normalizePrompt(prompt);
    const cacheKey = `text:${rawText}`;
    const cached = globalAiCache.get<string>(cacheKey);
    if (cached !== undefined) return cached;

    const response = `[Edukriti Offline Teacher]: ${rawText.slice(0, 150)} — Remember to connect definition, mechanism, and everyday application.`;
    globalAiCache.set(cacheKey, response);
    return response;
  }

  async *stream(
    prompt: PromptInput,
    options: AiStreamOptions = {},
  ): AsyncIterable<string> {
    const text = await this.generateText(prompt, options);
    const words = text.split(' ');
    for (const word of words) {
      const chunk = word + ' ';
      options.onChunk?.(chunk);
      yield chunk;
    }
  }

  async embed(
    texts: string[],
    options: AiEmbedOptions = {},
  ): Promise<number[][]> {
    const dimensions = options.dimensions || 768;
    return texts.map((text) => {
      let seed = 0;
      for (let i = 0; i < text.length; i++) {
        seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
      }
      const vector: number[] = [];
      let sumSq = 0;
      for (let d = 0; d < dimensions; d++) {
        seed = (seed * 1664525 + 1013904223) | 0;
        const val = ((seed & 0x7fffffff) / 0x7fffffff) * 2 - 1;
        vector.push(val);
        sumSq += val * val;
      }
      const mag = Math.sqrt(sumSq) || 1;
      return vector.map((v) => v / mag);
    });
  }
}

export const globalFallbackProvider = new FallbackProvider();
