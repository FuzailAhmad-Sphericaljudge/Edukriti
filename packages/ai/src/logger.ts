const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/g,
  /sk-[a-zA-Z0-9_-]{20,}/g,
  /Bearer\s+[a-zA-Z0-9._-]+/gi,
  /key=[a-zA-Z0-9_-]{10,}/gi,
  /apiKey=[a-zA-Z0-9_-]{10,}/gi,
  /password=[^&\s]+/gi,
  /secret=[^&\s]+/gi,
];

export function sanitizeSecrets(text: string): string {
  let sanitized = text;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

export function sanitizeObject<T>(input: T): T {
  if (typeof input === 'string') {
    return sanitizeSecrets(input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('key') ||
        lower.includes('secret') ||
        lower.includes('auth') ||
        lower.includes('token') ||
        lower.includes('password')
      ) {
        copy[key] = '[REDACTED]';
      } else {
        copy[key] = sanitizeObject(value);
      }
    }
    return copy as T;
  }
  return input;
}

export type AiLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type AiLogEvent = {
  provider: string;
  action: 'generateStructured' | 'generateText' | 'stream' | 'embed' | 'retry' | 'fallback';
  model?: string;
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  status: 'start' | 'success' | 'retry' | 'fallback' | 'error';
  error?: string;
  meta?: Record<string, unknown>;
};

class AiLogger {
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  log(event: AiLogEvent) {
    if (!this.enabled) return;
    const sanitized = sanitizeObject(event);
    const prefix = `[AI][${sanitized.provider}][${sanitized.action}][${sanitized.status.toUpperCase()}]`;
    const details = [
      sanitized.model ? `model=${sanitized.model}` : '',
      sanitized.durationMs !== undefined ? `${sanitized.durationMs}ms` : '',
      sanitized.promptTokens !== undefined ? `in=${sanitized.promptTokens}` : '',
      sanitized.completionTokens !== undefined ? `out=${sanitized.completionTokens}` : '',
      sanitized.error ? `error="${sanitized.error}"` : '',
    ].filter(Boolean).join(' ');

    if (sanitized.status === 'error') {
      console.error(`${prefix} ${details}`.trim());
    } else if (sanitized.status === 'retry' || sanitized.status === 'fallback') {
      console.warn(`${prefix} ${details}`.trim());
    } else {
      console.info(`${prefix} ${details}`.trim());
    }
  }
}

export const aiLogger = new AiLogger();
