import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiDemand } from "../../../contracts/planning/ai-plan-contracts";
import { selectConstructionPosition } from "../../construction/ai-construction-site-selector";
import { reachableAiAccessNodeIds } from "../../access/ai-access-graph";
import { canAffordAiEconomyCost } from "../service/ai-economy-policy";
import { nextIds } from "../../production/macro/ai-macro-effect-identity";
import { claimedActorIds, compareAiActorsByVisibleGeometry, isAvailableBuilder } from "../../production/macro/ai-macro-observation";
import { createAiResourceCostClaims } from "../forecast/ai-resource-cost-claims";
import { aiEconomySiteSafety } from "../service/ai-economy-site-safety";

/** Commits only missing renewable Field capacity with a usable food drop-off. */
export function proposeAiFieldCapacity(args: {
  readonly observation: AiObservation;
  readonly state: AiBrainState;
  readonly catalog: AiCapabilityCatalog;
  readonly self: readonly AiObservation["actors"][number][];
  readonly foodSourceEntry: AiCapabilityCatalog["entries"][number] | undefined;
  readonly desiredFoodSources: number;
  readonly readyFoodSources: readonly AiObservation["actors"][number][];
  readonly constructingFoodSources: readonly AiObservation["actors"][number][];
  readonly acceptedFoodSourceEffectIds: readonly AiIntent["effectId"][];
  readonly pendingFoodLabor: boolean;
  readonly hasUnstaffedReadyFoodSource: boolean;
  readonly foodPrerequisiteObject: ObjectNames | undefined;
  readonly readyFoodPrerequisites: readonly AiObservation["actors"][number][];
  readonly reservedActorIds: ReadonlySet<string>;
  readonly selectedConstructionTileKeys: Set<string>;
  readonly priorIntents: readonly AiIntent[];
  readonly ordinal: number;
  readonly resourceReserve?: Readonly<Partial<Record<ResourceType, number>>>;
}): { readonly demand: AiDemand | null; readonly intent: AiIntent | null } {
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
  const demandId = "demand:economy:sustainable-food" as AiDemand["demandId"];
  const demand: AiDemand = {
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
      ? reachableAiAccessNodeIds(observation.map.accessGraph, [dropOff.accessNodeId], "ground", 1)
      : new Set([dropOff.accessNodeId])
  }));
  const fieldHasLocalFoodService = (cell: NonNullable<NonNullable<AiObservation["map"]>['constructionCells']>[number]) => {
    if (!enforceFoodDropOffRegion) return true;
    if (!cell.groundAccessNodeId) return false;
    return foodDropOffRoutes.some((dropOff) => {
      if (!dropOff.position || !dropOff.reachableNodeIds.has(cell.groundAccessNodeId!)) return false;
      const distance = Math.abs(cell.position.x - dropOff.position.x) + Math.abs(cell.position.y - dropOff.position.y);
      return distance <= 6;
    });
  };
  const acceptsFieldSite = (cell: NonNullable<NonNullable<AiObservation["map"]>["constructionCells"]>[number]) =>
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
  const intent: AiIntent = {
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
        claimId: `${next.claimId}:builder` as AiIntent["claims"][number]["claimId"],
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
        claimId: `${next.claimId}:effect` as AiIntent["claims"][number]["claimId"],
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
