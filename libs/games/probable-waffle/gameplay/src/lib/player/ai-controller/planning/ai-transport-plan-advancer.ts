import type { AiTransportPlanContext } from "./ai-transport-plan-context";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";
import { advanceAiTransportLanding } from "./ai-transport-plan-landing";
import { advanceAiTransportLoading } from "./ai-transport-plan-loading";
import { claimAiTransportPlanOwnership } from "./ai-transport-plan-ownership";
import {
  applyAiTransportFailureSignals,
  hasAiTransportArrived,
  reconcileAiTransportManifest
} from "./ai-transport-plan-preflight";
import { recoverAiTransportPlan } from "./ai-transport-plan-recovery";
import { reserveAiTransportPlan } from "./ai-transport-plan-reservation";
import { withAiTransportPhase } from "./ai-transport-plan-state";
import { AI_TRANSPORT_BOARDING_TIMEOUT_TICKS } from "./ai-transport-constants";

export function advanceAiTransportPlan(
  original: AiTransportPlanWithLifecycle,
  context: AiTransportPlanContext
): AiTransportPlanWithLifecycle {
  const intentStart = context.intents.length;
  if (["completed", "cancelled", "failed"].includes(original.phase)) return original;
  let plan = original;
  if (plan.phase === "handoff") {
    return withAiTransportPhase(
      { ...plan, passengerIds: [], transportIds: [] },
      "completed",
      context.observation.tick,
      1,
      {
        assignedTransportIds: [],
        seatAssignments: [],
        assignedCapacity: 0,
        terminalReason: "handoff_complete"
      }
    );
  }
  const ownershipResult = claimAiTransportPlanOwnership(plan, context);
  if (ownershipResult) return ownershipResult;
  plan = reconcileAiTransportManifest(plan, context);
  if (hasAiTransportArrived(plan, context)) {
    return withAiTransportPhase(plan, "handoff", context.observation.tick, 1, {
      terminalReason: "cargo_survived_at_destination"
    });
  }
  plan = applyAiTransportFailureSignals(plan, context);
  if (plan.phase === "recovering") return recoverAiTransportPlan(plan, context);
  if (plan.phase === "proposed") {
    return withAiTransportPhase(plan, "reserving", context.observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS);
  }
  if (plan.phase === "reserving") return reserveAiTransportPlan(plan, context);
  const route = plan.lifecycle.route;
  if (route.kind !== "water_transport" && route.kind !== "air_transport") {
    return withAiTransportPhase(plan, "failed", context.observation.tick, 1, {
      terminalReason: "invalid_transport_route"
    });
  }
  if (
    !context.graph ||
    context.graph.status !== "ready" ||
    context.graph.generation !== plan.lifecycle.routeGeneration
  ) {
    return withAiTransportPhase(plan, "recovering", context.observation.tick, 200, {
      terminalReason: "route_generation_invalidated"
    });
  }
  const pickup = route.pickupCandidates.find((point) => point.transferId === plan.lifecycle.pickupTransferId);
  const landing = route.landingCandidates.find((point) => point.transferId === plan.lifecycle.landingTransferId);
  if (!pickup || !landing) {
    return withAiTransportPhase(plan, "recovering", context.observation.tick, 200, {
      terminalReason: "transfer_invalidated"
    });
  }
  const actors = new Map(context.observation.actors.map((actor) => [actor.actorId, actor] as const));
  if (["gather", "rendezvous", "boarding"].includes(plan.phase)) {
    const invalidCarrier = plan.lifecycle.assignedTransportIds.some((actorId) => {
      const container = actors.get(actorId)?.containerState;
      const assignedPassengerIds =
        plan.lifecycle.seatAssignments.find((assignment) => assignment.transportId === actorId)?.passengerIds ?? [];
      const assignedSeats = plan.lifecycle.manifest
        .filter((member) => assignedPassengerIds.includes(member.actorId))
        .reduce((total, member) => total + member.seats, 0);
      return (
        container?.status !== "known" ||
        container.value.capacity < assignedSeats ||
        container.value.passengerIds.some((passengerId) => !plan.passengerIds.includes(passengerId))
      );
    });
    if (invalidCarrier) {
      return withAiTransportPhase(plan, "recovering", context.observation.tick, 200, {
        terminalReason: "carrier_capacity_or_ownership_changed"
      });
    }
  }
  const advanced = ["gather", "rendezvous", "boarding"].includes(plan.phase)
    ? advanceAiTransportLoading(plan, context, pickup, actors)
    : advanceAiTransportLanding(plan, context, pickup, landing, actors);
  const pendingIntentIds = [
    ...new Set([
      ...advanced.lifecycle.pendingIntentIds,
      ...context.intents.slice(intentStart).map((intent) => intent.intentId)
    ])
  ].sort();
  return { ...advanced, lifecycle: { ...advanced.lifecycle, pendingIntentIds } };
}
