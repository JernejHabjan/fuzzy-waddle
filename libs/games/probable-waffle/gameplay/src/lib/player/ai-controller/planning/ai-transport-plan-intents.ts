import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";

export function createAiTransportCapacityDemand(
  plan: AiTransportPlanWithLifecycle,
  preferredObjectNames: readonly ObjectNames[]
): AiDemandV1 {
  const lifecycle = plan.lifecycle;
  return {
    demandId: `demand:transport:${plan.planId}`,
    purpose: `transport_capacity:${plan.planId}`,
    capabilityOrRole: lifecycle.route.kind === "water_transport" ? "water_transport" : "air_transport",
    unit: "cargo_seats",
    desired: lifecycle.requiredCapacity,
    satisfiedActorIds: lifecycle.assignedTransportIds,
    queuedIds: [],
    constructingIds: [],
    acceptedNotObservedEffectIds: [],
    preferredObjectNames: [...preferredObjectNames].sort(),
    resourceObligations: {}
  };
}

export function createAiTransportIntentBase(plan: AiTransportPlanWithLifecycle, tick: number, suffix: string) {
  const attempt = `r${plan.lifecycle.recoveryAttempt}`;
  return {
    intentId: `intent:${plan.planId}:${attempt}:${suffix}` as const,
    effectId: `effect:${plan.planId}:${attempt}:${suffix}` as const,
    planId: `plan:${plan.planId}` as const,
    demandId: plan.lifecycle.capacityDemand?.demandId ?? null,
    lane: "army_threat" as const,
    proposedTick: tick,
    urgencyClass: 4,
    utility: 650,
    preconditions: [{ kind: "plan_active" as const, planId: `plan:${plan.planId}` as const }],
    reasonCode: `transport_${plan.phase}`
  };
}
