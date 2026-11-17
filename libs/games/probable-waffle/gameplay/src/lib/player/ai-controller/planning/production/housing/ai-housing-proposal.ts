import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiDemand } from "../../../contracts/planning/ai-plan-contracts";
import { selectConstructionPosition } from "../../construction/ai-construction-site-selector";
import { canAffordAiEconomyCost } from "../../economy/service/ai-economy-policy";
import { calculateAiHousingDemand } from "./ai-housing-demand";
import { nextIds, unresolvedReservedEffectIds } from "../macro/ai-macro-effect-identity";
import { claimedActorIds, isAvailableBuilder } from "../macro/ai-macro-observation";
import type { OpeningCheckpoint } from "../opening/ai-opening-catalog";
import { createAiResourceCostClaims } from "../../economy/forecast/ai-resource-cost-claims";

/** Prices queued population and proposes only the missing committed housing capacity. */
export function proposeAiHousing(
  observation: AiObservation,
  state: AiBrainState,
  catalog: AiCapabilityCatalog,
  checkpoints: readonly OpeningCheckpoint[],
  self: readonly AiObservation["actors"][number][],
  canProposeHousing: boolean,
  supplyBuffer: number,
  reservedActorIds: ReadonlySet<string>,
  selectedConstructionTileKeys: Set<string>,
  priorIntents: readonly AiIntent[],
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
  const intents: AiIntent[] = [];
  let ordinal = initialOrdinal;
  if (!canProposeHousing || housing.neededBuildings <= 0 || !housing.housingEntry) {
    return { demand: null, intents, freeSupply, ordinal };
  }
  const housingObject = housing.housingEntry.sourceObjectName;
  const demand: AiDemand = {
    demandId: "demand:supply:buffer" as AiDemand["demandId"],
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
  const alreadyClaimed = claimedActorIds(priorIntents);
  const builders = self
    .filter(isAvailableBuilder)
    .filter((actor) => !reservedActorIds.has(actor.actorId))
    .filter((actor) => !alreadyClaimed.has(actor.actorId))
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
          claimId: `${ids.claimId}:builder` as AiIntent["claims"][number]["claimId"],
          kind: "actor",
          actorId: builder.actorId
        },
        { claimId: ids.claimId, kind: "site", siteKey: `supply:${housingObject}:${position.x}:${position.y}` },
        ...createAiResourceCostClaims(ids.claimId, housing.housingEntry.constructionProfile?.resourceCost ?? {}),
        {
          claimId: `${ids.claimId}:effect` as AiIntent["claims"][number]["claimId"],
          kind: "effect",
          effectId: ids.effectId
        }
      ],
      reasonCode: `supply_buffer:${state.opening.archetypeId}:deficit=${housing.queuedPopulation + supplyBuffer - freeSupply}`,
      builderIds: [builder.actorId],
      objectName: housingObject,
      logicalPosition: position,
      siteKey: `supply:${housingObject}:${position.x}:${position.y}`
    });
  }
  return { demand, intents, freeSupply, ordinal };
}
