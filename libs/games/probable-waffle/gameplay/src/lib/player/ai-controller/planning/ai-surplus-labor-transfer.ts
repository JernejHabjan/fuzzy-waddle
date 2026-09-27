import { OrderType, type ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { aiResourceForecastDeficit } from "./ai-resource-forecast";

const MIN_TRANSFER_DEFICIT = 100;
const MIN_DONOR_SURPLUS = 100;

function spendable(observation: AiObservationV1, resourceType: ResourceType): number {
  const resource = observation.resources.find((entry) => entry.resourceType === resourceType);
  return (resource?.stockpile ?? 0) - (resource?.reservedUnspent ?? 0) - (resource?.obligationsDue ?? 0);
}

/** Selects at most one unloaded donor when a priced shortage and a separate, well-stocked source are both observed. */
export function selectAiSurplusLaborTransfer(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  forecasts: readonly {
    readonly resourceType: ResourceType;
    readonly horizonTick: number;
    readonly amount: number;
  }[],
  workers: readonly AiObservedActorV1[],
  sources: readonly AiObservedActorV1[],
  targetResource: ResourceType
): AiObservedActorV1 | undefined {
  const targetForecast = forecasts.find((entry) => entry.resourceType === targetResource);
  if (!targetForecast || aiResourceForecastDeficit(observation, targetForecast) < MIN_TRANSFER_DEFICIT) return undefined;
  const sourcesById = new Map(sources.map((source) => [source.actorId, source]));
  const gatherersBySource = new Map<string, number>();
  for (const worker of workers) {
    const order = worker.activeOrder?.status === "known" ? worker.activeOrder.value : null;
    if (order?.orderType !== OrderType.Gather || !order.targetActorId) continue;
    gatherersBySource.set(order.targetActorId, (gatherersBySource.get(order.targetActorId) ?? 0) + 1);
  }
  return [...workers]
    .sort((left, right) => left.actorId.localeCompare(right.actorId))
    .find((worker) => {
      const order = worker.activeOrder?.status === "known" ? worker.activeOrder.value : null;
      if (order?.orderType !== OrderType.Gather || !order.targetActorId) return false;
      const source = sourcesById.get(order.targetActorId);
      if (!source || source.resourceState.status !== "known") return false;
      const donorResource = source.resourceState.value.resourceType;
      if (donorResource === targetResource) return false;
      if ((gatherersBySource.get(source.actorId) ?? 0) <= 1) return false;
      const donorForecast = forecasts.find((entry) => entry.resourceType === donorResource)?.amount ?? 0;
      if (spendable(observation, donorResource) - donorForecast < MIN_DONOR_SURPLUS) return false;
      if (worker.resourceState.status === "known" &&
        (worker.resourceState.value.carried.status !== "known" || worker.resourceState.value.carried.value > 0)) {
        return false;
      }
      return catalog.entries.some((entry) =>
        entry.sourceObjectName === worker.objectName && entry.gathers.includes(targetResource)
      );
    });
}
