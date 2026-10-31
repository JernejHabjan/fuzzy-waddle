import type { NavigationNativeBoundary } from "../../../world/services/navigation-native-boundary";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";

/** Compact closed interval. State is sampled before capturedAtTick subscribers, never from the last planner input. */
export interface AiRuntimeProductionFrontierV1 {
  readonly capturedAtTick: number;
  readonly closedFromTick: number;
  readonly closedThroughTick: number;
  readonly afterSequence: number;
  readonly actors: readonly {
    readonly identity: AiRuntimeCreatedActorV1;
    readonly position: Vector3Simple | null;
    /** Actual native tile for interval binding; absent legacy data cannot certify an awaited route. */
    readonly tile?: Vector2Simple | null;
    readonly level: number;
  }[];
  /** Membership/capacity only. Native progress and individual payments retain their separate callback clocks. */
  readonly queues: readonly {
    readonly actorId: string;
    readonly objectName: string;
    readonly lanes: readonly {
      readonly laneId: string;
      readonly capacity: number;
      readonly itemIds: readonly string[];
    }[];
  }[];
  /** Closed native navigation milestones. The capture fences service replacement independently. */
  readonly navigation?: NavigationNativeBoundary | null;
  readonly completedResearch: readonly ResearchType[];
  /** Fair decision bindings remain valid only while every bound identity, position, weapon and visibility is unchanged. */
  readonly exposure?: {
    readonly selectedSequence: number;
    /** Aggregate diagnostic flag; a peer loss does not erase an unaffected target's entry. */
    readonly valid: boolean;
    /** Legacy omission cannot certify target-specific continuous geometry. */
    readonly validProducerIds?: readonly string[];
  };
}
