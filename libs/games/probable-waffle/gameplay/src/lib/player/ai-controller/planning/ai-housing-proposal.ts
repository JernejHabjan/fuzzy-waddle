import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { selectConstructionPosition } from "./ai-construction-site-selector";
import { canAffordAiEconomyCost } from "./ai-economy-policy";
import { calculateAiHousingDemand } from "./ai-housing-demand";
import { nextIds, unresolvedReservedEffectIds } from "./ai-macro-effect-identity";
import { isAvailableBuilder } from "./ai-macro-observation";
import type { OpeningCheckpoint } from "./ai-opening-catalog";
import { createAiResourceCostClaims } from "./ai-resource-cost-claims";

/** Prices queued population and proposes only the missing committed housing capacity. */
export function proposeAiHousing(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  checkpoints: readonly OpeningCheckpoint[],
  self: readonly AiObservationV1["actors"][number][],
  openingComplete: boolean,
  supplyBuffer: number,
  reservedActorIds: ReadonlySet<string>,
  selectedConstructionTileKeys: Set<string>,
  initialOrdinal: number
) {
  const housing = calculateAiHousingDemand(
    observation,
    catalog,
    checkpoints.find((checkpoint) => checkpoint.id === "supply-safety")!.requiredObject,
    supplyBuffer,
    unresolvedReservedEffectIds(state, "effect:supply:effect:")
  );
  const freeSupply = housing.freeSupply;
  const intents: AiIntentV1[] = [];
  let ordinal = initialOrdinal;
  if (!openingComplete || housing.neededBuildings <= 0 || !housing.housingEntry) {
    return { demand: null, intents, freeSupply, ordinal };
  }
  const housingObject = housing.housingEntry.sourceObjectName;
  const demand: AiDemandV1 = {
    demandId: "demand:supply:buffer" as AiDemandV1["demandId"],
    purpose: "supply_buffer",
    capabilityOrRole: "housing",
    unit: "actor_count",
    desired: housing.desiredBuildingCount,
    satisfiedActorIds: housing.ready.map((actor) => actor.actorId),
    queuedIds: [],
    constructingIds: housing.constructing.map((actor) => actor.actorId),
    acceptedNotObservedEffectIds: housing.acceptedEffectIds,
    preferredObjectNames: [housingObject],
    resourceObligations: housing.housingEntry.constructionProfile?.resourceCost ?? {}
  };
  const builders = self
    .filter(isAvailableBuilder)
    .filter((actor) => !reservedActorIds.has(actor.actorId))
    .filter((actor) =>
      catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(housingObject)
      )
    );
  if (
    !builders.length ||
    !canAffordAiEconomyCost(observation, housing.housingEntry.constructionProfile?.resourceCost ?? {})
  ) {
    return { demand, intents, freeSupply, ordinal };
  }
  for (let index = 0; index < Math.min(housing.neededBuildings, builders.length); index += 1) {
    const builder = builders[index];
    if (!builder || builder.logicalPosition.status !== "known") continue;
    const position = selectConstructionPosition(
      observation,
      builder,
      state.scheduler.decisionSequence,
      ordinal + index,
      selectedConstructionTileKeys,
      housing.housingEntry.constructionProfile?.footprintRadiusTiles ?? 0
    );
    if (!position) continue;
    const ids = nextIds(state, "supply", ordinal++);
    intents.push({
      ...ids,
      kind: "construct",
      spendingCategory: housing.queuedPopulation > 0 ? "survival" : "economy",
      planId: state.opening.plan.planId,
      demandId: demand.demandId,
      lane: "supply_production",
      proposedTick: observation.tick,
      urgencyClass: 1,
      utility: housing.queuedPopulation > 0 ? 920 : 850,
      preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
      claims: [
        {
          claimId: `${ids.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
          kind: "actor",
          actorId: builder.actorId
        },
        { claimId: ids.claimId, kind: "site", siteKey: `supply:${housingObject}:${position.x}:${position.y}` },
        ...createAiResourceCostClaims(ids.claimId, housing.housingEntry.constructionProfile?.resourceCost ?? {}),
        {
          claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
          kind: "effect",
          effectId: ids.effectId
        }
      ],
      reasonCode:
        `supply_buffer:${state.opening.archetypeId}:deficit=${housing.queuedPopulation + supplyBuffer - freeSupply}`,
      builderIds: [builder.actorId],
      objectName: housingObject,
      logicalPosition: position,
      siteKey: `supply:${housingObject}:${position.x}:${position.y}`
    });
  }
  return { demand, intents, freeSupply, ordinal };
}
