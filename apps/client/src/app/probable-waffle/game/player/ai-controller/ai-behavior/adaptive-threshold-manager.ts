import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { BasePlanner } from "./base-planner";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { getCostForObjectName } from "../../../entity/components/production/cost-utils";

/**
 * AdaptiveThresholdManager
 * - Derives dynamic thresholds that previously were hard-coded in PlayerAiControllerAgent.
 * - Recompute periodically (e.g. after map analysis or base replanning).
 * - Uses simple heuristic formulas; can be extended with time-series / ML later.
 */
export class AdaptiveThresholdManager {
  // Internal dynamic thresholds (public getters below)
  private baseHeavyAttackThreshold = 0;
  private militaryPowerThreshold = 0;
  private militaryUnitTarget = 0;
  private resourceSurplusThreshold = 0;
  private resourceGatheringThreshold = 0;
  private needMoreResourcesThreshold = 0;
  private hasSufficientResourcesThreshold = 0;
  private hasEnoughResourcesForWorkerThreshold = 0;
  private sufficientResourcesForUpgradeThreshold = 0;
  private hasEnoughResourcesForMilitaryUnitThreshold = 0;

  // Cached last update timestamp
  private lastUpdatedAt = 0;
  // Minimum ms between expensive recomputations
  private readonly minUpdateIntervalMs = 750;

  constructor(
    private readonly blackboard: PlayerAiBlackboard,
    private readonly basePlanner: BasePlanner
  ) {}

  /**
   * Recompute all thresholds if needed.
   */
  update(now: number = Date.now()): void {
    if (now - this.lastUpdatedAt < this.minUpdateIntervalMs) return;
    this.lastUpdatedAt = now;

    const bb = this.blackboard;
    const totalResources = bb.getTotalResources();
    const attackPowerRatio = bb.getAttackPowerRatio(now);
    const enemyStr = Math.max(1, bb.enemyMilitaryStrength || 1);
    const baseSize = Math.max(1, bb.baseSize || 1);
    const workerCount = bb.workers.length;
    const defendingUnits = bb.defendingUnits.length;
    const militaryCount = Math.max(0, bb.units.length - workerCount);
    const productionBuildings = bb.productionBuildings.length;
    const defensiveStructures = bb.defensiveStructures.length;
    const availableResources = this.sumResources(bb.economy.available);
    const reservedResources = this.sumResources(bb.economy.reserved);
    const incomePerSecond = this.sumResources(bb.economy.incomeSmoothed);
    const supplyUsed = bb.production.supply.used || bb.units.length;
    const supplyMax = Math.max(supplyUsed, bb.production.supply.max || 0);
    const supplyHeadroom = Math.max(0, supplyMax - supplyUsed + bb.production.supply.pendingFromQueued);
    const upcomingCosts = this.estimatePendingBuildingCosts();
    const queuedProductionCost = this.estimateQueuedProductionCosts();
    const projectedSpend = upcomingCosts.total + queuedProductionCost + reservedResources;

    // Strategy weighting for aggression/defense
    const strategyFactor = bb.currentStrategy === "aggressive" ? 1.05 : bb.currentStrategy === "defensive" ? 0.9 : 0.95;

    // Military power threshold scales with enemy strength, production footprint, and supply ceiling
    const supplyDriven = Math.max(6, Math.round(supplyMax * 0.55 + baseSize * 0.4));
    const enemyDriven = Math.round(enemyStr * strategyFactor + defensiveStructures * 0.4);
    const economyDriven = Math.round(Math.max(0, incomePerSecond * 0.25 + productionBuildings * 1.5));
    this.militaryPowerThreshold = Math.max(6, enemyDriven, supplyDriven) + Math.round(economyDriven * 0.3);

    // Target units scales with power threshold, base footprint, and defense commitments
    const baseScaling = 1 + Math.min(0.35, Math.log1p(baseSize) * 0.2);
    this.militaryUnitTarget =
      Math.round(this.militaryPowerThreshold * (1.1 * baseScaling)) + Math.round(defendingUnits * 0.3);

    // Heavy attack threshold grows with base footprint and defenses but tightens when out-powered
    const defenseCapacity = defensiveStructures * 1.5 + defendingUnits * 0.5;
    const vulnerabilityFactor = attackPowerRatio < 1 ? 1.25 - attackPowerRatio * 0.35 : 1;
    this.baseHeavyAttackThreshold = Math.max(
      2,
      Math.round((2 + baseSize * 0.6 + defenseCapacity) * vulnerabilityFactor)
    );

    // Resource buffers scale with projected spend, income, and worker-driven growth
    const workerGrowthBias = bb.currentStrategy === "economic" ? 1.2 : bb.currentStrategy === "aggressive" ? 0.9 : 1;
    const supplyBuffer = Math.max(100, supplyHeadroom < 3 ? 200 : supplyHeadroom * 25);
    this.needMoreResourcesThreshold = Math.max(
      500,
      Math.round(projectedSpend * 0.7 + incomePerSecond * 5 + workerCount * 15 * workerGrowthBias + supplyBuffer)
    );

    const surplusBase = Math.round((projectedSpend + totalResources) * 0.35 + incomePerSecond * 4 + baseSize * 60);
    const armyWeight = Math.max(1, militaryCount * 0.25 + this.militaryPowerThreshold * 0.1);
    this.resourceSurplusThreshold = Math.min(
      8000,
      Math.max(400, Math.round(surplusBase * workerGrowthBias + armyWeight * 20))
    );

    const incomeRelief = Math.round(incomePerSecond * 1.5);
    this.resourceGatheringThreshold = Math.max(200, Math.round(this.resourceSurplusThreshold * 0.6 - incomeRelief));

    this.hasSufficientResourcesThreshold = Math.round(
      (this.resourceGatheringThreshold + this.resourceSurplusThreshold) / 2 + projectedSpend * 0.1
    );

    // Worker training cost scales with base footprint and current workforce; discounts when under-staffed
    const workerCostGuess = 90 + Math.min(120, baseSize * 12);
    const workforcePressure = workerCount < baseSize * 2 ? -40 : workerCount * 3;
    this.hasEnoughResourcesForWorkerThreshold = Math.max(
      80,
      Math.round(workerCostGuess + workforcePressure - incomePerSecond * 0.4)
    );

    // Upgrade threshold prefers saving if upgrades exist in queue or income is low
    const upgradeDrag = Math.max(0, bb.activeTechUpgrades * 150 - incomePerSecond * 2);
    this.sufficientResourcesForUpgradeThreshold = Math.max(
      700,
      Math.round(projectedSpend * 0.4 + baseSize * 80 + upgradeDrag + availableResources * 0.2)
    );

    // Military unit affordability scales with supply headroom and cheapest known production cost
    const cheapestMilitary = this.estimateCheapestMilitaryUnitCost();
    const supplyTax = supplyHeadroom <= 1 ? 120 : Math.max(0, (3 - supplyHeadroom) * 40);
    this.hasEnoughResourcesForMilitaryUnitThreshold = Math.max(
      cheapestMilitary + supplyTax,
      Math.round(this.militaryPowerThreshold * 1.1)
    );
  }

  private estimatePendingBuildingCosts(): { byType: Record<string, number>; total: number } {
    const needs = this.basePlanner.getCurrentNeeds();
    if (!needs || needs.length === 0) return { byType: {}, total: 0 };
    const costMap: Record<string, number> = {};
    let total = 0;
    needs.forEach((n) => {
      const objName = this.basePlanner.mapNeedTypeToObjectName(n.type);
      if (!objName) return;
      const cost = this.roughCostFor(objName);
      costMap[n.type] = (costMap[n.type] || 0) + cost;
      total += cost;
    });
    return { byType: costMap, total };
  }

  private roughCostFor(obj: ObjectNames): number {
    const cost = getCostForObjectName(obj);
    if (!cost) throw new Error(`No cost data for object: ${obj}`);
    return Object.values(cost).reduce((a, b) => a + (b ?? 0), 0);
  }

  private estimateQueuedProductionCosts(): number {
    const latest = this.blackboard.production.queueSnapshots.at(-1);
    if (!latest) return 0;
    let total = 0;
    latest.queued.forEach((name) => {
      const cost = getCostForObjectName(name as ObjectNames);
      if (!cost) return;
      total += this.sumResources(cost);
    });
    return total;
  }

  private estimateCheapestMilitaryUnitCost(): number {
    let cheapest = Infinity;
    this.blackboard.trainingBuildings.forEach((building) => {
      const prod: any = (building as any).components?.productionComponent || null;
      const available = prod?.productionDefinition?.availableProduceActors as ObjectNames[] | undefined;
      if (!available) return;
      available.forEach((actor) => {
        const cost = getCostForObjectName(actor);
        if (!cost) return;
        const total = this.sumResources(cost);
        if (total < cheapest) cheapest = total;
      });
    });
    if (!Number.isFinite(cheapest)) return 150; // fallback guard
    return Math.max(80, Math.round(cheapest));
  }

  private sumResources(cost: Partial<Record<ResourceType, number>>): number {
    let sum = 0;
    for (const key in cost) {
      const r = key as ResourceType;
      sum += cost[r] ?? 0;
    }
    return sum;
  }

  // ---- Getters (Agent queries) ----
  getBaseHeavyAttackThreshold() {
    return this.baseHeavyAttackThreshold;
  }
  getMilitaryPowerThreshold() {
    return this.militaryPowerThreshold;
  }
  getMilitaryUnitTarget() {
    return this.militaryUnitTarget;
  }
  getResourceSurplusThreshold() {
    return this.resourceSurplusThreshold;
  }
  getResourceGatheringThreshold() {
    return this.resourceGatheringThreshold;
  }
  getNeedMoreResourcesThreshold() {
    return this.needMoreResourcesThreshold;
  }
  getHasSufficientResourcesThreshold() {
    return this.hasSufficientResourcesThreshold;
  }
  getHasEnoughResourcesForWorkerThreshold() {
    return this.hasEnoughResourcesForWorkerThreshold;
  }
  getSufficientResourcesForUpgradeThreshold() {
    return this.sufficientResourcesForUpgradeThreshold;
  }
  getHasEnoughResourcesForMilitaryUnitThreshold() {
    return this.hasEnoughResourcesForMilitaryUnitThreshold;
  }
}
