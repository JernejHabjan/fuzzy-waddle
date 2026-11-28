/**
 * Defines the closed probable waffle map enum classification. Use an explicit member rather than a free-form
 * string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWaffleMapEnum {
  /** Freeform development sandbox; never offered as a matchmade choice. */
  Sandbox = 1,
  /** River Crossing shipped skirmish map. */
  RiverCrossing = 2,
  /** Ember Enclave shipped skirmish map. */
  EmberEnclave = 3,
  /** Test-owned, campaign-free economy map; never offered as an ordinary public choice. */
  AiOpenEconomy = 4,
  /** Test-owned three-spawn relay map; never offered as an ordinary public choice. */
  AiMultiplayer = 5,
  /** Test-owned frozen river-crossing terrain for navigation, combat and scouting cases; never offered as an ordinary public choice. */
  AiBridgeCrossing = 6
}
