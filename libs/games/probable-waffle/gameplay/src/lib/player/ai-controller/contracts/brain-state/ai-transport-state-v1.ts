import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiDeadlineV1, AiSimulationTick, AiTransportPlanId } from "../ai-core-types";
import type { AiDemandV1 } from "../ai-plan-contracts";
import type { AiRouteRequestV1, AiRouteResultV1 } from "../ai-access-graph-v1";

/** Persisted transport phase without live actor references or promises. */
export interface AiTransportStateV1 {
  readonly planId: AiTransportPlanId;
  readonly phase:
    | "prepare"
    | "board"
    | "travel"
    | "unload"
    | "return"
    | "proposed"
    | "reserving"
    | "gather"
    | "rendezvous"
    | "boarding"
    | "transit"
    | "landing"
    | "unloading"
    | "regroup"
    | "handoff"
    | "recovering"
    | "cancelled"
    | "completed"
    | "failed";
  readonly passengerIds: readonly ActorId[];
  readonly transportIds: readonly ActorId[];
  readonly queryIds: readonly string[];
  /** Extended lifecycle is optional only for migration of earlier empty/preparatory V1 saves. */
  readonly lifecycle?: Readonly<{
    readonly missionKind: "island_establishment" | "army_transfer" | "evacuation";
    readonly route: AiRouteResultV1;
    readonly routeRequest: AiRouteRequestV1;
    readonly routeGeneration: number;
    readonly manifest: readonly {
      readonly actorId: ActorId;
      readonly role: "builder" | "protection" | "worker" | "combat" | "support";
      readonly seats: number;
      readonly indispensable: boolean;
      readonly handoff: "economy" | "squad" | "support";
    }[];
    readonly assignedTransportIds: readonly ActorId[];
    readonly seatAssignments: readonly { readonly transportId: ActorId; readonly passengerIds: readonly ActorId[] }[];
    readonly escortIds: readonly ActorId[];
    readonly assignedCapacity: number;
    readonly requiredCapacity: number;
    readonly departureCapacityPermille: number;
    readonly pickupTransferId: string | null;
    readonly landingTransferId: string | null;
    readonly phaseDeadline: AiDeadlineV1;
    readonly estimatedTravelTicks: number;
    readonly recoveryAttempt: number;
    readonly maxRecoveryAttempts: number;
    readonly lastProgressTick: AiSimulationTick;
    readonly pendingIntentIds: readonly string[];
    readonly capacityDemand: AiDemandV1 | null;
    readonly terminalReason: string | null;
  }>;
}
