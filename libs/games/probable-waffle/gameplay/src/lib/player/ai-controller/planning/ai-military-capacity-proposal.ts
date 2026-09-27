import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { selectConstructionPosition } from "./ai-construction-site-selector";
import { plannedAiProducerCount } from "./ai-force-capacity";
import { nextIds, unresolvedReservedEffectIds } from "./ai-macro-effect-identity";
import { claimedActorIds, isAvailableBuilder, isFinishedActor } from "./ai-macro-observation";
import { producerMilitaryProducts } from "./ai-military-catalog";
import { createAiResourceCostClaims } from "./ai-resource-cost-claims";

/** Proposes throughput only when a dated force deficit needs more producer capacity. */
export function proposeAiMilitaryCapacity(args: {
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly catalog: AiCapabilityCatalogV1;
  readonly self: readonly AiObservationV1["actors"][number][];
  readonly pressureDomain: "ground" | "air";
  readonly targetMilitary: number;
  readonly militaryCount: number;
  readonly queuedMilitaryCount: number;
  readonly openingComplete: boolean;
  readonly workforceRecoveryOwnsFood: boolean;
  readonly reservedActorIds: ReadonlySet<string>;
  readonly selectedConstructionTileKeys: Set<string>;
  readonly priorIntents: readonly AiIntentV1[];
  readonly ordinal: number;
}): {
  readonly demand: AiDemandV1 | null;
  readonly intent: AiIntentV1 | null;
  readonly producers: readonly AiObservationV1["actors"][number][];
} {
  const {
    observation, state, catalog, self, pressureDomain, targetMilitary, militaryCount, queuedMilitaryCount,
    openingComplete, workforceRecoveryOwnsFood, reservedActorIds, selectedConstructionTileKeys, priorIntents, ordinal
  } = args;
  const producers = self
    .filter(isFinishedActor)
    .filter((actor) => producerMilitaryProducts(actor.objectName, catalog, pressureDomain).length > 0)
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const primaryObjectName = producers[0]?.objectName;
  if (!primaryObjectName) return { demand: null, intent: null, producers };
  const desiredCount = openingComplete ? plannedAiProducerCount(targetMilitary, militaryCount, queuedMilitaryCount) : 1;
  const constructing = self
    .filter((actor) => actor.objectName === primaryObjectName && !isFinishedActor(actor))
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const acceptedEffectIds = unresolvedReservedEffectIds(state, `effect:capacity:${primaryObjectName}:effect:`);
  const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === primaryObjectName);
  const demandId = "demand:capacity:first-army" as AiDemandV1["demandId"];
  const demand: AiDemandV1 = {
    demandId,
    purpose: "dated_military_throughput",
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
  const alreadyClaimed = claimedActorIds(priorIntents);
  const builder = self
    .filter(isAvailableBuilder)
    .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
    .filter((actor) =>
      catalog.entries.some(
        (candidate) => candidate.sourceObjectName === actor.objectName && candidate.constructs.includes(primaryObjectName)
      )
    )
    .sort((left, right) => {
      const leftIdle = left.activeOrder?.status === "known" && left.activeOrder.value === null ? 1 : 0;
      const rightIdle = right.activeOrder?.status === "known" && right.activeOrder.value === null ? 1 : 0;
      return leftIdle - rightIdle || left.actorId.localeCompare(right.actorId);
    })[0];
  if (!builder) return { demand, intent: null, producers };
  const position = selectConstructionPosition(
    observation,
    builder,
    state.scheduler.decisionSequence,
    ordinal,
    selectedConstructionTileKeys,
    entry?.constructionProfile?.footprintRadiusTiles ?? 0
  );
  if (!position) return { demand, intent: null, producers };
  const next = nextIds(state, `capacity:${primaryObjectName}`, ordinal);
  const intent: AiIntentV1 = {
    ...next,
    kind: "construct",
    spendingCategory: "defense",
    planId: state.opening.plan.planId,
    demandId,
    lane: "supply_production",
    proposedTick: observation.tick,
    urgencyClass: 3,
    utility: 640,
    preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
    claims: [
      {
        claimId: `${next.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
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
        claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
        kind: "effect",
        effectId: next.effectId
      }
    ],
    reasonCode: `capacity:dated_target=${targetMilitary}:ready=${producers.length}:committed=${committed}/${desiredCount}`,
    builderIds: [builder.actorId],
    objectName: primaryObjectName,
    logicalPosition: position,
    siteKey: `capacity:${primaryObjectName}:${position.x}:${position.y}`
  };
  return { demand, intent, producers };
}
