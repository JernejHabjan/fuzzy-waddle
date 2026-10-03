import type { AiTransportPlanContext } from "./ai-transport-plan-context";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";
import { hasAiTransportFailedOutcome, withAiTransportPhase } from "./ai-transport-plan-state";

export function reconcileAiTransportManifest(
  plan: AiTransportPlanWithLifecycle,
  context: AiTransportPlanContext
): AiTransportPlanWithLifecycle {
  const observedActorIds = new Set(context.observation.actors.map((actor) => actor.actorId));
  const missingIndispensable = plan.lifecycle.manifest.some(
    (member) => member.indispensable && !observedActorIds.has(member.actorId)
  );
  const aliveManifest = plan.lifecycle.manifest.filter(
    (member) => member.indispensable || observedActorIds.has(member.actorId)
  );
  if (missingIndispensable || aliveManifest.length === plan.lifecycle.manifest.length) return plan;
  const aliveIds = new Set(aliveManifest.map((member) => member.actorId));
  return {
    ...plan,
    passengerIds: aliveManifest.map((member) => member.actorId),
    lifecycle: {
      ...plan.lifecycle,
      manifest: aliveManifest,
      requiredCapacity: aliveManifest.reduce((sum, member) => sum + member.seats, 0),
      seatAssignments: plan.lifecycle.seatAssignments.map((assignment) => ({
        ...assignment,
        passengerIds: assignment.passengerIds.filter((actorId) => aliveIds.has(actorId))
      }))
    }
  };
}

export function hasAiTransportArrived(plan: AiTransportPlanWithLifecycle, context: AiTransportPlanContext): boolean {
  return plan.lifecycle.manifest.every((member) => {
    const actor = context.observation.actors.find((candidate) => candidate.actorId === member.actorId);
    return Boolean(
      actor &&
        actor.containedInActorId === null &&
        actor.accessNodeId.status === "known" &&
        actor.accessNodeId.value === plan.lifecycle.route.destinationNodeId
    );
  });
}

export function applyAiTransportFailureSignals(
  plan: AiTransportPlanWithLifecycle,
  context: AiTransportPlanContext
): AiTransportPlanWithLifecycle {
  let next = plan;
  if (hasAiTransportFailedOutcome(context.state, next.lifecycle.pendingIntentIds)) {
    next = withAiTransportPhase(next, "recovering", context.observation.tick, 200, {
      terminalReason: "shared_command_failed"
    });
  }
  const observedActorIds = new Set(context.observation.actors.map((actor) => actor.actorId));
  const indispensableMissing = next.lifecycle.manifest.some(
    (member) => member.indispensable && !observedActorIds.has(member.actorId)
  );
  const transportMissing = next.lifecycle.assignedTransportIds.some(
    (actorId) => !context.observation.actors.some((actor) => actor.actorId === actorId && actor.relation === "self")
  );
  if (indispensableMissing || transportMissing || context.observation.tick >= next.lifecycle.phaseDeadline.dueTick) {
    return withAiTransportPhase(next, "recovering", context.observation.tick, 200, {
      terminalReason: indispensableMissing
        ? "indispensable_passenger_lost"
        : transportMissing
          ? "transport_lost"
          : "phase_timeout"
    });
  }
  return next;
}
