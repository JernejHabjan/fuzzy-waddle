import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";

const FORECAST_HORIZON_TICKS = 600;

function committedCount(demand: AiDemandV1): number {
  return (
    demand.satisfiedActorIds.length +
    demand.queuedIds.length +
    demand.constructingIds.length +
    demand.acceptedNotObservedEffectIds.length
  );
}

function cheapestPreferredCost(demand: AiDemandV1, catalog: AiCapabilityCatalogV1) {
  const candidates = demand.preferredObjectNames
    .flatMap((objectName) => {
      const cost = catalog.entries.find((entry) => entry.sourceObjectName === objectName)?.constructionProfile
        ?.resourceCost;
      return cost ? [{ objectName, cost }] : [];
    })
    .sort((left, right) => {
      const total = (cost: Readonly<Partial<Record<ResourceType, number>>>) =>
        Object.values(cost).reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
      return total(left.cost) - total(right.cost) || left.objectName.localeCompare(right.objectName);
    });
  return candidates[0]?.cost ?? demand.resourceObligations;
}

export function projectAiResourceForecasts(
  observation: AiObservationV1,
  demands: readonly AiDemandV1[],
  catalog: AiCapabilityCatalogV1
) {
  const amounts = new Map<ResourceType, number>();
  let pricedDemandCount = 0;
  for (const demand of demands) {
    const missing = Math.max(0, demand.desired - committedCount(demand));
    if (missing === 0) continue;
    const cost = cheapestPreferredCost(demand, catalog);
    if (Object.values(cost).some((amount) => (amount ?? 0) > 0)) pricedDemandCount += 1;
    for (const [resourceType, amount] of Object.entries(cost)) {
      amounts.set(
        resourceType as ResourceType,
        (amounts.get(resourceType as ResourceType) ?? 0) + missing * (amount ?? 0)
      );
    }
  }
  const confidencePermille = pricedDemandCount > 0 ? 800 : 0;
  return Object.values(ResourceType)
    .sort()
    .map((resourceType) => ({
      resourceType,
      horizonTick: observation.tick + FORECAST_HORIZON_TICKS,
      amount: amounts.get(resourceType) ?? 0,
      confidencePermille: amounts.has(resourceType) ? confidencePermille : 0
    }));
}

export function selectAiForecastResource(
  observation: AiObservationV1,
  forecasts: readonly ReturnType<typeof projectAiResourceForecasts>[number][],
  availableTypes: ReadonlySet<ResourceType>
): ResourceType | undefined {
  const ledger = new Map(observation.resources.map((resource) => [resource.resourceType, resource]));
  return [...forecasts]
    .filter((forecast) => availableTypes.has(forecast.resourceType))
    .map((forecast) => {
      const resource = ledger.get(forecast.resourceType);
      const available = (resource?.stockpile ?? 0) - (resource?.reservedUnspent ?? 0) - (resource?.obligationsDue ?? 0);
      return { resourceType: forecast.resourceType, deficit: forecast.amount - available };
    })
    .sort((left, right) => right.deficit - left.deficit || left.resourceType.localeCompare(right.resourceType))[0]
    ?.resourceType;
}
