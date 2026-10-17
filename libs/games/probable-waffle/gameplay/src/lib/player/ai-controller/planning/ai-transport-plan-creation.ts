import { aiDeadline } from "../contracts/ai-core-types";
import type { AiTransportStateV1 } from "../contracts/ai-brain-state-v1";
import {
  AI_TRANSPORT_BOARDING_TIMEOUT_TICKS,
  AI_TRANSPORT_MINIMUM_DEPARTURE_PERMILLE,
  MAX_TRANSPORT_RECOVERY_ATTEMPTS
} from "./ai-transport-constants";
import type { CreateAiTransportPlanV1Input } from "./ai-transport-plan-input";

/** Creates a save-safe mission; no live object or Promise crosses this boundary. */
export function createAiTransportPlanV1(input: CreateAiTransportPlanV1Input): AiTransportStateV1 {
  const manifest = [...input.passengers]
    .map((passenger) => ({ ...passenger, seats: passenger.seats ?? 1 }))
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const requiredCapacity = manifest.reduce((total, passenger) => total + passenger.seats, 0);
  if (requiredCapacity <= 0 || !manifest.some((passenger) => passenger.indispensable)) {
    throw new Error("invalid_ai_transport_manifest");
  }
  if (
    input.missionKind === "island_establishment" &&
    (!manifest.some((passenger) => passenger.role === "builder" && passenger.indispensable) ||
      !manifest.some((passenger) => passenger.role === "protection" && passenger.indispensable))
  ) {
    throw new Error("invalid_ai_island_establishment_manifest");
  }
  return {
    planId: input.planId,
    phase: "proposed",
    passengerIds: manifest.map((passenger) => passenger.actorId),
    transportIds: [],
    queryIds: [input.routeRequest.queryId],
    lifecycle: {
      missionKind: input.missionKind,
      route: input.route,
      routeRequest: input.routeRequest,
      routeGeneration: input.route.graphGeneration,
      manifest,
      assignedTransportIds: [],
      seatAssignments: [],
      escortIds: [...(input.escortIds ?? [])].sort(),
      assignedCapacity: 0,
      requiredCapacity,
      departureCapacityPermille: AI_TRANSPORT_MINIMUM_DEPARTURE_PERMILLE,
      pickupTransferId: null,
      landingTransferId: null,
      phaseDeadline: aiDeadline(input.tick + AI_TRANSPORT_BOARDING_TIMEOUT_TICKS),
      estimatedTravelTicks: Math.max(1, Math.floor(input.estimatedTravelTicks)),
      recoveryAttempt: 0,
      maxRecoveryAttempts: MAX_TRANSPORT_RECOVERY_ATTEMPTS,
      lastProgressTick: input.tick,
      pendingIntentIds: [],
      capacityDemand: null,
      terminalReason: null
    }
  };
}
