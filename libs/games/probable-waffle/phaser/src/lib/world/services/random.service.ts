import Phaser from "phaser";
import type { DeterministicRandomState } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * RandomService provides deterministic random number generation using Phaser's
 * RandomDataGenerator seeded with the rndSeed.
 *
 * This ensures that all clients in a multiplayer game produce identical random
 * sequences, enabling deterministic lock-stepping for perfect synchronization.
 */
export class RandomService {
  private readonly rng: Phaser.Math.RandomDataGenerator;
  private operationCount = 0;

  /**
   * @param seed - The seed value (derived from rndSeed) for deterministic randomness
   */
  constructor(seed: string) {
    this.rng = new Phaser.Math.RandomDataGenerator([seed]);
  }

  /**
   * Returns a random float between 0 (inclusive) and 1 (exclusive)
   * Equivalent to Math.random()
   */
  random(): number {
    this.operationCount += 1;
    return this.rng.frac();
  }

  /**
   * Returns a random float between 0 (inclusive) and 1 (exclusive)
   * Alias for random()
   */
  frac(): number {
    this.operationCount += 1;
    return this.rng.frac();
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   */
  between(min: number, max: number): number {
    this.operationCount += 1;
    return this.rng.between(min, max);
  }

  /**
   * Returns a random element from the provided array
   * @param array - Array to pick from
   * @returns Random element from the array
   */
  pick<T>(array: T[]): T {
    this.operationCount += 1;
    return this.rng.pick(array);
  }

  /**
   * Shuffles the provided array in-place using Fisher-Yates algorithm
   * @param array - Array to shuffle
   * @returns The shuffled array (same reference)
   */
  shuffle<T>(array: T[]): T[] {
    this.operationCount += 1;
    return this.rng.shuffle(array);
  }

  getState(): DeterministicRandomState {
    return { schemaVersion: 1, generatorState: this.rng.state(), operationCount: this.operationCount };
  }

  restoreState(state: DeterministicRandomState): void {
    const generatorParts = state.generatorState.split(",");
    if (
      state.schemaVersion !== 1 ||
      !state.generatorState.startsWith("!rnd,") ||
      generatorParts.length !== 5 ||
      generatorParts.slice(1).some((value) => !Number.isFinite(Number(value))) ||
      !Number.isSafeInteger(state.operationCount) ||
      state.operationCount < 0
    ) {
      throw new Error("Unsupported deterministic random state");
    }
    this.rng.state(state.generatorState);
    this.operationCount = state.operationCount;
  }

  /**
   * Returns the underlying Phaser RandomDataGenerator for advanced usage
   */
  getRNG(): Phaser.Math.RandomDataGenerator {
    return this.rng;
  }
}
