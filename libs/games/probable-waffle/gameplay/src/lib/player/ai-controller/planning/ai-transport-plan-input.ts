import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRouteRequest, AiRouteResult } from "../contracts/ai-access-graph";
import type { AiTransportPlanId } from "../contracts/ai-core-types";
import type { AiTransportState } from "../contracts/ai-brain-state";

export interface CreateAiTransportPlanInput {
  readonly planId: AiTransportPlanId;
  readonly routeRequest: AiRouteRequest;
  readonly route: Extract<AiRouteResult, { readonly kind: "water_transport" | "air_transport" }>;
  readonly tick: number;
  readonly missionKind: "island_establishment" | "army_transfer" | "evacuation";
  readonly establishment?: NonNullable<AiTransportState["lifecycle"]>["establishment"];
  readonly estimatedTravelTicks: number;
  readonly passengers: readonly {
    readonly actorId: ActorId;
    readonly role: "builder" | "protection" | "worker" | "combat" | "support";
    readonly seats?: number;
    readonly indispensable: boolean;
    readonly handoff: "economy" | "squad" | "support";
  }[];
  readonly escortIds?: readonly ActorId[];
}
