import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiSimulationTick } from "../ai-core-types";

/** Stable constructible or reserved-opening node within one fortification graph. */
export interface AiFortificationNodeStateV1 {
  readonly nodeId: string;
  readonly kind: "wall" | "tower" | "stair" | "gate_slot";
  readonly objectName: ObjectNames | null;
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  readonly footprintTileKeys: readonly string[];
  readonly navigation: Readonly<{
    readonly navigableHeight: number | null;
    readonly enterHeight: number | null;
    readonly exitHeight: number | null;
  }> | null;
  readonly componentId: string;
  readonly dependsOnNodeId: string | null;
  readonly lifecycle: "planned" | "requested" | "finished" | "destroyed" | "abandoned";
  readonly completedActorId: ActorId | null;
  readonly attempt: number;
  readonly effectId: string | null;
  readonly retryAfterTick: AiSimulationTick;
  readonly marginalCoverage: number;
  readonly targetDomains: readonly ("ground" | "water" | "air")[];
  readonly defenderPostReachable: boolean;
}
