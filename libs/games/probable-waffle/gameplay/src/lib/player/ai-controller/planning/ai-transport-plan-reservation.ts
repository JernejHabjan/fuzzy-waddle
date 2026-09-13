import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiTransportPlanContext } from "./ai-transport-plan-context";
import { createAiTransportCapacityDemand, createAiTransportIntentBase } from "./ai-transport-plan-intents";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";
import { hasAiTransportNonTerminalOutcome, withAiTransportPhase } from "./ai-transport-plan-state";
import { assignAiTransportSeats, chooseAiTransportTransfers, mobileAiTransportActors } from "./ai-transport-transfer";
import { AI_TRANSPORT_BOARDING_TIMEOUT_TICKS } from "./ai-transport-constants";

function findAiTransportEntries(catalog: AiCapabilityCatalogV1 | undefined, plan: AiTransportPlanWithLifecycle) {
  const domain = plan.lifecycle.route.kind === "water_transport" ? "water" : "air";
  return (
    catalog?.entries
      .filter((entry) => entry.cargoCapacity !== null && entry.movementDomains.includes(domain))
      .sort((left, right) => left.sourceObjectName.localeCompare(right.sourceObjectName)) ?? []
  );
}

export function reserveAiTransportPlan(
  plan: AiTransportPlanWithLifecycle,
  context: AiTransportPlanContext
): AiTransportPlanWithLifecycle {
  const route = plan.lifecycle.route;
  if (route.kind !== "water_transport" && route.kind !== "air_transport") {
    return withAiTransportPhase(plan, "cancelled", context.observation.tick, 200, {
      terminalReason: `route_${route.kind}`
    });
  }
  const candidates = mobileAiTransportActors(context.observation, route.kind, new Set(plan.passengerIds));
  const assigned = assignAiTransportSeats(candidates, plan.lifecycle.manifest, plan.lifecycle.requiredCapacity);
  const transportEntries = findAiTransportEntries(context.catalog, plan);
  const demand = createAiTransportCapacityDemand(
    plan,
    transportEntries.map((entry) => entry.sourceObjectName)
  );
  if (assigned.capacity < plan.lifecycle.requiredCapacity) {
    const option = transportEntries[0];
    const producer = option
      ? context.observation.actors
          .filter((actor) => actor.relation === "self" && actor.queue.status === "known")
          .find((actor) =>
            context.catalog?.entries.some(
              (entry) => entry.sourceObjectName === actor.objectName && entry.produces.includes(option.sourceObjectName)
            )
          )
      : undefined;
    if (option && producer) {
      const suffix = `capacity:${option.sourceObjectName}`;
      const base = createAiTransportIntentBase(plan, context.observation.tick, suffix);
      if (!hasAiTransportNonTerminalOutcome(context.state, base.intentId)) {
        context.intents.push({
          ...base,
          kind: "produce",
          producerId: producer.actorId,
          objectName: option.sourceObjectName,
          demandId: demand.demandId,
          preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
          claims: [
            {
              claimId: `claim:${plan.planId}:capacity:${producer.actorId}`,
              kind: "production_slot",
              producerId: producer.actorId,
              slot: 0
            },
            { claimId: `claim:${plan.planId}:capacity-effect`, kind: "effect", effectId: base.effectId }
          ]
        });
      }
    }
    context.reasons.push(
      `transport_capacity_wait:${plan.planId}:${assigned.capacity}/${plan.lifecycle.requiredCapacity}`
    );
    return {
      ...plan,
      transportIds: assigned.transportIds,
      lifecycle: {
        ...plan.lifecycle,
        capacityDemand: demand,
        assignedCapacity: assigned.capacity,
        assignedTransportIds: assigned.transportIds,
        seatAssignments: assigned.assignments
      }
    };
  }
  const transfers = chooseAiTransportTransfers(
    route,
    context.observation,
    plan.lifecycle.routeRequest.capabilities.requiredClearance,
    plan.lifecycle.recoveryAttempt
  );
  if (!transfers) {
    return withAiTransportPhase(plan, "recovering", context.observation.tick, 200, {
      terminalReason: "no_safe_transfer"
    });
  }
  return withAiTransportPhase(
    { ...plan, transportIds: assigned.transportIds },
    "gather",
    context.observation.tick,
    AI_TRANSPORT_BOARDING_TIMEOUT_TICKS,
    {
      assignedTransportIds: assigned.transportIds,
      seatAssignments: assigned.assignments,
      assignedCapacity: assigned.capacity,
      capacityDemand: { ...demand, satisfiedActorIds: assigned.transportIds },
      pickupTransferId: transfers.pickup.transferId,
      landingTransferId: transfers.landing.transferId
    }
  );
}
