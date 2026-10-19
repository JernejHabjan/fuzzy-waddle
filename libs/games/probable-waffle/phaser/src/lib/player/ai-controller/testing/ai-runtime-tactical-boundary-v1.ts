import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";

/** Privileged oracle-only native sample. Never included in the planner's observation or persisted game state. */
export interface AiRuntimeTacticalBoundaryV1 {
  readonly tick: number | null;
  readonly playerNumber: number;
  readonly informationPolicy: string;
  readonly snapshotRestoreInProgress: boolean;
  readonly gaps: readonly string[];
  readonly actors: readonly {
    readonly identity: AiRuntimeCreatedActorV1;
    readonly tile: Vector2Simple | null;
    readonly visible: boolean;
    readonly health: number | null;
    readonly armour: number | null;
    readonly combat: AiObservedActorV1["combatProfile"];
  }[];
  readonly searchPoints: readonly { readonly pointId: string; readonly tile: Vector2Simple; readonly visible: boolean }[];
  readonly rememberedCoverage: readonly {
    readonly actorId: string; readonly observedTick: number;
    readonly tiles: readonly { readonly x: number; readonly y: number; readonly visible: boolean }[];
  }[];
}
