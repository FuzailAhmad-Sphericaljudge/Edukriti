import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import {
  GeminiProvider,
  OpenAIProvider,
  FallbackProvider,
  ResilientAiAdapter,
  createAiProvider,
  sanitizeSecrets,
  sanitizeObject,
  globalAiCache,
  TokenBudgetTracker,
  estimateTokens,
} from './index.ts';

const testSchema = z.object({
  greeting: z.string(),
  lessonCount: z.number(),
});

test('sanitizeSecrets removes Gemini and OpenAI API keys and auth headers', () => {
  const secretKey = 'AIzaSyDemoSecretKeyForTestingPurposes123';
  const openAiKey = 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz';
  const text = `Got response using ${secretKey} and auth Bearer ${openAiKey}`;
  const sanitized = sanitizeSecrets(text);

  assert.equal(sanitized.includes(secretKey), false);
  assert.equal(sanitized.includes(openAiKey), false);
  assert.equal(sanitized.includes('[REDACTED]'), true);
});

test('sanitizeObject redacts keys named secret, auth, token, password', () => {
  const obj = {
    apiKey: 'my-secret-key-12345',
    username: 'aarohi',
    nested: {
      authToken: 'bearer-xyz',
      safeData: 'science',
    },
  };
  const sanitized = sanitizeObject(obj);
  assert.equal(sanitized.apiKey, '[REDACTED]');
  assert.equal(sanitized.nested.authToken, '[REDACTED]');
  assert.equal(sanitized.nested.safeData, 'science');
});

test('GeminiProvider parses structured output with mocked fetch', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.match(String(url), /generativelanguage\.googleapis\.com/);
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers['x-goog-api-key'], 'test-gemini-key');

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      greeting: 'Namaste',
                      lessonCount: 4,
                    }),
                  },
                ],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 15,
            candidatesTokenCount: 10,
            totalTokenCount: 25,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const provider = new GeminiProvider({ apiKey: 'test-gemini-key' });
    const result = await provider.generateStructured(testSchema, 'Say hello');
    assert.equal(result.greeting, 'Namaste');
    assert.equal(result.lessonCount, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('OpenAIProvider parses structured output with mocked fetch', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.match(String(url), /api\.openai\.com/);
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers.Authorization, 'Bearer test-openai-key');

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  greeting: 'Hello student',
                  lessonCount: 7,
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 20,
            completion_tokens: 12,
            total_tokens: 32,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const provider = new OpenAIProvider({ apiKey: 'test-openai-key' });
    const result = await provider.generateStructured(testSchema, 'Hello');
    assert.equal(result.greeting, 'Hello student');
    assert.equal(result.lessonCount, 7);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('GeminiProvider.stream yields text chunks from SSE stream', async () => {
  const originalFetch = globalThis.fetch;
  try {
    const sseBody = `data: {"candidates":[{"content":{"parts":[{"text":"Hello "}]}}]}\n\ndata: {"candidates":[{"content":{"parts":[{"text":"world!"}]}}]}\n\ndata: [DONE]\n\n`;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseBody));
        controller.close();
      },
    });

    globalThis.fetch = async () => new Response(stream, { status: 200 });

    const provider = new GeminiProvider({ apiKey: 'test-key' });
    const chunks: string[] = [];
    for await (const chunk of provider.stream('Hi')) {
      chunks.push(chunk);
    }
    assert.deepEqual(chunks, ['Hello ', 'world!']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('GeminiProvider.embed returns embedding vectors', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          embeddings: [{ values: [0.1, 0.2, 0.3] }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const provider = new GeminiProvider({ apiKey: 'test-key' });
    const embeddings = await provider.embed(['Science']);
    assert.equal(embeddings.length, 1);
    assert.deepEqual(embeddings[0], [0.1, 0.2, 0.3]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('OpenAIProvider.embed returns embedding vectors', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: [{ embedding: [0.4, 0.5, 0.6] }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const provider = new OpenAIProvider({ apiKey: 'test-key' });
    const embeddings = await provider.embed(['Physics']);
    assert.equal(embeddings.length, 1);
    assert.deepEqual(embeddings[0], [0.4, 0.5, 0.6]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ResilientAiAdapter retries once on schema error and falls back gracefully', async () => {
  let callCount = 0;
  const mockFailingPrimary = {
    name: 'gemini' as const,
    defaultModel: 'test-model',
    async generateStructured() {
      callCount++;
      // Return invalid data failing Zod validation
      throw new Error('Zod validation failed: missing required fields');
    },
    async generateText() { return ''; },
    async *stream() { yield ''; },
    async embed() { return []; },
  };

  const fallback = new FallbackProvider();
  fallback.registerGenerator('testSchema', () => ({
    greeting: 'Fallback greeting',
    lessonCount: 1,
  }));

  const adapter = new ResilientAiAdapter(mockFailingPrimary, fallback, { maxRetries: 1 });
  const result = await adapter.generateStructured(testSchema, 'Hello', { schemaName: 'testSchema' });

  // 1 initial attempt + 1 retry = 2 attempts before falling back
  assert.equal(callCount, 2);
  assert.equal(result.greeting, 'Fallback greeting');
  assert.equal(result.lessonCount, 1);
});

test('TokenBudgetTracker enforces limits and resets correctly', () => {
  const tracker = new TokenBudgetTracker(100);
  assert.equal(tracker.hasBudgetFor(50), true);
  tracker.recordUsage({ promptTokens: 60, completionTokens: 30 });
  assert.equal(tracker.remaining, 10);
  assert.equal(tracker.hasBudgetFor(20), false);
  tracker.reset();
  assert.equal(tracker.remaining, 100);
});

test('estimateTokens calculates realistic token counts for English and Hindi text', () => {
  assert.equal(estimateTokens(''), 0);
  const english = estimateTokens('Explain Newton laws of motion with simple examples.');
  assert.ok(english > 10 && english < 25);
  const hindi = estimateTokens('न्यूटन के गति के नियम');
  assert.ok(hindi > 5);
});

test('FallbackProvider returns deterministic text and caches results', async () => {
  const fallback = new FallbackProvider();
  const text1 = await fallback.generateText('Explain Ohm Law');
  const text2 = await fallback.generateText('Explain Ohm Law');
  assert.equal(text1, text2);
  assert.equal(text1.includes('Edukriti Offline Teacher'), true);
});

test('createAiProvider factory creates ResilientAiAdapter with Gemini default when key is provided', () => {
  const provider = createAiProvider({ geminiApiKey: 'test-gemini-key' });
  assert.equal(provider.name, 'gemini');
});

test('createAiProvider factory returns FallbackProvider when no keys are provided', () => {
  const provider = createAiProvider({});
  assert.equal(provider.name, 'deterministic');
});
