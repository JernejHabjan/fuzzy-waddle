import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { getCostForObjectName } from "../../../entity/components/production/cost-utils";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { AI_CONFIG } from "../ai-config";
import { State } from "mistreevous";

/**
 * LogisticsManager
 * - Evaluates resource stockpiles & rebalances gatherers.
 * - Heuristics kept intentionally simple (extend later with demand curves).
 */
export class LogisticsManager {
  private readonly rebalanceCooldownMs = 4000;
  private readonly severeImbalanceRatio = 2.8;
  private readonly mildImbalanceRatio = 1.8;
  private lastRebalanceAt = 0;

  constructor(
    private readonly blackboard: PlayerAiBlackboard,
    private readonly log: (...args: any[]) => void
  ) {}

  shouldRebalance(): boolean {
    const now = Date.now();
    if (now - this.lastRebalanceAt < this.rebalanceCooldownMs) return false;
    const scarce = this.blackboard.getMostNeededResource();
    if (!scarce) return false;
    // If we have < 40% theoretical target (naive) we attempt rebalance
    const total = this.blackboard.getTotalResources();
    if (total === 0) return true;
    const share = (this.blackboard.resources[scarce.type] ?? 0) / total;
    return share < 0.25;
  }

  stockpileImbalanceDetected(): boolean {
    const r = this.blackboard.resources;
    const values = Object.values(r).filter((v) => v > 0);
    if (values.length < 2) return false;
    const max = Math.max(...values);
    const min = Math.min(...values);
    return max / (min || 1) >= this.severeImbalanceRatio;
  }

  async redirectToScarce(): Promise<State> {
    const scarceResource = this.getMostConstrainedResource();
    if (!scarceResource) return State.FAILED;

    const workers = this.blackboard.workers.filter((worker) => {
      const gatherer = getActorComponent(worker, GathererComponent);
      return gatherer && gatherer.isGathering;
    });

    if (workers.length === 0) return State.FAILED;

    // Reassign workers currently gathering other resources
    let reassignedCount = 0;
    for (const worker of workers) {
      const gatherer = getActorComponent(worker, GathererComponent);
      if (!gatherer) continue;

      // Skip if already gathering the scarce resource
      const currentTarget = gatherer.currentResourceSource;
      if (currentTarget && currentTarget.name.includes(scarceResource)) {
        continue;
      }

      const closestResourceSource = await gatherer.getClosestResourceSource(
        scarceResource,
        AI_CONFIG.gatherSearchRadius
      );
      if (!closestResourceSource) continue;

      gatherer.startGatheringResources(closestResourceSource);
      reassignedCount++;
    }

    if (reassignedCount > 0) {
      this.log(`Redirected ${reassignedCount} workers to gather scarce resource: ${scarceResource}`);
      this.lastRebalanceAt = Date.now();
      return State.SUCCEEDED;
    }

    return State.FAILED;
  }

  async rebalanceHarvesters(): Promise<State> {
    const now = Date.now();
    if (now - this.lastRebalanceAt < this.rebalanceCooldownMs) return State.FAILED;

    const scarceResource = this.getMostConstrainedResource();
    if (!scarceResource) return State.FAILED;

    // Redirect workers to scarce resource
    return this.redirectToScarce();
  }

  getMostConstrainedResource(): ResourceType | null {
    const { resources, economy, production } = this.blackboard;
    const resourceData: { [key in ResourceType]?: { score: number } } = {};

    // 1. Projected spend
    const projectedSpend: Record<ResourceType, number> = { wood: 0, stone: 0, minerals: 0, ambrosia: 0 };
    // from queues
    this.blackboard.trainingBuildings.forEach((b) => {
      const prod = getActorComponent(b, ProductionComponent);
      if (prod) {
        prod.itemsFromAllQueues.forEach((item) => {
          const cost = getCostForObjectName(item.actorName);
          if (cost) {
            for (const key in cost) {
              const r = key as ResourceType;
              projectedSpend[r] += cost[r] ?? 0;
            }
          }
        });
      }
    });
    // from planned buildings
    this.blackboard.production.plannedStructures.forEach((p) => {
      for (const key in p.cost) {
        const r = key as ResourceType;
        projectedSpend[r] += p.cost[r] ?? 0;
      }
    });

    for (const key in resources) {
      const r = key as ResourceType;
      resourceData[r] = { score: 0 };

      // score based on current stock (lower is higher score)
      resourceData[r]!.score += 1 / (resources[r] + 1);

      // score based on demand
      const demand = projectedSpend[r];
      if (demand > 0) {
        resourceData[r]!.score += demand / (resources[r] + 1);
      }

      // score based on income (lower income is higher score)
      const income = economy.incomeSmoothed[r] || 0;
      resourceData[r]!.score += 1 / (income + 1);
    }

    // find resource with highest score
    let maxScore = -1;
    let mostConstrained: ResourceType | null = null;
    for (const key in resourceData) {
      const r = key as ResourceType;
      if (resourceData[r]!.score > maxScore) {
        maxScore = resourceData[r]!.score;
        mostConstrained = r;
      }
    }

    return mostConstrained;
  }
}
