import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { BasePlanner } from "./base-planner";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getApproxWoodCost } from "../../../entity/components/production/cost-utils";

/**
 * AdaptiveThresholdManager
 * - Derives dynamic thresholds that previously were hard-coded in PlayerAiControllerAgent.
 * - Recompute periodically (e.g. after map analysis or base replanning).
 * - Uses simple heuristic formulas; can be extended with time-series / ML later.
 */
export class AdaptiveThresholdManager {
  // Internal dynamic thresholds (public getters below)
  private baseHeavyAttackThreshold = 10;
  private militaryPowerThreshold = 3;
  private resourceSurplusThreshold = 500;
  private resourceGatheringThreshold = 300;
  private needMoreResourcesThreshold = 5000;
  private hasSufficientResourcesThreshold = 500;
  private hasEnoughResourcesForWorkerThreshold = 100;
  private sufficientResourcesForUpgradeThreshold = 1000;

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

    // Enemy strength heuristics
    const enemyStr = Math.max(1, bb.enemyMilitaryStrength || 1);
    const ourUnits = bb.units.length || 0;

    // Military power threshold:
    // - Aggressive: push closer to enemy power (80%)
    // - Defensive: 60%
    // - Economic: 50%
    const strategyFactor = bb.currentStrategy === "aggressive" ? 0.8 : bb.currentStrategy === "defensive" ? 0.6 : 0.5;
    this.militaryPowerThreshold = Math.max(3, Math.round(enemyStr * strategyFactor));

    // Heavy attack threshold:
    // Scales with enemy strength plus buffer, ensures >= militaryPowerThreshold * 1.5
    this.baseHeavyAttackThreshold = Math.max(
      Math.round(this.militaryPowerThreshold * 1.5),
      Math.min(30, Math.round(enemyStr * 0.65 + 5))
    );

    // Planned building cost aggregation (rough predictive demand)
    const upcomingCosts = this.estimatePendingBuildingCosts();

    // Need more resources threshold:
    // Aim to keep a buffer equal to 1x upcoming building cost or fallback to 1200
    this.needMoreResourcesThreshold = Math.max(800, Math.round(upcomingCosts.total * 1.0) || 1200);

    // Surplus threshold aims for 40% of (needMore + current) but clamps
    this.resourceSurplusThreshold = Math.min(
      Math.max(500, Math.round((this.needMoreResourcesThreshold + totalResources) * 0.4)),
      5000
    );

    // Resource gathering threshold is a low watermark to aggressively gather below it
    this.resourceGatheringThreshold = Math.max(200, Math.round(this.resourceSurplusThreshold * 0.6));

    // Sufficient resources (for expansion triggers) sits between gather and surplus
    this.hasSufficientResourcesThreshold = Math.round(
      (this.resourceGatheringThreshold + this.resourceSurplusThreshold) / 2
    );

    // Worker training threshold:
    // If low on workers (<10) reduce bar; else raise slightly
    this.hasEnoughResourcesForWorkerThreshold = ourUnits < 10 ? 80 : 120;

    // Upgrade threshold scales with upcomingCosts + base factor
    this.sufficientResourcesForUpgradeThreshold = Math.max(600, Math.round(upcomingCosts.total * 0.5 + 400));
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
    // Per-Definition Supply Costing Integration (replaces static switch; preserves fallback behavior)
    switch (obj) {
      case ObjectNames.WorkMill:
        return getApproxWoodCost(obj, 120);
      case ObjectNames.Owlery:
        return getApproxWoodCost(obj, 160);
      case ObjectNames.InfantryInn:
        return getApproxWoodCost(obj, 200);
      default:
        return getApproxWoodCost(obj, 100);
    }
  }

  // ---- Getters (Agent queries) ----
  getBaseHeavyAttackThreshold() {
    return this.baseHeavyAttackThreshold;
  }
  getMilitaryPowerThreshold() {
    return this.militaryPowerThreshold;
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
}
