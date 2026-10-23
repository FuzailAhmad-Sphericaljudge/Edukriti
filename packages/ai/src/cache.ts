export class AiCache {
  private cache = new Map<string, { value: unknown; timestamp: number }>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = 500, ttlMs = 1000 * 60 * 60 * 24) { // 24 hour default TTL
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  static createKey(prefix: string, input: unknown): string {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    }
    return `${prefix}:${hash.toString(36)}`;
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const globalAiCache = new AiCache();
