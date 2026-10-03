import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import { AI_TRANSPORT_BOARDING_TIMEOUT_TICKS } from "./ai-transport-constants";
import type { AiTransportPlanContext } from "./ai-transport-plan-context";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";
import { withAiTransportPhase } from "./ai-transport-plan-state";

export function recoverAiTransportPlan(
  plan: AiTransportPlanWithLifecycle,
  context: AiTransportPlanContext
): AiTransportPlanWithLifecycle {
  if (!context.graph || context.graph.status !== "ready") {
    if (context.observation.tick < plan.lifecycle.phaseDeadline.dueTick) return plan;
    const pendingAttempt = plan.lifecycle.recoveryAttempt + 1;
    if (pendingAttempt > plan.lifecycle.maxRecoveryAttempts) {
      return withAiTransportPhase(plan, "cancelled", context.observation.tick, 1, {
        assignedTransportIds: [],
        seatAssignments: [],
        assignedCapacity: 0,
        terminalReason: "route_pending_exhausted"
      });
    }
    return withAiTransportPhase(plan, "recovering", context.observation.tick, 200, {
      recoveryAttempt: pendingAttempt,
      terminalReason: "route_pending"
    });
  }
  const route = queryAiAccessRouteV1(context.graph, plan.lifecycle.routeRequest);
  if (route.kind === "pending") {
    if (context.observation.tick < plan.lifecycle.phaseDeadline.dueTick) return plan;
    const pendingAttempt = plan.lifecycle.recoveryAttempt + 1;
    if (pendingAttempt > plan.lifecycle.maxRecoveryAttempts) {
      return withAiTransportPhase(plan, "cancelled", context.observation.tick, 1, {
        terminalReason: "route_pending_exhausted"
      });
    }
    return withAiTransportPhase(plan, "recovering", context.observation.tick, 200, {
      recoveryAttempt: pendingAttempt,
      terminalReason: `route_${route.reason}`
    });
  }
  const attempt = plan.lifecycle.recoveryAttempt + 1;
  if (attempt > plan.lifecycle.maxRecoveryAttempts) {
    return withAiTransportPhase(plan, "cancelled", context.observation.tick, 1, {
      assignedTransportIds: [],
      seatAssignments: [],
      assignedCapacity: 0,
      terminalReason: plan.lifecycle.terminalReason ?? "recovery_exhausted"
    });
  }
  if (route.kind !== "water_transport" && route.kind !== "air_transport") {
    return withAiTransportPhase(plan, "cancelled", context.observation.tick, 200, {
      recoveryAttempt: attempt,
      terminalReason: `route_${route.kind}`
    });
  }
  return withAiTransportPhase(plan, "reserving", context.observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS, {
    route,
    routeGeneration: route.graphGeneration,
    recoveryAttempt: attempt,
    assignedTransportIds: [],
    seatAssignments: [],
    assignedCapacity: 0,
    pickupTransferId: null,
    landingTransferId: null,
    terminalReason: null
  });
}
