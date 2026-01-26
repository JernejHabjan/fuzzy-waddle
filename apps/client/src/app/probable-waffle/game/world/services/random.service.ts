import Phaser from "phaser";

/**
 * RandomService provides deterministic random number generation using Phaser's
 * RandomDataGenerator seeded with the gameInstanceId.
 *
 * This ensures that all clients in a multiplayer game produce identical random
 * sequences, enabling deterministic lock-stepping for perfect synchronization.
 */
export class RandomService {
  private readonly rng: Phaser.Math.RandomDataGenerator;

  /**
   * @param seed - The seed value (derived from gameInstanceId) for deterministic randomness
   */
  constructor(seed: string) {
    this.rng = new Phaser.Math.RandomDataGenerator([seed]);
  }

  /**
   * Returns a random float between 0 (inclusive) and 1 (exclusive)
   * Equivalent to Math.random()
   */
  random(): number {
    return this.rng.frac();
  }

  /**
   * Returns a random float between 0 (inclusive) and 1 (exclusive)
   * Alias for random()
   */
  frac(): number {
    return this.rng.frac();
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   */
  between(min: number, max: number): number {
    return this.rng.between(min, max);
  }

  /**
   * Returns a random element from the provided array
   * @param array - Array to pick from
   * @returns Random element from the array
   */
  pick<T>(array: T[]): T {
    return this.rng.pick(array);
  }

  /**
   * Shuffles the provided array in-place using Fisher-Yates algorithm
   * @param array - Array to shuffle
   * @returns The shuffled array (same reference)
   */
  shuffle<T>(array: T[]): T[] {
    return this.rng.shuffle(array);
  }

  /**
   * Returns a random integer between 0 (inclusive) and maxExclusive (exclusive)
   * @param maxExclusive - Maximum value (exclusive)
   */
  integerInRange(maxExclusive: number): number {
    return Math.floor(this.rng.frac() * maxExclusive);
  }

  /**
   * Returns the underlying Phaser RandomDataGenerator for advanced usage
   */
  getRNG(): Phaser.Math.RandomDataGenerator {
    return this.rng;
  }
}
