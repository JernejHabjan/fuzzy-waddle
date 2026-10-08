
/**
 * Defines the closed probable waffle ai difficulty classification. Use an explicit member rather than a
 * free-form string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWaffleAiDifficulty {
  /**
   * Selects the `Easy` case of {@link ProbableWaffleAiDifficulty}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Easy = 0,
  /**
   * Selects the `Medium` case of {@link ProbableWaffleAiDifficulty}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  Medium = 1,
  /**
   * Selects the `Hard` case of {@link ProbableWaffleAiDifficulty}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Hard = 2
}
