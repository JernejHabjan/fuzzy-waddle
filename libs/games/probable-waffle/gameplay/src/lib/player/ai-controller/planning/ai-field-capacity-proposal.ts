import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { selectConstructionPosition } from "./ai-construction-site-selector";
import { reachableAiAccessNodeIdsV1 } from "./ai-access-graph-v1";
import { canAffordAiEconomyCost } from "./ai-economy-policy";
import { nextIds } from "./ai-macro-effect-identity";
import { claimedActorIds, compareAiActorsByVisibleGeometry, isAvailableBuilder } from "./ai-macro-observation";
import { createAiResourceCostClaims } from "./ai-resource-cost-claims";
import { aiEconomySiteSafety } from "./ai-economy-site-safety";

/** Commits only missing renewable Field capacity with a usable food drop-off. */
export function proposeAiFieldCapacity(args: {
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly catalog: AiCapabilityCatalogV1;
  readonly self: readonly AiObservationV1["actors"][number][];
  readonly foodSourceEntry: AiCapabilityCatalogV1["entries"][number] | undefined;
  readonly desiredFoodSources: number;
  readonly readyFoodSources: readonly AiObservationV1["actors"][number][];
  readonly constructingFoodSources: readonly AiObservationV1["actors"][number][];
  readonly acceptedFoodSourceEffectIds: readonly AiIntentV1["effectId"][];
  readonly pendingFoodLabor: boolean;
  readonly hasUnstaffedReadyFoodSource: boolean;
  readonly foodPrerequisiteObject: ObjectNames | undefined;
  readonly readyFoodPrerequisites: readonly AiObservationV1["actors"][number][];
  readonly reservedActorIds: ReadonlySet<string>;
  readonly selectedConstructionTileKeys: Set<string>;
  readonly priorIntents: readonly AiIntentV1[];
  readonly ordinal: number;
  readonly resourceReserve?: Readonly<Partial<Record<ResourceType, number>>>;
}): { readonly demand: AiDemandV1 | null; readonly intent: AiIntentV1 | null } {
  const {
    observation,
    state,
    catalog,
    self,
    foodSourceEntry,
    desiredFoodSources,
    readyFoodSources,
    constructingFoodSources,
    acceptedFoodSourceEffectIds,
    pendingFoodLabor,
    hasUnstaffedReadyFoodSource,
    foodPrerequisiteObject,
    readyFoodPrerequisites,
    reservedActorIds,
    selectedConstructionTileKeys,
    priorIntents,
    ordinal
  } = args;
  if (desiredFoodSources <= 0 || !foodSourceEntry) return { demand: null, intent: null };
  const demandId = "demand:economy:sustainable-food" as AiDemandV1["demandId"];
  const demand: AiDemandV1 = {
    demandId,
    purpose: "renewable_food_capacity",
    capabilityOrRole: ObjectNames.Field,
    unit: "actor_count",
    desired: desiredFoodSources,
    satisfiedActorIds: readyFoodSources.map((actor) => actor.actorId),
    queuedIds: [],
    constructingIds: constructingFoodSources.map((actor) => actor.actorId),
    acceptedNotObservedEffectIds: acceptedFoodSourceEffectIds,
    preferredObjectNames: [ObjectNames.Field],
    resourceObligations: foodSourceEntry.constructionProfile?.resourceCost ?? {}
  };
  const committed = readyFoodSources.length + constructingFoodSources.length + acceptedFoodSourceEffectIds.length;
  // A cheaper extra Field must not repeatedly consume the cash needed for current supply recovery.
  // The first usable food source remains essential; ordinary arbitration still owns actual payment claims.
  const cost = foodSourceEntry.constructionProfile?.resourceCost ?? {};
  if (
    committed >= desiredFoodSources ||
    pendingFoodLabor ||
    hasUnstaffedReadyFoodSource ||
    constructingFoodSources.length > 0 ||
    acceptedFoodSourceEffectIds.length > 0 ||
    (foodPrerequisiteObject && readyFoodPrerequisites.length === 0) ||
    !canAffordAiEconomyCost(observation, cost, readyFoodSources.length > 0 ? args.resourceReserve : undefined)
  )
    return { demand, intent: null };
  const alreadyClaimed = claimedActorIds(priorIntents);
  const builder = self
    .filter(isAvailableBuilder)
    .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
    .filter((actor) =>
      catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(ObjectNames.Field)
      )
    )
    .sort((left, right) => {
      const leftIdle = left.activeOrder?.status === "known" && left.activeOrder.value === null ? 0 : 1;
      const rightIdle = right.activeOrder?.status === "known" && right.activeOrder.value === null ? 0 : 1;
      return leftIdle - rightIdle || compareAiActorsByVisibleGeometry(left, right);
    })[0];
  if (!builder) return { demand, intent: null };
  const safety = aiEconomySiteSafety(observation);
  const foodDropOffs = self.flatMap((actor) => {
      const accessNodeId = actor.accessNodeId.status === "known" ? actor.accessNodeId.value : null;
      const position = actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
      return accessNodeId && catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.acceptsResources?.includes(ResourceType.Food)
      ) ? [{ accessNodeId, position }] : [];
  });
  const foodDropOffAccessNodeIds = new Set(foodDropOffs.map((dropOff) => dropOff.accessNodeId));
  const enforceFoodDropOffRegion = observation.map?.regionGeneration?.status === "ready" &&
    foodDropOffAccessNodeIds.size > 0;
  const foodDropOffRoutes = foodDropOffs.map((dropOff) => ({
    ...dropOff,
    reachableNodeIds: enforceFoodDropOffRegion && observation.map?.accessGraph?.status === "ready"
      ? reachableAiAccessNodeIdsV1(observation.map.accessGraph, [dropOff.accessNodeId], "ground", 1)
      : new Set([dropOff.accessNodeId])
  }));
  const fieldHasLocalFoodService = (cell: NonNullable<NonNullable<AiObservationV1["map"]>['constructionCells']>[number]) => {
    if (!enforceFoodDropOffRegion) return true;
    if (!cell.groundAccessNodeId) return false;
    return foodDropOffRoutes.some((dropOff) => {
      if (!dropOff.position || !dropOff.reachableNodeIds.has(cell.groundAccessNodeId!)) return false;
      const distance = Math.abs(cell.position.x - dropOff.position.x) + Math.abs(cell.position.y - dropOff.position.y);
      return distance <= 6;
    });
  };
  const acceptsFieldSite = (cell: NonNullable<NonNullable<AiObservationV1["map"]>["constructionCells"]>[number]) =>
    safety.positionSafe(cell.position) && fieldHasLocalFoodService(cell);
  const existingFieldPositions = readyFoodSources.flatMap((field) =>
    field.logicalPosition.status === "known" ? [field.logicalPosition.value] : []
  );
  const alignedPosition = existingFieldPositions.length > 0
    ? selectConstructionPosition(
        observation,
        builder,
        state.scheduler.decisionSequence,
        ordinal,
        selectedConstructionTileKeys,
        foodSourceEntry.constructionProfile?.footprintRadiusTiles ?? 0,
        (cell) => acceptsFieldSite(cell) && existingFieldPositions.some((field) =>
          field.x === cell.position.x || field.y === cell.position.y
        )
      )
    : undefined;
  const position = alignedPosition ?? selectConstructionPosition(
    observation,
    builder,
    state.scheduler.decisionSequence,
    ordinal,
    selectedConstructionTileKeys,
    foodSourceEntry.constructionProfile?.footprintRadiusTiles ?? 0,
    acceptsFieldSite
  );
  if (!position) return { demand, intent: null };
  const next = nextIds(state, `food-capacity:${ObjectNames.Field}`, ordinal);
  const intent: AiIntentV1 = {
    ...next,
    kind: "construct",
    spendingCategory: readyFoodSources.length === 0 ? "survival" : "economy",
    planId: state.opening.plan.planId,
    demandId,
    lane: "essential_economy",
    proposedTick: observation.tick,
    urgencyClass: 1,
    utility: 880,
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
        siteKey: `food-capacity:${ObjectNames.Field}:${position.x}:${position.y}`
      },
      ...createAiResourceCostClaims(next.claimId, foodSourceEntry.constructionProfile?.resourceCost ?? {}),
      {
        claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
        kind: "effect",
        effectId: next.effectId
      }
    ],
    reasonCode: `food_capacity:ready=${readyFoodSources.length}:committed=${committed}/${desiredFoodSources}`,
    builderIds: [builder.actorId],
    objectName: ObjectNames.Field,
    logicalPosition: position,
    siteKey: `food-capacity:${ObjectNames.Field}:${position.x}:${position.y}`
  };
  return { demand, intent };
}
