import type { z } from 'zod';
import type {
  AiEmbedOptions,
  AiProvider,
  AiRequestOptions,
  AiStreamOptions,
  PromptInput,
  SchemaValidator,
} from './types.ts';
import type { AiProviderType } from '@edukriti/contracts';
import { aiLogger } from './logger.ts';
import { globalTokenBudget } from './budget.ts';
import { FallbackProvider, globalFallbackProvider } from './fallback-provider.ts';

export class ResilientAiAdapter implements AiProvider {
  private primary: AiProvider;
  private fallback: FallbackProvider;
  private maxRetries: number;

  constructor(
    primary: AiProvider,
    fallback: FallbackProvider = globalFallbackProvider,
    options: { maxRetries?: number } = {},
  ) {
    this.primary = primary;
    this.fallback = fallback;
    this.maxRetries = options.maxRetries ?? 1;
  }

  get name(): AiProviderType {
    return this.primary.name;
  }

  get defaultModel(): string {
    return this.primary.defaultModel;
  }

  get primaryProvider(): AiProvider {
    return this.primary;
  }

  get fallbackProvider(): FallbackProvider {
    return this.fallback;
  }

  async generateStructured<T>(
    schema: SchemaValidator<T> | z.ZodType<T>,
    prompt: PromptInput,
    options: AiRequestOptions = {},
  ): Promise<T> {
    if (!globalTokenBudget.hasBudgetFor(options.maxOutputTokens ?? 1000)) {
      aiLogger.log({
        provider: this.primary.name,
        action: 'fallback',
        status: 'fallback',
        error: 'Token budget exceeded, routing to deterministic fallback',
      });
      return this.fallback.generateStructured(schema, prompt, options);
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          aiLogger.log({
            provider: this.primary.name,
            action: 'retry',
            status: 'retry',
            meta: { attempt },
          });
        }
        return await this.primary.generateStructured(schema, prompt, options);
      } catch (err) {
        lastError = err;
      }
    }

    aiLogger.log({
      provider: this.primary.name,
      action: 'fallback',
      status: 'fallback',
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    return this.fallback.generateStructured(schema, prompt, options);
  }

  async generateText(
    prompt: PromptInput,
    options: AiRequestOptions = {},
  ): Promise<string> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          aiLogger.log({
            provider: this.primary.name,
            action: 'retry',
            status: 'retry',
            meta: { attempt },
          });
        }
        return await this.primary.generateText(prompt, options);
      } catch (err) {
        lastError = err;
      }
    }

    aiLogger.log({
      provider: this.primary.name,
      action: 'fallback',
      status: 'fallback',
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    return this.fallback.generateText(prompt, options);
  }

  async *stream(
    prompt: PromptInput,
    options: AiStreamOptions = {},
  ): AsyncIterable<string> {
    try {
      for await (const chunk of this.primary.stream(prompt, options)) {
        yield chunk;
      }
    } catch (err) {
      aiLogger.log({
        provider: this.primary.name,
        action: 'fallback',
        status: 'fallback',
        error: err instanceof Error ? err.message : String(err),
      });
      for await (const chunk of this.fallback.stream(prompt, options)) {
        yield chunk;
      }
    }
  }

  async embed(
    texts: string[],
    options: AiEmbedOptions = {},
  ): Promise<number[][]> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          aiLogger.log({
            provider: this.primary.name,
            action: 'retry',
            status: 'retry',
            meta: { attempt },
          });
        }
        return await this.primary.embed(texts, options);
      } catch (err) {
        lastError = err;
      }
    }

    aiLogger.log({
      provider: this.primary.name,
      action: 'fallback',
      status: 'fallback',
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    return this.fallback.embed(texts, options);
  }
}
