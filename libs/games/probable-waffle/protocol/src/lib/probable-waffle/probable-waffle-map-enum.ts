/**
 * Defines the closed probable waffle map enum classification. Use an explicit member rather than a free-form
 * string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWaffleMapEnum {
  /**
   * Selects the `Sandbox` case of {@link ProbableWaffleMapEnum}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Sandbox = 1,
  /**
   * Selects the `RiverCrossing` case of {@link ProbableWaffleMapEnum}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  RiverCrossing = 2,
  /**
   * Selects the `EmberEnclave` case of {@link ProbableWaffleMapEnum}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  EmberEnclave = 3,
  /** Test-owned, campaign-free economy map; never offered as an ordinary public choice. */
  AiOpenEconomy = 4
}
