import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiDemand } from "../../../contracts/planning/ai-plan-contracts";
import { selectConstructionPosition } from "../../construction/ai-construction-site-selector";
import { reachableAiAccessNodeIds } from "../../access/ai-access-graph";
import { canAffordAiEconomyCost } from "../service/ai-economy-policy";
import { nextIds, unresolvedReservedEffectIds } from "../../production/macro/ai-macro-effect-identity";
import { claimedActorIds, isAvailableBuilder, isFinishedActor } from "../../production/macro/ai-macro-observation";
import { createAiResourceCostClaims } from "../forecast/ai-resource-cost-claims";
import { ObjectNames, type ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Keeps food drop-off throughput proportional to demanded Field capacity. */
export function proposeAiFoodPrerequisite(
  observation: AiObservation,
  state: AiBrainState,
  catalog: AiCapabilityCatalog,
  self: readonly AiObservation["actors"][number][],
  foodSourceEntry: AiCapabilityCatalog["entries"][number] | undefined,
  desiredFoodSources: number,
  reservedActorIds: ReadonlySet<string>,
  selectedConstructionTileKeys: Set<string>,
  priorIntents: readonly AiIntent[],
  ordinal: number,
  resourceReserve: Readonly<Partial<Record<ResourceType, number>>> = {}
) {
  const objectName = foodSourceEntry?.constructionProfile?.requiredObjectNames?.[0];
  const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === objectName);
  const desired = objectName && desiredFoodSources > 0 ? Math.max(1, Math.ceil(desiredFoodSources / 4)) : 0;
  const ready = objectName ? self.filter((actor) => actor.objectName === objectName && isFinishedActor(actor)) : [];
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
  const demandId = "demand:economy:food-prerequisite" as AiDemand["demandId"];
  const demand: AiDemand = {
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
  if (
    committed >= desired ||
    !canAffordAiEconomyCost(
      observation,
      entry.constructionProfile?.resourceCost ?? {},
      ready.length > 0 ? resourceReserve : undefined
    )
  ) {
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
  const fieldServiceRadius = 10;
  const readyFieldService = self
    .filter((actor) => actor.objectName === ObjectNames.Field && isFinishedActor(actor))
    .flatMap((field) => {
    const accessNodeId = field.accessNodeId.status === "known" ? field.accessNodeId.value : null;
    const position = field.logicalPosition.status === "known" ? field.logicalPosition.value : null;
    return accessNodeId && position ? [{ accessNodeId, position }] : [];
  });
  const enforceFieldService = readyFieldService.length > 0 &&
    observation.map?.regionGeneration?.status === "ready" &&
    observation.map.accessGraph?.status === "ready";
  const reachableFieldService = enforceFieldService
    ? readyFieldService.map((field) => ({
        ...field,
        reachableNodeIds: reachableAiAccessNodeIds(
          observation.map!.accessGraph!,
          [field.accessNodeId],
          "ground",
          1
        )
      }))
    : [];
  const position = selectConstructionPosition(
    observation,
    builder,
    state.scheduler.decisionSequence,
    ordinal,
    selectedConstructionTileKeys,
    entry.constructionProfile?.footprintRadiusTiles ?? 0,
    (cell) => !enforceFieldService || reachableFieldService.some((field) => {
      if (!cell.groundAccessNodeId || !field.reachableNodeIds.has(cell.groundAccessNodeId)) return false;
      const distance = Math.abs(cell.position.x - field.position.x) + Math.abs(cell.position.y - field.position.y);
      return distance <= fieldServiceRadius;
    })
  );
  if (!position) return { objectName, ready, demand, intent: null };
  const next = nextIds(state, `food-prerequisite:${objectName}`, ordinal);
  const intent: AiIntent = {
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
        claimId: `${next.claimId}:builder` as AiIntent["claims"][number]["claimId"],
        kind: "actor",
        actorId: builder.actorId
      },
      { claimId: next.claimId, kind: "site", siteKey: `food-prerequisite:${objectName}:${position.x}:${position.y}` },
      ...createAiResourceCostClaims(next.claimId, entry.constructionProfile?.resourceCost ?? {}),
      {
        claimId: `${next.claimId}:effect` as AiIntent["claims"][number]["claimId"],
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
