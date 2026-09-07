import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessNodeId, AiSimulationTick } from "./ai-core-types";
import type { AiDomainV1 } from "./ai-observation-v1";

/** Stable access-region description derived from one authoritative topology revision. */
export interface AiAccessRegionV1 {
  readonly nodeId: AiAccessNodeId;
  readonly domain: AiDomainV1;
  readonly elevation: number;
  readonly knowledge: "known_static" | "observed_dynamic" | "unknown";
  readonly representativePosition: Vector3Simple;
  readonly tileCount: number;
  /** Largest square footprint, in logical tiles, known to fit in this region. */
  readonly clearance: number;
}

/** Traversable adjacency between compact same-domain regions, including clearance bottlenecks. */
export interface AiAccessLinkV1 {
  readonly linkId: string;
  readonly fromNodeId: AiAccessNodeId;
  readonly toNodeId: AiAccessNodeId;
  readonly domain: AiDomainV1;
  readonly clearance: number;
  readonly distanceCost: number;
  readonly knowledge: "known_static" | "observed_dynamic" | "unknown";
}

/** Executable boundary between two access regions; it is geography, not an exclusive mission claim. */
export interface AiAccessTransferPointV1 {
  readonly transferId: string;
  readonly kind: "shore" | "air_pickup" | "air_drop";
  readonly fromNodeId: AiAccessNodeId;
  readonly toNodeId: AiAccessNodeId;
  readonly passengerPosition: Vector3Simple;
  readonly carrierPosition: Vector3Simple;
  readonly clearance: number;
  readonly knowledge: "known_static" | "observed_dynamic" | "unknown";
}

/** Cached immutable multi-domain topology published at a completed generation boundary. */
export interface AiAccessGraphV1 {
  readonly schemaVersion: 1;
  readonly generation: number;
  readonly status: "ready" | "pending" | "service_failed";
  readonly staticRevision: number;
  readonly dynamicRevision: number;
  readonly threatRevision: number;
  readonly builtTick: AiSimulationTick;
  readonly continuationCursor: number;
  readonly nodes: readonly AiAccessRegionV1[];
  readonly links: readonly AiAccessLinkV1[];
  readonly transferPoints: readonly AiAccessTransferPointV1[];
  readonly unknownNodeIds: readonly AiAccessNodeId[];
}

/** Route capabilities are executable facts derived from current actor definitions and assigned capacity. */
export interface AiRouteCapabilityV1 {
  readonly moverDomains: readonly AiDomainV1[];
  readonly targetDomains: readonly AiDomainV1[];
  readonly waterTransportSeats: number;
  readonly airTransportSeats: number;
  /** A legal catalog path exists even when no carrier is currently complete. */
  readonly canProduceWaterTransport?: boolean;
  readonly canProduceAirTransport?: boolean;
  readonly requiredPassengerSeats: number;
  readonly requiredClearance: number;
}

/** One deterministic route request against a specific graph generation. */
export interface AiRouteRequestV1 {
  readonly queryId: string;
  readonly kind: "movement" | "firing_position";
  readonly fromNodeId: AiAccessNodeId;
  readonly toNodeId: AiAccessNodeId;
  readonly capabilities: AiRouteCapabilityV1;
  /** Legal firing regions around an occupied target; the target tile itself is never assumed traversable. */
  readonly firingNodeIds: readonly AiAccessNodeId[];
}

interface AiRouteResultBaseV1 {
  readonly queryId: string;
  readonly graphGeneration: number;
  readonly sourceNodeId: AiAccessNodeId;
  readonly destinationNodeId: AiAccessNodeId;
  readonly distanceCost: number;
  readonly riskCost: number;
  readonly requiredAssets: readonly ("ground_force" | "water_transport" | "air_transport" | "naval_force" | "air_force")[];
}

/** Typed route result; callers cannot turn pending knowledge or service failure into unreachable terrain. */
export type AiRouteResultV1 =
  | (AiRouteResultBaseV1 & {
      readonly kind: "direct";
      readonly domain: AiDomainV1;
      readonly routeNodeIds: readonly AiAccessNodeId[];
      readonly firingNodeId: AiAccessNodeId | null;
    })
  | (AiRouteResultBaseV1 & {
      readonly kind: "water_transport" | "air_transport";
      readonly pickupCandidates: readonly AiAccessTransferPointV1[];
      readonly landingCandidates: readonly AiAccessTransferPointV1[];
      readonly minimumSeats: number;
    })
  | (AiRouteResultBaseV1 & {
      readonly kind: "air_or_naval_objective";
      readonly domain: "air" | "water";
      readonly firingNodeId: AiAccessNodeId;
    })
  | (AiRouteResultBaseV1 & {
      readonly kind: "pending";
      readonly reason: "graph_pending" | "unknown_region" | "optional_query_pending";
    })
  | (AiRouteResultBaseV1 & {
      readonly kind: "impossible";
      readonly reason:
        | "missing_source_region"
        | "missing_destination_region"
        | "insufficient_clearance"
        | "no_compatible_domain"
        | "no_executable_transfer"
        | "service_failed";
    });
