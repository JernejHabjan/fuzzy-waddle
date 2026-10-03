import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRouteRequestV1, AiRouteResultV1 } from "../contracts/ai-access-graph-v1";
import type { AiTransportPlanId } from "../contracts/ai-core-types";

export interface CreateAiTransportPlanV1Input {
  readonly planId: AiTransportPlanId;
  readonly routeRequest: AiRouteRequestV1;
  readonly route: Extract<AiRouteResultV1, { readonly kind: "water_transport" | "air_transport" }>;
  readonly tick: number;
  readonly missionKind: "island_establishment" | "army_transfer" | "evacuation";
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
