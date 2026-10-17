import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBaseId, AiSimulationTick, AiTransportPlanId } from "../ai-core-types";

/** Base identity and assigned assets; geometry stays in bounded observation/query products. */
export interface AiBaseStateV1 {
  readonly baseId: AiBaseId;
  readonly anchorActorId: ActorId | null;
  readonly memberActorIds: readonly ActorId[];
  readonly active: boolean;
  /** Main structures retain identity; proposed expansion sites have no live anchor until construction applies. */
  readonly lifecycle?: "proposed" | "reserved" | "establishing" | "active" | "evacuating" | "lost";
  readonly accessNodeId?: string | null;
  readonly anchorPosition?: { readonly x: number; readonly y: number; readonly z: number } | null;
  readonly reservedSiteKey?: string | null;
  readonly rejectedSiteKeys?: readonly {
    readonly siteKey: string;
    readonly retryAfterTick: AiSimulationTick;
    readonly reason: string;
  }[];
  readonly expansion?: Readonly<{
    readonly trigger: "resource_life" | "worker_capacity" | "manual";
    readonly requestedAtTick: AiSimulationTick;
    readonly transportPlanId: AiTransportPlanId | null;
    readonly evacuationRouteNodeId: string | null;
  }>;
}
