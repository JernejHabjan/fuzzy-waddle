import type { AiAccessTransferPointV1 } from "../contracts/ai-access-graph-v1";
import type { AiTransportPlanContext } from "./ai-transport-plan-context";
import { createAiTransportIntentBase } from "./ai-transport-plan-intents";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";
import { hasAiTransportNonTerminalOutcome, withAiTransportPhase } from "./ai-transport-plan-state";
import { isAiTransportActorNear } from "./ai-transport-transfer";
import { AI_TRANSPORT_BOARDING_TIMEOUT_TICKS } from "./ai-transport-constants";

export function advanceAiTransportLoading(
  plan: AiTransportPlanWithLifecycle,
  context: AiTransportPlanContext,
  pickup: AiAccessTransferPointV1,
  actors: ReadonlyMap<string, AiTransportPlanContext["observation"]["actors"][number]>
): AiTransportPlanWithLifecycle {
  if (plan.phase === "gather") {
    const waiting = plan.passengerIds.filter(
      (actorId) => !isAiTransportActorNear(actors.get(actorId), pickup.passengerPosition)
    );
    if (!waiting.length)
      return withAiTransportPhase(plan, "rendezvous", context.observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS);
    const base = createAiTransportIntentBase(plan, context.observation.tick, `gather:${waiting.join("+")}`);
    if (!hasAiTransportNonTerminalOutcome(context.state, base.intentId)) {
      context.intents.push({
        ...base,
        kind: "move",
        actorIds: waiting,
        logicalPosition: pickup.passengerPosition,
        claims: [
          ...waiting.map((actorId) => ({
            claimId: `claim:${plan.planId}:passenger:${actorId}` as const,
            kind: "actor" as const,
            actorId
          })),
          { claimId: `claim:${plan.planId}:rendezvous`, kind: "site", siteKey: pickup.transferId }
        ]
      });
    }
    return plan;
  }
  if (plan.phase === "rendezvous") {
    const waiting = plan.lifecycle.assignedTransportIds.filter(
      (actorId) => !isAiTransportActorNear(actors.get(actorId), pickup.carrierPosition)
    );
    if (!waiting.length)
      return withAiTransportPhase(plan, "boarding", context.observation.tick, AI_TRANSPORT_BOARDING_TIMEOUT_TICKS);
    const base = createAiTransportIntentBase(plan, context.observation.tick, `rendezvous:${waiting.join("+")}`);
    if (!hasAiTransportNonTerminalOutcome(context.state, base.intentId)) {
      context.intents.push({
        ...base,
        kind: "move",
        actorIds: waiting,
        logicalPosition: pickup.carrierPosition,
        claims: waiting.map((actorId) => ({
          claimId: `claim:${plan.planId}:transport:${actorId}` as const,
          kind: "actor" as const,
          actorId
        }))
      });
    }
    return plan;
  }
  const onboardIds = new Set(
    plan.lifecycle.assignedTransportIds.flatMap((actorId) => {
      const containerState = actors.get(actorId)?.containerState;
      return containerState?.status === "known" ? containerState.value.passengerIds : [];
    })
  );
  const indispensableReady = plan.lifecycle.manifest
    .filter((member) => member.indispensable)
    .every((member) => onboardIds.has(member.actorId));
  const boardedSeats = plan.lifecycle.manifest
    .filter((member) => onboardIds.has(member.actorId))
    .reduce((sum, member) => sum + member.seats, 0);
  if (
    indispensableReady &&
    boardedSeats * 1000 >= plan.lifecycle.requiredCapacity * plan.lifecycle.departureCapacityPermille
  ) {
    return withAiTransportPhase(
      plan,
      "transit",
      context.observation.tick,
      Math.max(600, 2 * plan.lifecycle.estimatedTravelTicks)
    );
  }
  for (const assignment of plan.lifecycle.seatAssignments) {
    const waiting = assignment.passengerIds.filter((actorId) => !onboardIds.has(actorId));
    if (!waiting.length) continue;
    const waitingSeats = plan.lifecycle.manifest
      .filter((member) => waiting.includes(member.actorId))
      .reduce((total, member) => total + member.seats, 0);
    const base = createAiTransportIntentBase(
      plan,
      context.observation.tick,
      `board:${assignment.transportId}:${waiting.join("+")}`
    );
    if (hasAiTransportNonTerminalOutcome(context.state, base.intentId)) continue;
    context.intents.push({
      ...base,
      kind: "board",
      actorIds: waiting,
      transportId: assignment.transportId,
      claims: [
        ...waiting.map((actorId) => ({
          claimId: `claim:${plan.planId}:passenger:${actorId}` as const,
          kind: "actor" as const,
          actorId
        })),
        {
          claimId: `claim:${plan.planId}:transport:${assignment.transportId}`,
          kind: "actor",
          actorId: assignment.transportId
        },
        {
          claimId: `claim:${plan.planId}:seats:${assignment.transportId}`,
          kind: "cargo_seat",
          transportId: assignment.transportId,
          seats: waitingSeats
        }
      ]
    });
  }
  return plan;
}
