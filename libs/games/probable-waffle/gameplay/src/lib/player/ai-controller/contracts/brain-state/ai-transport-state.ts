import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiDeadline, AiSimulationTick, AiTransportPlanId } from "../ai-core-types";
import type { AiDemand } from "../ai-plan-contracts";
import type { AiRouteRequest, AiRouteResult } from "../ai-access-graph";
import type { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Persisted transport phase without live actor references or promises. */
export interface AiTransportState {
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
  /** Extended lifecycle is optional only for migration of earlier empty/preparatory current saves. */
  readonly lifecycle?: Readonly<{
    readonly missionKind: "island_establishment" | "army_transfer" | "evacuation";
    /** Definition-priced foothold budget, retained through landing until the native service purchase is committed. */
    readonly establishment?: Readonly<{ sourceActorId: ActorId; serviceObjectName: ObjectNames;
      resourceCost: Readonly<Partial<Record<ResourceType, number>>> }>;
    readonly route: AiRouteResult;
    readonly routeRequest: AiRouteRequest;
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
    readonly phaseDeadline: AiDeadline;
    readonly estimatedTravelTicks: number;
    readonly recoveryAttempt: number;
    readonly maxRecoveryAttempts: number;
    readonly lastProgressTick: AiSimulationTick;
    readonly pendingIntentIds: readonly string[];
    readonly capacityDemand: AiDemand | null;
    readonly terminalReason: string | null;
  }>;
}
