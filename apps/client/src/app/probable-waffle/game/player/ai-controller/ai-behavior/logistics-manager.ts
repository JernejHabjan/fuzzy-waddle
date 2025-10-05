import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
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

  redirectToScarce(): State {
    const scarce = this.blackboard.getMostNeededResource();
    if (!scarce) return State.FAILED;
    let reassigned = 0;
    this.blackboard.workers.forEach((w) => {
      if (reassigned >= 3) return;
      const g = getActorComponent(w, GathererComponent);
      if (!g) return;
      // Skip if already gathering target resource
      if (g.currentResourceSource?.type === scarce.type) return;
      const source = g.getClosestResourceSource(scarce.type, 120);
      if (!source) return;
      g.startGatheringResources(source);
      reassigned++;
    });
    if (reassigned > 0) {
      this.log("Redirected workers to scarce resource:", scarce.type);
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  rebalanceHarvesters(): State {
    const now = Date.now();
    if (!this.shouldRebalance()) return State.FAILED;
    const scarce = this.blackboard.getMostNeededResource();
    if (!scarce) return State.FAILED;

    // Release a few workers from the resource with highest stock
    const entries = Object.entries(this.blackboard.resources) as [ResourceType, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const richest = entries[0]?.[0];

    if (richest && richest !== scarce.type) {
      let switched = 0;
      this.blackboard.workers.forEach((w) => {
        if (switched >= 2) return;
        const g = getActorComponent(w, GathererComponent);
        if (!g) return;
        if (g.currentResourceSource?.type !== richest) return;
        const source = g.getClosestResourceSource(scarce.type, 120);
        if (!source) return;
        g.startGatheringResources(source);
        switched++;
      });
      if (switched > 0) {
        this.lastRebalanceAt = now;
        this.log("Rebalanced harvesters from", richest, "to", scarce.type);
        return State.SUCCEEDED;
      }
    }
    return State.FAILED;
  }
}
