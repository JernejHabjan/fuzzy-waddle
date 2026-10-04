/** Defines deterministic passive healing for an actor with a health component. */
export type HealthRegenerationDefinition = {
  /** Health restored once per second by the actor's deterministic simulation clock. */
  readonly regenerateHealthRate: number;
};
