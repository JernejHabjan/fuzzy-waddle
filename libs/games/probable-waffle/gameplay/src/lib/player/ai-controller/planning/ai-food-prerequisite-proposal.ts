import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { selectConstructionPosition } from "./ai-construction-site-selector";
import { canAffordAiEconomyCost } from "./ai-economy-policy";
import { nextIds, unresolvedReservedEffectIds } from "./ai-macro-effect-identity";
import { claimedActorIds, isAvailableBuilder, isFinishedActor } from "./ai-macro-observation";
import { createAiResourceCostClaims } from "./ai-resource-cost-claims";

/** Keeps food drop-off throughput proportional to demanded Field capacity. */
export function proposeAiFoodPrerequisite(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  self: readonly AiObservationV1["actors"][number][],
  foodSourceEntry: AiCapabilityCatalogV1["entries"][number] | undefined,
  desiredFoodSources: number,
  reservedActorIds: ReadonlySet<string>,
  selectedConstructionTileKeys: Set<string>,
  priorIntents: readonly AiIntentV1[],
  ordinal: number
) {
  const objectName = foodSourceEntry?.constructionProfile?.requiredObjectNames?.[0];
  const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === objectName);
  const desired = objectName && desiredFoodSources > 0 ? Math.max(1, Math.ceil(desiredFoodSources / 4)) : 0;
  const ready = objectName
    ? self.filter((actor) => actor.objectName === objectName && isFinishedActor(actor))
    : [];
  const constructing = objectName
    ? self.filter((actor) => actor.objectName === objectName && !isFinishedActor(actor))
    : [];
  const accepted = objectName
    ? unresolvedReservedEffectIds(state, `effect:food-prerequisite:${objectName}:effect:`)
    : [];
  const committed = ready.length + constructing.length + accepted.length;
  if (desired <= 0 || !objectName || !entry) {
    return { objectName, ready, demand: null, intent: null };
  }
  const demandId = "demand:economy:food-prerequisite" as AiDemandV1["demandId"];
  const demand: AiDemandV1 = {
    demandId,
    purpose: "food_drop_off_capacity",
    capabilityOrRole: objectName,
    unit: "actor_count",
    desired,
    satisfiedActorIds: ready.map((actor) => actor.actorId),
    queuedIds: [],
    constructingIds: constructing.map((actor) => actor.actorId),
    acceptedNotObservedEffectIds: accepted,
    preferredObjectNames: [objectName],
    resourceObligations: entry.constructionProfile?.resourceCost ?? {}
  };
  if (committed >= desired || !canAffordAiEconomyCost(observation, entry.constructionProfile?.resourceCost ?? {})) {
    return { objectName, ready, demand, intent: null };
  }
  const alreadyClaimed = claimedActorIds(priorIntents);
  const builder = self
    .filter(isAvailableBuilder)
    .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
    .filter((actor) =>
      catalog.entries.some(
        (candidate) => candidate.sourceObjectName === actor.objectName && candidate.constructs.includes(objectName)
      )
    )
    .sort((left, right) => left.actorId.localeCompare(right.actorId))[0];
  if (!builder) return { objectName, ready, demand, intent: null };
  const position = selectConstructionPosition(
    observation,
    builder,
    state.scheduler.decisionSequence,
    ordinal,
    selectedConstructionTileKeys,
    entry.constructionProfile?.footprintRadiusTiles ?? 0
  );
  if (!position) return { objectName, ready, demand, intent: null };
  const next = nextIds(state, `food-prerequisite:${objectName}`, ordinal);
  const intent: AiIntentV1 = {
    ...next,
    kind: "construct",
    spendingCategory: ready.length === 0 ? "survival" : "economy",
    planId: state.opening.plan.planId,
    demandId,
    lane: "essential_economy",
    proposedTick: observation.tick,
    urgencyClass: ready.length === 0 ? 0 : 2,
    utility: ready.length === 0 ? 930 : 760,
    preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
    claims: [
      {
        claimId: `${next.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
        kind: "actor",
        actorId: builder.actorId
      },
      { claimId: next.claimId, kind: "site", siteKey: `food-prerequisite:${objectName}:${position.x}:${position.y}` },
      ...createAiResourceCostClaims(next.claimId, entry.constructionProfile?.resourceCost ?? {}),
      {
        claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
        kind: "effect",
        effectId: next.effectId
      }
    ],
    reasonCode: `food_prerequisite:${objectName}:ready=${ready.length}:committed=${committed}/${desired}`,
    builderIds: [builder.actorId],
    objectName,
    logicalPosition: position,
    siteKey: `food-prerequisite:${objectName}:${position.x}:${position.y}`
  };
  return { objectName, ready, demand, intent };
}
