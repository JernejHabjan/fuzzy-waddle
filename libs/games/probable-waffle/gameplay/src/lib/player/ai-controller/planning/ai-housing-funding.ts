import { OrderType, type ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { projectAiResourceForecasts } from "./ai-resource-forecast";

/** Missing housing needs actual cash even when another resource has a larger optional forecast. */
export function housingFundingResourceTypes(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  demands: readonly AiDemandV1[]
): ReadonlySet<ResourceType> {
  return new Set(
    projectAiResourceForecasts(
      observation,
      demands.filter((demand) => demand.capabilityOrRole === "housing"),
      catalog
    )
      .filter((forecast) => {
        const resource = observation.resources.find((entry) => entry.resourceType === forecast.resourceType);
        const cash = (resource?.stockpile ?? 0) - (resource?.reservedUnspent ?? 0) - (resource?.obligationsDue ?? 0);
        return forecast.amount > Math.max(0, cash);
      })
      .map((forecast) => forecast.resourceType)
  );
}

/** Moves one unloaded donor to essential housing funding, preserving return trips and one gatherer per donor resource. */
export function selectAiHousingFundingWorker(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  workers: readonly AiObservedActorV1[],
  targetResource: ResourceType
): AiObservedActorV1 | undefined {
  const sources = new Map(
    observation.actors.flatMap((actor) =>
      actor.visibility !== "last_seen" &&
      actor.relation !== "enemy" &&
      actor.resourceState.status === "known" &&
      actor.resourceState.value.available.status === "known"
        ? [[actor.actorId, actor.resourceState.value.resourceType] as const]
        : []
    )
  );
  const assignments = workers.flatMap((worker) => {
    const order = worker.activeOrder?.status === "known" ? worker.activeOrder.value : null;
    const type =
      order?.orderType === OrderType.Gather && order.targetActorId ? sources.get(order.targetActorId) : undefined;
    return type ? [{ worker, type }] : [];
  });
  return assignments
    .filter(
      ({ worker, type }) =>
        !worker.resourceTransferInFlight &&
        type !== targetResource &&
        assignments.filter((assignment) => assignment.type === type).length > 1 &&
        (worker.carriedResourceAmount === 0 ||
          (worker.resourceState.status === "known" &&
            worker.resourceState.value.carried.status === "known" &&
            worker.resourceState.value.carried.value === 0)) &&
        catalog.entries.some(
          (entry) => entry.sourceObjectName === worker.objectName && entry.gathers.includes(targetResource)
        )
    )
    .sort((left, right) => left.worker.actorId.localeCompare(right.worker.actorId))[0]?.worker;
}
