import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBaseId, AiFortificationPlanId, AiSimulationTick } from "../ai-core-types";
import type { AiFortificationNodeStateV1 } from "./ai-fortification-node-state-v1";

/** Persisted wall/tower graph identity and bounded construction state. */
export interface AiFortificationStateV1 {
  readonly planId: AiFortificationPlanId;
  readonly nodeIds: readonly string[];
  readonly completedNodeIds: readonly string[];
  readonly protectedBaseIds: readonly AiBaseId[];
  readonly lifecycle: "planned" | "building" | "active" | "breached" | "abandoned";
  /** Optional for migration; the fortification planner owns this executable, bounded graph description. */
  readonly graph?: Readonly<{
    readonly baseId: AiBaseId;
    readonly createdTick: AiSimulationTick;
    readonly terrainAnchorTileKeys: readonly string[];
    readonly openingNodeId: string;
    readonly protectedAssetIds: readonly ActorId[];
    readonly wholeConnectivity: "preserved" | "rejected" | "unknown";
    readonly incrementalConnectivity: "preserved" | "rejected" | "unknown";
    readonly budget: Readonly<{
      readonly spendPermille: number;
      readonly committedByResource: Readonly<Partial<Record<ResourceType, number>>>;
      readonly remainingByResource: Readonly<Partial<Record<ResourceType, number>>>;
    }>;
    readonly nodes: readonly AiFortificationNodeStateV1[];
    /** Stable topological build order; unlike keyed node sets this sequence is not sorted during save. */
    readonly constructionSequenceNodeIds: readonly string[];
    readonly defenderPosts: readonly {
      readonly nodeId: string;
      readonly assignedActorIds: readonly ActorId[];
      readonly reachable: boolean;
    }[];
    readonly breach: Readonly<{
      readonly missingNodeIds: readonly string[];
      readonly reason: string | null;
      readonly risk: "none" | "low" | "medium" | "high";
      readonly responseEffectId: string | null;
      readonly recoveryAttempts: number;
    }>;
  }>;
}
