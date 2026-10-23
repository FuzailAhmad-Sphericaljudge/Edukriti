import type { z } from 'zod';
import type { AiProviderType } from '@edukriti/contracts';

export type PromptRole = 'system' | 'user' | 'assistant';

export type PromptMessage = {
  role: PromptRole;
  content: string;
};

export type StructuredPromptPayload = {
  instructions?: string;
  input: string | Record<string, unknown>;
  history?: PromptMessage[];
};

export type PromptInput = string | PromptMessage[] | StructuredPromptPayload;

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type AiRequestOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  abortSignal?: AbortSignal;
  schemaName?: string;
  schemaDescription?: string;
  jsonSchema?: Record<string, unknown>;
};

export type AiStreamOptions = AiRequestOptions & {
  onChunk?: (chunk: string) => void;
};

export type AiEmbedOptions = {
  model?: string;
  timeoutMs?: number;
  dimensions?: number;
};

export type AiStructuredResult<T> = {
  data: T;
  usage?: TokenUsage;
  provider: AiProviderType;
  model: string;
  latencyMs: number;
};

export type AiTextResult = {
  text: string;
  usage?: TokenUsage;
  provider: AiProviderType;
  model: string;
  latencyMs: number;
};

export type SchemaValidator<T> = {
  parse(input: unknown): T;
};

export interface AiProvider {
  readonly name: AiProviderType;
  readonly defaultModel: string;

  generateStructured<T>(
    schema: SchemaValidator<T> | z.ZodType<T>,
    prompt: PromptInput,
    options?: AiRequestOptions,
  ): Promise<T>;

  generateText(
    prompt: PromptInput,
    options?: AiRequestOptions,
  ): Promise<string>;

  stream(
    prompt: PromptInput,
    options?: AiStreamOptions,
  ): AsyncIterable<string>;

  embed(
    texts: string[],
    options?: AiEmbedOptions,
  ): Promise<number[][]>;
}

export type AiProviderConfig = {
  provider?: AiProviderType;
  geminiApiKey?: string;
  geminiModel?: string;
  geminiBaseUrl?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  openaiBaseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  tokenBudget?: number;
  enableCache?: boolean;
};
