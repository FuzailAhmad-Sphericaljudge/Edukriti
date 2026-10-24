/**
 * Mulberry32 Seeded Pseudo-Random Number Generator
 * Deterministic, reproducible, fast 32-bit PRNG.
 */
export class SeededRng {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 1;
    }
  }

  /** Returns float in range [0, 1) */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns integer in range [min, max] inclusive */
  nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(this.next() * (hi - lo + 1)) + lo;
  }

  /** Returns float in range [min, max] rounded to specified decimal places */
  nextFloat(min: number, max: number, decimals: number = 2): number {
    const raw = min + this.next() * (max - min);
    const factor = 10 ** decimals;
    return Math.round(raw * factor) / factor;
  }

  /** Selects one random element from an array */
  choice<T>(items: readonly T[] | T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = Math.floor(this.next() * items.length);
    return items[idx]!;
  }

  /** Deterministic Fisher-Yates array shuffle */
  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
  }
}

