import type { z } from 'zod';
import type {
  AiEmbedOptions,
  AiProvider,
  AiRequestOptions,
  AiStreamOptions,
  PromptInput,
  PromptMessage,
  SchemaValidator,
  TokenUsage,
} from './types.ts';
import { normalizePrompt } from './prompt-utils.ts';
import { zodToJsonSchema } from './schema-utils.ts';
import { aiLogger } from './logger.ts';
import { globalTokenBudget } from './budget.ts';

export class OpenAIProvider implements AiProvider {
  readonly name = 'openai' as const;
  readonly defaultModel: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;

  constructor(config: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    timeoutMs?: number;
  } = {}) {
    this.apiKey = config.apiKey ?? '';
    this.defaultModel = config.model || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.defaultTimeoutMs = config.timeoutMs ?? 30_000;
  }

  private formatOpenAiMessages(messages: PromptMessage[]) {
    return messages.map((m) => {
      if (!m.image) {
        return { role: m.role, content: m.content };
      }
      const dataUrl =
        m.image.dataUrl ||
        `data:${m.image.mimeType};base64,${m.image.base64}`;
      return {
        role: m.role,
        content: [
          { type: 'text', text: m.content },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      };
    });
  }

  async generateStructured<T>(
    schema: SchemaValidator<T> | z.ZodType<T>,
    prompt: PromptInput,
    options: AiRequestOptions = {},
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in environment.');
    }

    const startTime = Date.now();
    const model = options.model || this.defaultModel;
    const { messages } = normalizePrompt(prompt);
    const jsonSchema = options.jsonSchema || zodToJsonSchema(schema);
    const schemaName = options.schemaName || 'edukriti_output';

    aiLogger.log({
      provider: this.name,
      action: 'generateStructured',
      model,
      status: 'start',
    });

    const body = {
      model,
      messages: this.formatOpenAiMessages(messages),
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxOutputTokens ?? 4000,
      ...(options.topP !== undefined ? { top_p: options.topP } : {}),
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          strict: true,
          schema: jsonSchema,
        },
      },
    };

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: options.abortSignal || controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error (status ${response.status}): ${errText}`);
      }

      const resData = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };

      const rawText = resData.choices?.[0]?.message?.content;
      if (!rawText) {
        throw new Error('OpenAI returned an empty completion content.');
      }

      const usage: TokenUsage = {
        promptTokens: resData.usage?.prompt_tokens ?? 0,
        completionTokens: resData.usage?.completion_tokens ?? 0,
        totalTokens: resData.usage?.total_tokens ?? 0,
      };
      globalTokenBudget.recordUsage(usage);

      const parsedJson = JSON.parse(rawText);
      const validated = schema.parse(parsedJson);

      aiLogger.log({
        provider: this.name,
        action: 'generateStructured',
        model,
        durationMs: Date.now() - startTime,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        status: 'success',
      });

      return validated;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      aiLogger.log({
        provider: this.name,
        action: 'generateStructured',
        model,
        durationMs: Date.now() - startTime,
        status: 'error',
        error: errorMsg,
      });
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateText(
    prompt: PromptInput,
    options: AiRequestOptions = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in environment.');
    }

    const startTime = Date.now();
    const model = options.model || this.defaultModel;
    const { messages } = normalizePrompt(prompt);

    aiLogger.log({
      provider: this.name,
      action: 'generateText',
      model,
      status: 'start',
    });

    const body = {
      model,
      messages: this.formatOpenAiMessages(messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxOutputTokens ?? 2048,
      ...(options.topP !== undefined ? { top_p: options.topP } : {}),
    };

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: options.abortSignal || controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error (status ${response.status}): ${errText}`);
      }

      const resData = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };

      const rawText = resData.choices?.[0]?.message?.content;
      if (rawText === undefined) {
        throw new Error('OpenAI returned an empty text content.');
      }

      const usage: TokenUsage = {
        promptTokens: resData.usage?.prompt_tokens ?? 0,
        completionTokens: resData.usage?.completion_tokens ?? 0,
        totalTokens: resData.usage?.total_tokens ?? 0,
      };
      globalTokenBudget.recordUsage(usage);

      aiLogger.log({
        provider: this.name,
        action: 'generateText',
        model,
        durationMs: Date.now() - startTime,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        status: 'success',
      });

      return rawText;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      aiLogger.log({
        provider: this.name,
        action: 'generateText',
        model,
        durationMs: Date.now() - startTime,
        status: 'error',
        error: errorMsg,
      });
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async *stream(
    prompt: PromptInput,
    options: AiStreamOptions = {},
  ): AsyncIterable<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in environment.');
    }

    const model = options.model || this.defaultModel;
    const { messages } = normalizePrompt(prompt);

    const body = {
      model,
      messages: this.formatOpenAiMessages(messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxOutputTokens ?? 2048,
      ...(options.topP !== undefined ? { top_p: options.topP } : {}),
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw new Error(`OpenAI stream error (status ${response.status}): ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr) as {
                choices?: Array<{
                  delta?: {
                    content?: string;
                  };
                }>;
              };
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) {
                options.onChunk?.(chunk);
                yield chunk;
              }
            } catch {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async embed(
    texts: string[],
    options: AiEmbedOptions = {},
  ): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in environment.');
    }

    const model = options.model || 'text-embedding-3-small';

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI embed error (status ${response.status}): ${errText}`);
    }

    const resData = (await response.json()) as {
      data?: Array<{ embedding: number[] }>;
    };

    return resData.data?.map((item) => item.embedding) ?? [];
  }
}
