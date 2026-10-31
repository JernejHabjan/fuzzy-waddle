
/**
 * Defines the closed faction type classification. Use an explicit member rather than a free-form string so
 * branching, persistence, and diagnostics share the same vocabulary.
 */
export enum FactionType {
  /**
   * Selects the `Tivara` case of {@link FactionType}. Use this explicit member when the surrounding flow
   * requires this distinct policy or state; never substitute a free-form string.
   */
  Tivara = 1,
  /**
   * Selects the `Skaduwee` case of {@link FactionType}. Use this explicit member when the surrounding flow
   * requires this distinct policy or state; never substitute a free-form string.
   */
  Skaduwee = 2
}
