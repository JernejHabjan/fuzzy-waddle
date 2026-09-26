import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

export function calculateAiHousingDemand(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  preferredObjectName: ObjectNames,
  buffer: number,
  acceptedEffectIds: readonly AiIntentV1["effectId"][]
) {
  const owned = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
  const housingEntry = catalog.entries.find(
    (entry) => entry.sourceObjectName === preferredObjectName && (entry.housingCapacity ?? 0) > 0
  );
  const capacityPerBuilding = Math.max(1, housingEntry?.housingCapacity ?? 1);
  const providers = owned.filter((actor) => actor.housingCapacity.status === "known" && actor.housingCapacity.value > 0);
  const ready = providers.filter(
    (actor) => actor.constructionProgress?.status !== "known" || actor.constructionProgress.value >= 100
  );
  const constructing = providers.filter(
    (actor) => actor.constructionProgress?.status === "known" && actor.constructionProgress.value < 100
  );
  const observedEffectIds = new Set(providers.flatMap((actor) => actor.activeEffectIds));
  const unobservedEffects = acceptedEffectIds.filter((effectId) => !observedEffectIds.has(effectId));
  const capacity = (actors: typeof providers) =>
    actors.reduce((total, actor) => total + (actor.housingCapacity.status === "known" ? actor.housingCapacity.value : 0), 0);
  const readyCapacity = capacity(ready);
  const committedCapacity = readyCapacity + capacity(constructing) + unobservedEffects.length * capacityPerBuilding;
  const used = owned.reduce(
    (total, actor) => total + (actor.housingCost.status === "known" ? actor.housingCost.value : 0),
    0
  );
  const queuedItemIds = new Set<string>();
  let queuedPopulation = 0;
  for (const actor of owned) {
    if (actor.queue.status !== "known") continue;
    for (const item of actor.queue.value.items ?? []) {
      if (item.kind !== "production" || !item.objectName || queuedItemIds.has(item.itemId)) continue;
      queuedItemIds.add(item.itemId);
      queuedPopulation +=
        catalog.entries.find((entry) => entry.sourceObjectName === item.objectName)?.housingCost ?? 0;
    }
  }
  const targetCapacity = used + queuedPopulation + buffer;
  const neededBuildings = Math.max(0, Math.ceil((targetCapacity - committedCapacity) / capacityPerBuilding));
  return {
    housingEntry,
    ready,
    constructing,
    acceptedEffectIds: unobservedEffects,
    readyCapacity,
    used,
    queuedPopulation,
    freeSupply: readyCapacity - used,
    neededBuildings,
    desiredBuildingCount: providers.length + unobservedEffects.length + neededBuildings
  } as const;
}
