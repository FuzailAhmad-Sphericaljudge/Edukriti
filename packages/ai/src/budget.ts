import type { TokenUsage } from './types.ts';

export class TokenBudgetTracker {
  private usedTokens = 0;
  private maxTokens: number;

  constructor(maxTokens = 500_000) {
    this.maxTokens = maxTokens;
  }

  get remaining(): number {
    return Math.max(0, this.maxTokens - this.usedTokens);
  }

  get totalUsed(): number {
    return this.usedTokens;
  }

  get limit(): number {
    return this.maxTokens;
  }

  setLimit(maxTokens: number) {
    this.maxTokens = maxTokens;
  }

  recordUsage(usage?: Partial<TokenUsage>) {
    if (!usage) return;
    const tokens = usage.totalTokens ?? ((usage.promptTokens ?? 0) + (usage.completionTokens ?? 0));
    this.usedTokens += tokens;
  }

  hasBudgetFor(estimatedTokens = 1000): boolean {
    return this.usedTokens + estimatedTokens <= this.maxTokens;
  }

  reset() {
    this.usedTokens = 0;
  }
}

export function estimateTokens(input: unknown): number {
  if (!input) return 0;
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  let tokens = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    tokens += code > 127 ? 0.65 : 0.25;
  }
  return Math.max(1, Math.ceil(tokens));
}

export const globalTokenBudget = new TokenBudgetTracker();
