import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";

/** Detached native ScoreDamage callback after health/armour application, not a prediction of damage or weapon legality. */
export interface AiRuntimeDamageV1 {
  readonly target: AiRuntimeCreatedActorV1;
  readonly initiator: AiRuntimeCreatedActorV1 | null;
  readonly targetInCaptureScene: boolean;
  readonly initiatorInCaptureScene: boolean;
  /** Native scaled damage argument; armour can absorb it, so this is not an inferred health delta. */
  readonly amount: number;
  readonly healthAfter: number | null;
  readonly armourAfter: number | null;
  /** Native HealthComponent's damage clock must match the enclosing callback clock. */
  readonly damageTick: number | null;
  readonly sceneActive: boolean;
  readonly snapshotRestoreInProgress: boolean;
}
