
/**
 * Defines the closed probable waffle player type classification. Use an explicit member rather than a
 * free-form string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWafflePlayerType {
  /**
   * Selects the `Human` case of {@link ProbableWafflePlayerType}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Human = 0,
  /**
   * Selects the `AI` case of {@link ProbableWafflePlayerType}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  AI = 1,
  /**
   * Selects the `NetworkOpen` case of {@link ProbableWafflePlayerType}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  NetworkOpen = 2
}
