import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiObservedActor } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeCreatedActor } from "../harness/capture/ai-runtime-created-actor";

/** Privileged oracle-only native sample. Never included in the planner's observation or persisted game state. */
export interface AiRuntimeTacticalBoundary {
  readonly tick: number | null;
  readonly playerNumber: number;
  readonly informationPolicy: string;
  readonly snapshotRestoreInProgress: boolean;
  readonly gaps: readonly string[];
  /** Actual public team/defeat state; used only to audit mission retargeting. */
  readonly players?: readonly { readonly playerNumber: number; readonly team: number; readonly defeated: boolean }[];
  readonly actors: readonly {
    readonly identity: AiRuntimeCreatedActor;
    readonly tile: Vector2Simple | null;
    readonly visible: boolean;
    readonly health: number | null;
    readonly armour: number | null;
    readonly combat: AiObservedActor["combatProfile"];
    /** Exact native transport membership at this decision boundary; missing legacy data cannot prove a landing. */
    readonly containerId?: string | null;
    readonly passengerIds?: readonly string[];
  }[];
  readonly searchPoints: readonly { readonly pointId: string; readonly tile: Vector2Simple; readonly visible: boolean }[];
  readonly rememberedCoverage: readonly {
    readonly actorId: string; readonly observedTick: number;
    readonly tiles: readonly { readonly x: number; readonly y: number; readonly visible: boolean }[];
  }[];
}
