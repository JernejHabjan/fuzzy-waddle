import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessNodeId, AiSimulationTick } from "./ai-core-types";
import type { AiDomain } from "./ai-observation";

/** Stable access-region description derived from one authoritative topology revision. */
export interface AiAccessRegion {
  readonly nodeId: AiAccessNodeId;
  readonly domain: AiDomain;
  readonly elevation: number;
  readonly knowledge: "known_static" | "observed_dynamic" | "unknown";
  readonly representativePosition: Vector3Simple;
  readonly tileCount: number;
  /** Largest square footprint, in logical tiles, known to fit in this region. */
  readonly clearance: number;
}

/** Traversable adjacency between compact same-domain regions, including clearance bottlenecks. */
export interface AiAccessLink {
  readonly linkId: string;
  readonly fromNodeId: AiAccessNodeId;
  readonly toNodeId: AiAccessNodeId;
  readonly domain: AiDomain;
  readonly clearance: number;
  readonly distanceCost: number;
  readonly knowledge: "known_static" | "observed_dynamic" | "unknown";
  /** Ground height transitions may be one-way; water adjacency is bidirectional. */
  readonly directional?: boolean;
}

/** Executable boundary between two access regions; it is geography, not an exclusive mission claim. */
export interface AiAccessTransferPoint {
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
export interface AiAccessGraph {
  readonly schemaVersion: 1;
  readonly generation: number;
  readonly status: "ready" | "pending" | "service_failed";
  readonly staticRevision: number;
  readonly dynamicRevision: number;
  readonly threatRevision: number;
  readonly builtTick: AiSimulationTick;
  readonly continuationCursor: number;
  readonly nodes: readonly AiAccessRegion[];
  readonly links: readonly AiAccessLink[];
  readonly transferPoints: readonly AiAccessTransferPoint[];
  readonly unknownNodeIds: readonly AiAccessNodeId[];
}

/** Route capabilities are executable facts derived from current actor definitions and assigned capacity. */
export interface AiRouteCapability {
  readonly moverDomains: readonly AiDomain[];
  readonly targetDomains: readonly AiDomain[];
  readonly waterTransportSeats: number;
  readonly airTransportSeats: number;
  /** A legal catalog path exists even when no carrier is currently complete. */
  readonly canProduceWaterTransport?: boolean;
  readonly canProduceAirTransport?: boolean;
  readonly requiredPassengerSeats: number;
  readonly requiredClearance: number;
}

/** One deterministic route request against a specific graph generation. */
export interface AiRouteRequest {
  readonly queryId: string;
  readonly kind: "movement" | "firing_position";
  readonly fromNodeId: AiAccessNodeId;
  readonly toNodeId: AiAccessNodeId;
  readonly capabilities: AiRouteCapability;
  /** Legal firing regions around an occupied target; the target tile itself is never assumed traversable. */
  readonly firingNodeIds: readonly AiAccessNodeId[];
}

interface AiRouteResultBase {
  readonly queryId: string;
  readonly graphGeneration: number;
  readonly sourceNodeId: AiAccessNodeId;
  readonly destinationNodeId: AiAccessNodeId;
  readonly distanceCost: number;
  readonly riskCost: number;
  readonly requiredAssets: readonly (
    | "ground_force"
    | "water_transport"
    | "air_transport"
    | "naval_force"
    | "air_force"
  )[];
}

/** Typed route result; callers cannot turn pending knowledge or service failure into unreachable terrain. */
export type AiRouteResult =
  | (AiRouteResultBase & {
      readonly kind: "direct";
      readonly domain: AiDomain;
      readonly routeNodeIds: readonly AiAccessNodeId[];
      readonly firingNodeId: AiAccessNodeId | null;
    })
  | (AiRouteResultBase & {
      readonly kind: "water_transport" | "air_transport";
      readonly pickupCandidates: readonly AiAccessTransferPoint[];
      readonly landingCandidates: readonly AiAccessTransferPoint[];
      readonly minimumSeats: number;
    })
  | (AiRouteResultBase & {
      readonly kind: "air_or_naval_objective";
      readonly domain: "air" | "water";
      readonly firingNodeId: AiAccessNodeId;
    })
  | (AiRouteResultBase & {
      readonly kind: "pending";
      readonly reason: "graph_pending" | "unknown_region" | "optional_query_pending";
    })
  | (AiRouteResultBase & {
      readonly kind: "impossible";
      readonly reason:
        | "missing_source_region"
        | "missing_destination_region"
        | "insufficient_clearance"
        | "no_compatible_domain"
        | "no_executable_transfer"
        | "service_failed";
    });
