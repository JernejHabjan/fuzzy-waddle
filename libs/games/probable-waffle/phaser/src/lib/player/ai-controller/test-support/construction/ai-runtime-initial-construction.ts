import type { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeCreatedActor } from "../harness/capture/ai-runtime-created-actor";

/** Installation-time owned sites. Presence supplies no map/setup identity, placement history or paid liability. */
export interface AiRuntimeInitialConstruction {
  readonly tick: number;
  readonly snapshotRestoreInProgress: boolean;
  readonly sites: readonly {
    readonly site: AiRuntimeCreatedActor;
    readonly state: ConstructionStateEnum;
    /** Actual saved work counter in milliseconds, not elapsed time or a completion deadline. */
    readonly remainingWorkMs: number;
  }[];
  /** Overflow discards the whole player's inventory; a read failure cannot establish complete membership. */
  readonly gaps: readonly string[];
}
