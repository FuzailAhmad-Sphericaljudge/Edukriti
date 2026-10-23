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

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
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
    this.defaultModel = config.model || 'gemini-2.5-flash';
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultTimeoutMs = config.timeoutMs ?? 30_000;
  }

  private buildContents(messages: PromptMessage[]) {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
  }

  async generateStructured<T>(
    schema: SchemaValidator<T> | z.ZodType<T>,
    prompt: PromptInput,
    options: AiRequestOptions = {},
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in environment.');
    }

    const startTime = Date.now();
    const model = options.model || this.defaultModel;
    const { instructions, messages } = normalizePrompt(prompt);
    const jsonSchema = options.jsonSchema || zodToJsonSchema(schema);

    const body: Record<string, unknown> = {
      contents: this.buildContents(messages),
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxOutputTokens ?? 6000,
        responseMimeType: 'application/json',
        responseSchema: jsonSchema,
      },
    };

    if (instructions) {
      body.systemInstruction = {
        parts: [{ text: instructions }],
      };
    }

    aiLogger.log({
      provider: this.name,
      action: 'generateStructured',
      model,
      status: 'start',
    });

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: options.abortSignal || controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (status ${response.status}): ${errText}`);
      }

      const resData = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty candidate or text.');
      }

      const usage: TokenUsage = {
        promptTokens: resData.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: resData.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: resData.usageMetadata?.totalTokenCount ?? 0,
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
      throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in environment.');
    }

    const startTime = Date.now();
    const model = options.model || this.defaultModel;
    const { instructions, messages } = normalizePrompt(prompt);

    const body: Record<string, unknown> = {
      contents: this.buildContents(messages),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
      },
    };

    if (instructions) {
      body.systemInstruction = {
        parts: [{ text: instructions }],
      };
    }

    aiLogger.log({
      provider: this.name,
      action: 'generateText',
      model,
      status: 'start',
    });

    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: options.abortSignal || controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (status ${response.status}): ${errText}`);
      }

      const resData = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText === undefined) {
        throw new Error('Gemini returned an empty response.');
      }

      const usage: TokenUsage = {
        promptTokens: resData.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: resData.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: resData.usageMetadata?.totalTokenCount ?? 0,
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
      throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in environment.');
    }

    const model = options.model || this.defaultModel;
    const { instructions, messages } = normalizePrompt(prompt);

    const body: Record<string, unknown> = {
      contents: this.buildContents(messages),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
      },
    };

    if (instructions) {
      body.systemInstruction = {
        parts: [{ text: instructions }],
      };
    }

    const response = await fetch(`${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw new Error(`Gemini stream error (status ${response.status}): ${errText}`);
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
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr) as {
                candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
              };
              const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunk) {
                options.onChunk?.(chunk);
                yield chunk;
              }
            } catch {
              // Ignore partial JSON parsing errors in SSE stream
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
      throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in environment.');
    }

    const model = options.model || 'text-embedding-004';
    const requests = texts.map((text) => ({
      model: `models/${model}`,
      content: { parts: [{ text }] },
    }));

    const response = await fetch(`${this.baseUrl}/models/${model}:batchEmbedContents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini embed error (status ${response.status}): ${errText}`);
    }

    const resData = (await response.json()) as {
      embeddings?: Array<{ values: number[] }>;
    };

    return resData.embeddings?.map((e) => e.values) ?? [];
  }
}
