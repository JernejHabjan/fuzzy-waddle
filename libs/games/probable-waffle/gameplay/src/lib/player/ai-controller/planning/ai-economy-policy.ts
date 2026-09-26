import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

const WORKER_FLOOR = 6;
const WORKER_LIMIT = 18;
const FORECAST_HORIZON_TICKS = 600;
const LOCAL_THREAT_DISTANCE = 10;

function availableStockpile(observation: AiObservationV1, resourceType: ResourceType): number {
  const resource = observation.resources.find((candidate) => candidate.resourceType === resourceType);
  return Math.max(0, (resource?.stockpile ?? 0) - (resource?.reservedUnspent ?? 0) - (resource?.obligationsDue ?? 0));
}

function projectedIncome(observation: AiObservationV1, resourceType: ResourceType): number {
  const income = observation.resources.find((candidate) => candidate.resourceType === resourceType)
    ?.deliveredIncomePerMinute;
  return income?.status === "known" ? income.value / 2 : 0;
}

export function canAffordAiEconomyCost(
  observation: AiObservationV1,
  cost: Readonly<Partial<Record<ResourceType, number>>>
): boolean {
  return Object.entries(cost).every(
    ([resourceType, amount]) => availableStockpile(observation, resourceType as ResourceType) >= (amount ?? 0)
  );
}

function usefulSourceCapacity(observation: AiObservationV1): number {
  return observation.actors
    .filter(
      (actor) =>
        actor.relation !== "enemy" &&
        actor.visibility !== "last_seen" &&
        actor.resourceState.status === "known" &&
        actor.resourceState.value.available.status === "known" &&
        actor.resourceState.value.available.value > 0
    )
    .reduce(
      (total, actor) =>
        total +
        (actor.resourceState.status === "known" && actor.resourceState.value.serviceCapacity.status === "known"
          ? Math.max(1, actor.resourceState.value.serviceCapacity.value)
          : 1),
      0
    );
}

export function hasCredibleAiEconomyThreat(observation: AiObservationV1): boolean {
  const visibleIds = new Set(observation.threatSummary.visibleEnemyActorIds);
  if (visibleIds.size === 0) return false;
  const visibleEnemies = observation.actors.filter((actor) => visibleIds.has(actor.actorId));
  if (visibleEnemies.length === 0) return true;
  const protectedPositions = observation.actors.flatMap((actor) =>
    actor.relation === "self" && actor.visibility === "owned" && actor.logicalPosition.status === "known"
      ? [actor.logicalPosition.value]
      : []
  );
  return visibleEnemies.some((enemy) => {
    if (enemy.logicalPosition.status !== "known") return true;
    const enemyPosition = enemy.logicalPosition.value;
    return protectedPositions.some((position) => {
      const distance =
        Math.abs(position.x - enemyPosition.x) + Math.abs(position.y - enemyPosition.y);
      return distance <= LOCAL_THREAT_DISTANCE;
    });
  });
}

export function decideAiEconomyPolicy(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  forecasts: readonly { readonly resourceType: ResourceType; readonly amount: number }[],
  defensiveCommitment = false
) {
  const self = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
  const workers = self.filter((actor) =>
    catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0)
  );
  const assignedWorkers = workers.filter((actor) => {
    const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
    return order?.orderType === OrderType.Gather || order?.orderType === OrderType.ReturnResources;
  }).length;
  const queuedWorkers = self.reduce(
    (total, actor) =>
      total +
      (actor.queue.status === "known"
        ? (actor.queue.value.items ?? []).filter((item) => {
            if (item.kind !== "production" || item.objectName === null) return false;
            return catalog.entries.some(
              (entry) => entry.sourceObjectName === item.objectName && entry.gathers.length > 0
            );
          }).length
        : 0),
    0
  );
  const forecastDeficit = forecasts.reduce(
    (total, forecast) =>
      total +
      Math.max(
        0,
        forecast.amount -
          availableStockpile(observation, forecast.resourceType) -
          projectedIncome(observation, forecast.resourceType)
      ),
    0
  );
  const observedCapacity = usefulSourceCapacity(observation);
  const capacity = Math.max(WORKER_FLOOR, observedCapacity + 4);
  const demandGrowth = Math.ceil(forecastDeficit / 150);
  const credibleThreat = hasCredibleAiEconomyThreat(observation);
  const defenders = self.filter((actor) =>
    catalog.entries.some(
      (entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length === 0 && entry.targetDomains.length > 0
    )
  ).length;
  const posture = credibleThreat
    ? defenders === 0 || observation.threatSummary.visibleEnemyActorIds.length > defenders
      ? "emergency"
      : "pressured"
    : defensiveCommitment
      ? "pressured"
      : "safe";
  const safeTarget = Math.min(WORKER_LIMIT, capacity, Math.max(WORKER_FLOOR, workers.length + demandGrowth));
  const desiredWorkers = posture === "safe" ? safeTarget : Math.max(WORKER_FLOOR, workers.length);
  const foodForecast = forecasts.find((forecast) => forecast.resourceType === ResourceType.Food)?.amount ?? 0;
  const foodAvailable =
    availableStockpile(observation, ResourceType.Food) + projectedIncome(observation, ResourceType.Food);
  const workerFoodCost =
    catalog.entries.find((entry) => entry.sourceObjectName === workers[0]?.objectName)?.constructionProfile
      ?.resourceCost?.[ResourceType.Food] ?? 50;
  const plannedWorkerFood = Math.max(0, desiredWorkers - workers.length - queuedWorkers) * workerFoodCost;
  const foodDemand = foodForecast + plannedWorkerFood + desiredWorkers * 25;
  const foodRunwayTicks =
    foodDemand === 0 ? FORECAST_HORIZON_TICKS : Math.floor((foodAvailable / foodDemand) * FORECAST_HORIZON_TICKS);
  const projectedWorkers = Math.max(1, workers.length + queuedWorkers);
  const nonFoodLaborReserve = projectedWorkers > 1 ? Math.max(1, Math.ceil(projectedWorkers / 3)) : 0;
  const usefulFoodLabor = projectedWorkers - nonFoodLaborReserve;
  const desiredFoodSources = Math.min(
    usefulFoodLabor,
    foodRunwayTicks < FORECAST_HORIZON_TICKS
      ? projectedWorkers
      : Math.max(2, Math.ceil(desiredWorkers / 2), Math.ceil(Math.max(0, foodDemand - foodAvailable) / 50))
  );
  const budget =
    posture === "emergency"
      ? { economyPermille: 200, defensePermille: 800 }
      : posture === "pressured"
        ? { economyPermille: 350, defensePermille: 650 }
        : { economyPermille: 650, defensePermille: 350 };

  return {
    workers: workers.length,
    queuedWorkers,
    assignedWorkers,
    desiredWorkers,
    desiredFoodSources,
    foodRunwayTicks,
    posture,
    budget,
    blocker: desiredWorkers > workers.length + queuedWorkers && capacity <= workers.length ? "resource_saturation" : null
  } as const;
}
