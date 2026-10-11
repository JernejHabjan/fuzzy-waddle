import type { AiAccessTransferPointV1 } from "../contracts/ai-access-graph-v1";
import type { AiTransportPlanContext } from "./ai-transport-plan-context";
import { createAiTransportIntentBase } from "./ai-transport-plan-intents";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";
import { hasAiTransportNonTerminalOutcome, withAiTransportPhase } from "./ai-transport-plan-state";
import { isAiTransportActorNear, scoreAiTransportTransferV1 } from "./ai-transport-transfer";
import { AI_TRANSPORT_BOARDING_TIMEOUT_TICKS } from "./ai-transport-constants";

export function advanceAiTransportLanding(
  plan: AiTransportPlanWithLifecycle,
  context: AiTransportPlanContext,
  pickup: AiAccessTransferPointV1,
  landing: AiAccessTransferPointV1,
  actors: ReadonlyMap<string, AiTransportPlanContext["observation"]["actors"][number]>
): AiTransportPlanWithLifecycle {
  if (plan.phase === "transit") {
    const waiting = plan.lifecycle.assignedTransportIds.filter(
      (actorId) => !isAiTransportActorNear(actors.get(actorId), landing.carrierPosition)
    );
    if (!waiting.length) return withAiTransportPhase(plan, "landing", context.observation.tick, 200);
    const base = createAiTransportIntentBase(plan, context.observation.tick, `transit:${waiting.join("+")}`);
    if (!hasAiTransportNonTerminalOutcome(context.state, base.intentId)) {
      context.intents.push({
        ...base,
        kind: "move",
        actorIds: waiting,
        logicalPosition: landing.carrierPosition,
        claims: waiting.map((actorId) => ({
          claimId: `claim:${plan.planId}:transport:${actorId}` as const,
          kind: "actor" as const,
          actorId
        }))
      });
    }
    return plan;
  }
  if (plan.phase === "landing") {
    if (
      !context.graph ||
      context.graph.generation !== plan.lifecycle.routeGeneration ||
      scoreAiTransportTransferV1(
        pickup,
        landing,
        context.observation,
        plan.lifecycle.routeRequest.capabilities.requiredClearance
      ) < 0
    ) {
      return withAiTransportPhase(plan, "recovering", context.observation.tick, 200, {
        terminalReason: "landing_revalidation_failed"
      });
    }
    return withAiTransportPhase(plan, "unloading", context.observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS);
  }
  if (plan.phase === "unloading") {
    const loaded = plan.passengerIds.filter((actorId) => {
      const containerId = actors.get(actorId)?.containedInActorId;
      return containerId !== null && containerId !== undefined;
    });
    if (!loaded.length) return withAiTransportPhase(plan, "regroup", context.observation.tick, 300);
    for (const assignment of plan.lifecycle.seatAssignments) {
      const passengers = assignment.passengerIds.filter((actorId) => loaded.includes(actorId));
      if (!passengers.length) continue;
      const base = createAiTransportIntentBase(
        plan,
        context.observation.tick,
        `unload:${assignment.transportId}:${passengers.join("+")}`
      );
      if (hasAiTransportNonTerminalOutcome(context.state, base.intentId)) continue;
      context.intents.push({
        ...base,
        kind: "unload",
        transportId: assignment.transportId,
        passengerIds: passengers,
        logicalPosition: landing.passengerPosition,
        claims: [
          {
            claimId: `claim:${plan.planId}:transport:${assignment.transportId}`,
            kind: "actor",
            actorId: assignment.transportId
          },
          { claimId: `claim:${plan.planId}:landing`, kind: "site", siteKey: landing.transferId }
        ]
      });
    }
    return plan;
  }
  const route = plan.lifecycle.route;
  const notArrived = plan.passengerIds.filter((actorId) => {
    const accessNodeId = actors.get(actorId)?.accessNodeId;
    return accessNodeId?.status !== "known" || accessNodeId.value !== route.destinationNodeId;
  });
  if (!notArrived.length) return withAiTransportPhase(plan, "handoff", context.observation.tick, 1);
  const base = createAiTransportIntentBase(plan, context.observation.tick, `regroup:${notArrived.join("+")}`);
  if (!hasAiTransportNonTerminalOutcome(context.state, base.intentId)) {
    context.intents.push({
      ...base,
      kind: "move",
      actorIds: notArrived,
      logicalPosition: landing.passengerPosition,
      claims: notArrived.map((actorId) => ({
        claimId: `claim:${plan.planId}:regroup:${actorId}` as const,
        kind: "actor" as const,
        actorId
      }))
    });
  }
  return plan;
}
