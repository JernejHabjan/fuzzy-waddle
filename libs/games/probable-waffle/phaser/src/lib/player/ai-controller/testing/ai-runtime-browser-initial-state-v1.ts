/** Pre-tick actor facts independently measured after ordinary and preset actors are indexed. */
export interface AiRuntimeBrowserInitialStateV1 {
  readonly ownedActorCount: number;
  readonly workerCount: number;
  readonly ownedActorNames: readonly string[];
}
