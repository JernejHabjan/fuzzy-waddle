import type { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";

/** Installation-time owned sites. Presence supplies no map/setup identity, placement history or paid liability. */
export interface AiRuntimeInitialConstructionV1 {
  readonly tick: number;
  readonly snapshotRestoreInProgress: boolean;
  readonly sites: readonly {
    readonly site: AiRuntimeCreatedActorV1;
    readonly state: ConstructionStateEnum;
    /** Actual saved work counter in milliseconds, not elapsed time or a completion deadline. */
    readonly remainingWorkMs: number;
  }[];
  /** Overflow discards the whole player's inventory; a read failure cannot establish complete membership. */
  readonly gaps: readonly string[];
}
