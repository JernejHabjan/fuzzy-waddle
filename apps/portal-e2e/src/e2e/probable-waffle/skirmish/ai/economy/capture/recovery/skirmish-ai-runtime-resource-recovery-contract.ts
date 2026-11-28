/** Fixed physical recovery trigger; it cannot be replaced by starting cash or a newly proposed job. */
export interface RuntimeResourceRecoveryContract {
  readonly latestTick: number;
  readonly sourceFixtureActorId: string;
  readonly sourceStock: number;
  readonly workerFixtureActorId: string;
  readonly fieldFixtureActorId: string;
  readonly dropOffFixtureActorId: string;
  readonly lossEventId: string;
}
