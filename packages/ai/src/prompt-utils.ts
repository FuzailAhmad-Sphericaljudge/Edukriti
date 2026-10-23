import type { PromptInput, PromptMessage, StructuredPromptPayload } from './types.ts';

export function normalizePrompt(input: PromptInput): {
  instructions: string;
  messages: PromptMessage[];
  rawText: string;
} {
  if (typeof input === 'string') {
    return {
      instructions: '',
      messages: [{ role: 'user', content: input }],
      rawText: input,
    };
  }

  if (Array.isArray(input)) {
    const system = input.find((msg) => msg.role === 'system')?.content ?? '';
    const other = input.filter((msg) => msg.role !== 'system');
    const raw = other.map((m) => `${m.role}: ${m.content}`).join('\n');
    return {
      instructions: system,
      messages: input,
      rawText: raw,
    };
  }

  const payload = input as StructuredPromptPayload;
  const instructions = payload.instructions ?? '';
  const inputStr = typeof payload.input === 'string' ? payload.input : JSON.stringify(payload.input);
  const history = payload.history ?? [];

  const messages: PromptMessage[] = [];
  if (instructions) {
    messages.push({ role: 'system', content: instructions });
  }
  for (const h of history) {
    messages.push(h);
  }
  const userMessage: PromptMessage = { role: 'user', content: inputStr };
  if (payload.image) {
    userMessage.image = payload.image;
  }
  messages.push(userMessage);

  return {
    instructions,
    messages,
    rawText: inputStr,
  };
}
