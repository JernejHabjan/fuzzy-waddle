import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiDemand } from "../../../contracts/planning/ai-plan-contracts";
import { selectAiMilitaryCapacitySite } from "./ai-military-capacity-site";
import { plannedAiProducerCount } from "./ai-force-capacity";
import { nextIds, unresolvedReservedEffectIds } from "../macro/ai-macro-effect-identity";
import { claimedActorIds, isAvailableBuilder, isFinishedActor } from "../macro/ai-macro-observation";
import { producerMilitaryProducts } from "./ai-military-catalog";
import { createAiResourceCostClaims } from "../../economy/forecast/ai-resource-cost-claims";
import type { AiProductionTransition } from "../../../contracts/state/ai-production-transition";
import { canAffordAiEconomyCost } from "../../economy/service/ai-economy-policy";
import { needsAiProducerResilience, observedAiProducerThreats } from "../../construction/ai-producer-safety";

/** Proposes throughput only when a dated force deficit needs more producer capacity. */
export function proposeAiMilitaryCapacity(args: {
  readonly observation: AiObservation;
  readonly state: AiBrainState;
  readonly catalog: AiCapabilityCatalog;
  readonly self: readonly AiObservation["actors"][number][];
  readonly pressureDomain: "ground" | "air";
  readonly targetMilitary: number;
  readonly militaryCount: number;
  readonly queuedMilitaryCount: number;
  readonly openingComplete: boolean;
  readonly workforceRecoveryOwnsFood: boolean;
  readonly reservedActorIds: ReadonlySet<string>;
  readonly selectedConstructionTileKeys: Set<string>;
  readonly priorIntents: readonly AiIntent[];
  readonly ordinal: number;
  readonly transition?: AiProductionTransition;
}): {
  readonly demand: AiDemand | null;
  readonly intent: AiIntent | null;
  readonly producers: readonly AiObservation["actors"][number][];
} {
  const {
    observation,
    state,
    catalog,
    self,
    pressureDomain,
    targetMilitary,
    militaryCount,
    queuedMilitaryCount,
    openingComplete,
    workforceRecoveryOwnsFood,
    reservedActorIds,
    selectedConstructionTileKeys,
    priorIntents,
    ordinal,
    transition
  } = args;
  const producers = self
    .filter(isFinishedActor)
    .filter((actor) => {
      const products = producerMilitaryProducts(actor.objectName, catalog, pressureDomain);
      return transition?.status === "committed" ? products.includes(transition.productObjectName) : products.length > 0;
    })
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const assessment = state.strategy.assessment;
  const usefulDeficit =
    assessment && ["pressure", "finish"].includes(assessment.choice)
      ? Math.max(0, Math.min(targetMilitary, assessment.requiredForce) - militaryCount - queuedMilitaryCount)
      : 0;
  // A completed opening records past progress; it cannot certify that its producer survived an unanticipated loss.
  const lostProducerDemand =
    producers.length === 0 &&
    (usefulDeficit > 0 || (openingComplete && targetMilitary > militaryCount + queuedMilitaryCount))
      ? state.economyProduction.demands.find(
          (demand) =>
            (demand.purpose === "critical_producer_resilience" ||
              (openingComplete && demand.purpose === "first_military_producer")) &&
            demand.preferredObjectNames.some(
              (objectName) => producerMilitaryProducts(objectName, catalog, pressureDomain).length > 0
            )
        )
      : undefined;
  const primaryObjectName =
    transition?.status === "committed"
      ? transition.producerObjectName
      : (producers[0]?.objectName ?? lostProducerDemand?.preferredObjectNames[0]);
  if (!primaryObjectName) return { demand: null, intent: null, producers };
  const resilient =
    openingComplete &&
    (lostProducerDemand !== undefined || needsAiProducerResilience(observation, producers, usefulDeficit));
  const throughput =
    transition?.status === "committed"
      ? transition.desiredProducers
      : openingComplete
        ? plannedAiProducerCount(targetMilitary, militaryCount, queuedMilitaryCount)
        : 1;
  const desiredCount = resilient ? Math.max(throughput, producers.length + 1) : throughput;
  const constructing = self
    .filter((actor) => actor.objectName === primaryObjectName && !isFinishedActor(actor))
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const acceptedEffectIds = unresolvedReservedEffectIds(state, `effect:capacity:${primaryObjectName}:effect:`);
  const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === primaryObjectName);
  const demandId =
    transition?.status === "committed"
      ? (`demand:capacity:${transition.planId}` as const)
      : ("demand:capacity:first-army" as AiDemand["demandId"]);
  const demand: AiDemand = {
    demandId,
    purpose: resilient ? "critical_producer_resilience" : "dated_military_throughput",
    capabilityOrRole: primaryObjectName,
    unit: "work_per_horizon",
    desired: desiredCount,
    satisfiedActorIds: producers.map((actor) => actor.actorId),
    queuedIds: [],
    constructingIds: constructing.map((actor) => actor.actorId),
    acceptedNotObservedEffectIds: acceptedEffectIds,
    preferredObjectNames: [primaryObjectName],
    resourceObligations: entry?.constructionProfile?.resourceCost ?? {}
  };
  const committed = producers.length + constructing.length + acceptedEffectIds.length;
  if (!openingComplete || workforceRecoveryOwnsFood || committed >= desiredCount) {
    return { demand, intent: null, producers };
  }
  if (
    (resilient || transition?.status === "committed") &&
    (!entry?.constructionProfile || !canAffordAiEconomyCost(observation, entry.constructionProfile.resourceCost))
  )
    return { demand, intent: null, producers };
  const alreadyClaimed = claimedActorIds(priorIntents);
  const builders = self
    .filter(isAvailableBuilder)
    .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
    .filter((actor) =>
      catalog.entries.some(
        (candidate) =>
          candidate.sourceObjectName === actor.objectName && candidate.constructs.includes(primaryObjectName)
      )
    )
    .sort((left, right) => {
      const leftIdle = left.activeOrder?.status === "known" && left.activeOrder.value === null ? 1 : 0;
      const rightIdle = right.activeOrder?.status === "known" && right.activeOrder.value === null ? 1 : 0;
      return rightIdle - leftIdle || left.actorId.localeCompare(right.actorId);
    });
  const safePolicy = resilient || transition?.status === "committed";
  const threats = safePolicy ? observedAiProducerThreats(observation) : [];
  const selected = selectAiMilitaryCapacitySite({
    observation,
    builders,
    decisionSequence: state.scheduler.decisionSequence,
    ordinal,
    selectedTileKeys: selectedConstructionTileKeys,
    footprintRadiusTiles: entry?.constructionProfile?.footprintRadiusTiles ?? 0,
    safePolicy,
    threats
  });
  if (!selected) return { demand, intent: null, producers };
  const { builder, position } = selected;
  const next = nextIds(state, `capacity:${primaryObjectName}`, ordinal);
  const intent: AiIntent = {
    ...next,
    kind: "construct",
    spendingCategory: "defense",
    planId: transition?.status === "committed" ? transition.planId : state.opening.plan.planId,
    demandId,
    lane: "supply_production",
    proposedTick: observation.tick,
    urgencyClass: 3,
    utility: 640,
    preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
    claims: [
      {
        claimId: `${next.claimId}:builder` as AiIntent["claims"][number]["claimId"],
        kind: "actor",
        actorId: builder.actorId
      },
      {
        claimId: next.claimId,
        kind: "site",
        siteKey: `capacity:${primaryObjectName}:${position.x}:${position.y}`
      },
      ...createAiResourceCostClaims(next.claimId, entry?.constructionProfile?.resourceCost ?? {}),
      {
        claimId: `${next.claimId}:effect` as AiIntent["claims"][number]["claimId"],
        kind: "effect",
        effectId: next.effectId
      }
    ],
    reasonCode:
      `capacity:dated_target=${targetMilitary}:ready=${producers.length}:committed=${committed}/${desiredCount}` +
      (resilient
        ? lostProducerDemand
          ? ":critical_recovery"
          : ":critical_exposed"
        : transition?.status === "committed"
          ? `:future=${transition.beginsTick}`
          : ""),
    builderIds: [builder.actorId],
    objectName: primaryObjectName,
    logicalPosition: position,
    siteKey: `capacity:${primaryObjectName}:${position.x}:${position.y}`
  };
  return { demand, intent, producers };
}
