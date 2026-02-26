/**
 * Seeded Random Number Generator für deterministische Tests
 * 
 * Verwendet Linear Congruential Generator (LCG) Algorithmus
 * für reproduzierbare Zufallszahlen bei gleichem Seed.
 * 
 * @example
 * ```typescript
 * const rng = new SeededRandom(42);
 * const randomValue = rng.next(); // Immer gleich bei seed=42
 * const shuffled = rng.shuffle(['A', 'B', 'C']);
 * ```
 */
export class SeededRandom {
  private seed: number;
  
  /**
   * @param seed - Initial seed value. Default: current timestamp
   */
  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }
  
  /**
   * Generates next random number between 0 and 1
   * @returns Random number [0, 1)
   */
  next(): number {
    // Linear Congruential Generator
    // https://en.wikipedia.org/wiki/Linear_congruential_generator
    this.seed = (this.seed * 1664525 + 1013904223) % 2**32;
    return this.seed / 2**32;
  }
  
  /**
   * Returns random integer between min (inclusive) and max (exclusive)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
  
  /**
   * Fisher-Yates shuffle algorithm with seeded random
   * @param array - Array to shuffle
   * @returns New shuffled array
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * Returns random element from array
   * @param array - Array to pick from
   */
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
  
  /**
   * Returns true with given probability
   * @param probability - Probability between 0 and 1
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}
