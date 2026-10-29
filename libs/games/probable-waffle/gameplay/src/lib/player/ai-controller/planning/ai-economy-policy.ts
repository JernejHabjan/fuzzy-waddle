import { OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";

const WORKER_FLOOR = 6;
const WORKER_LIMIT = 18;
const FORECAST_HORIZON_TICKS = 600;
const LOCAL_THREAT_DISTANCE = 10;
const POSTURE_RELEASE_TICKS = 160;

function availableStockpile(observation: AiObservationV1, resourceType: ResourceType): number {
  const resource = observation.resources.find((candidate) => candidate.resourceType === resourceType);
  return Math.max(0, (resource?.stockpile ?? 0) - (resource?.reservedUnspent ?? 0) - (resource?.obligationsDue ?? 0));
}

function projectedIncome(observation: AiObservationV1, resourceType: ResourceType): number {
  const income = observation.resources.find(
    (candidate) => candidate.resourceType === resourceType
  )?.deliveredIncomePerMinute;
  return income?.status === "known" ? income.value / 2 : 0;
}

/** Requires spendable cash for both this purchase and an unmet higher-priority purchase; neither is paid twice. */
export function canAffordAiEconomyCost(
  observation: AiObservationV1,
  cost: Readonly<Partial<Record<ResourceType, number>>>,
  reserve: Readonly<Partial<Record<ResourceType, number>>> = {}
): boolean {
  return Object.values(ResourceType).every(
    (resourceType) =>
      availableStockpile(observation, resourceType) >= (cost[resourceType] ?? 0) + (reserve[resourceType] ?? 0)
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

/** Shared current threat set for workforce budgets and defense of workers outside the main base. */
export function observedAiEconomyThreats(observation: AiObservationV1): AiObservedActorV1[] {
  const visibleIds = new Set(observation.threatSummary.visibleEnemyActorIds);
  if (visibleIds.size === 0) return [];
  const visibleEnemies = observation.actors.filter(
    (actor) => actor.relation === "enemy" && actor.visibility === "visible" && visibleIds.has(actor.actorId)
  );
  if (visibleEnemies.length === 0) return [];
  const protectedPositions = observation.actors.flatMap((actor) =>
    actor.relation === "self" &&
    actor.visibility === "owned" &&
    actor.logicalPosition.status === "known" &&
    ((actor.mainBuilding?.status === "known" && actor.mainBuilding.value) ||
      actor.resourceState.status === "known" ||
      actor.capabilities.some((capability) => ["gather", "drop_off"].includes(capability.family)))
      ? [actor.logicalPosition.value]
      : []
  );
  const threats = visibleEnemies.filter((enemy) => {
    // A visible producer/drop-off is strategic information, not an immediate weapon against nearby workers.
    const armed = enemy.combatProfile?.status === "known" && enemy.combatProfile.value.attacks.length > 0;
    const attackCapability = enemy.capabilities.some(
      (capability) => capability.family === "attack" && capability.targetDomains.length > 0
    );
    if (
      !armed &&
      !attackCapability &&
      !(enemy.activeOrder?.status === "known" && enemy.activeOrder.value?.orderType === OrderType.Attack)
    )
      return false;
    if (enemy.logicalPosition.status !== "known") return false;
    const enemyPosition = enemy.logicalPosition.value;
    return protectedPositions.some((position) => {
      const distance = Math.abs(position.x - enemyPosition.x) + Math.abs(position.y - enemyPosition.y);
      return distance <= LOCAL_THREAT_DISTANCE;
    });
  });
  const protectedDistance = (enemy: AiObservedActorV1): number => {
    if (enemy.logicalPosition.status !== "known") return Number.POSITIVE_INFINITY;
    const position = enemy.logicalPosition.value;
    return Math.min(
      ...protectedPositions.map(
        (protectedPosition) =>
          Math.abs(protectedPosition.x - position.x) + Math.abs(protectedPosition.y - position.y)
      )
    );
  };
  return threats.sort(
    (left, right) =>
      protectedDistance(left) - protectedDistance(right) || left.actorId.localeCompare(right.actorId)
  );
}

export function hasCredibleAiEconomyThreat(observation: AiObservationV1): boolean {
  return observedAiEconomyThreats(observation).length > 0;
}

/** Defers optional infrastructure only for credible pressure near a known main building. */
export function hasCredibleAiHomeThreat(observation: AiObservationV1): boolean {
  const mainBuildingPositions = observation.actors.flatMap((actor) => {
    if (
      actor.relation !== "self" ||
      actor.visibility !== "owned" ||
      actor.mainBuilding?.status !== "known" ||
      !actor.mainBuilding.value ||
      actor.logicalPosition.status !== "known"
    )
      return [];
    return [actor.logicalPosition.value];
  });
  // Without a known home location, retain the conservative existing behavior.
  if (mainBuildingPositions.length === 0) return hasCredibleAiEconomyThreat(observation);

  return observedAiEconomyThreats(observation).some((threat) => {
    if (threat.logicalPosition.status !== "known") return false;
    const threatPosition = threat.logicalPosition.value;
    return mainBuildingPositions.some((position) => {
      const distance =
        Math.abs(position.x - threatPosition.x) + Math.abs(position.y - threatPosition.y);
      return distance <= LOCAL_THREAT_DISTANCE;
    });
  });
}

/** Only defenders near the exposed economy with a weapon for the observed movement domain can cover the threat. */
function compatibleLocalDefenders(
  self: readonly AiObservedActorV1[],
  threats: readonly AiObservedActorV1[],
  catalog: AiCapabilityCatalogV1
): number {
  return self.filter((defender) => {
    const defenderPosition = defender.logicalPosition;
    if (defenderPosition.status !== "known") return false;
    const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === defender.objectName);
    if (!entry || entry.gathers.length > 0 || entry.targetDomains.length === 0) return false;
    return threats.some((threat) => {
      const threatPosition = threat.logicalPosition;
      if (threatPosition.status !== "known") return false;
      const threatDomains = threat.capabilities.flatMap((capability) => capability.domains);
      const targetDomains = threatDomains.length > 0 ? threatDomains : ["ground" as const];
      const distance =
        Math.abs(defenderPosition.value.x - threatPosition.value.x) +
        Math.abs(defenderPosition.value.y - threatPosition.value.y);
      return (
        distance <= LOCAL_THREAT_DISTANCE + 4 && targetDomains.some((domain) => entry.targetDomains.includes(domain))
      );
    });
  }).length;
}

export function decideAiEconomyPolicy(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  forecasts: readonly { readonly resourceType: ResourceType; readonly amount: number }[],
  defensiveCommitment = false,
  previousPosture?: Readonly<{
    readonly status: "safe" | "pressured" | "emergency";
    readonly enteredTick: number;
    readonly lastThreatTick: number | null;
  }>,
  finishCommitted = false
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
  const localThreats = observedAiEconomyThreats(observation);
  const credibleThreat = localThreats.length > 0;
  const defenders = compatibleLocalDefenders(self, localThreats, catalog);
  const requestedPosture = credibleThreat
    ? defenders === 0 || localThreats.length > defenders
      ? "emergency"
      : "pressured"
    : defensiveCommitment
      ? "pressured"
      : "safe";
  const severity = { safe: 0, pressured: 1, emergency: 2 } as const;
  const holdPrior =
    previousPosture &&
    severity[previousPosture.status] > severity[requestedPosture] &&
    previousPosture.lastThreatTick !== null &&
    observation.tick - previousPosture.lastThreatTick < POSTURE_RELEASE_TICKS;
  const posture = holdPrior ? previousPosture.status : requestedPosture;
  const postureState = {
    status: posture,
    enteredTick: previousPosture?.status === posture ? previousPosture.enteredTick : observation.tick,
    lastThreatTick: credibleThreat ? observation.tick : (previousPosture?.lastThreatTick ?? null)
  } as const;
  const safeTarget = Math.min(WORKER_LIMIT, capacity, Math.max(WORKER_FLOOR, workers.length + demandGrowth));
  const desiredWorkers = posture === "safe" && !finishCommitted ? safeTarget : Math.max(WORKER_FLOOR, workers.length);
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
    postureState,
    budget,
    blocker:
      desiredWorkers > workers.length + queuedWorkers && capacity <= workers.length ? "resource_saturation" : null
  } as const;
}
