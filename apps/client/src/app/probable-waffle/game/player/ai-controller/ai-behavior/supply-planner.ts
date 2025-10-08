import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export type SupplyUrgency = "none" | "normal" | "emergency";
export interface SupplyAssessment {
  urgency: SupplyUrgency;
  reason: string;
}

/**
 * SupplyPlanner
 * - Forecasts near-future supply usage and recommends proactive housing actions.
 * - Currently uses simplistic forecast: current used + queued.
 */
export class SupplyPlanner {
  private lastAssessAt = 0;
  private cached: SupplyAssessment = { urgency: "none", reason: "initial" };
  private readonly assessCooldownMs = 750;
  private readonly normalThresholdBuffer = 3; // if free supply <= buffer -> plan

  constructor(private readonly blackboard: PlayerAiBlackboard) {}

  assess(now: number = performance.now()): SupplyAssessment {
    if (now - this.lastAssessAt < this.assessCooldownMs) return this.cached;
    this.lastAssessAt = now;
    const supply = this.blackboard.production.supply;
    const used = supply.used;
    const max = supply.max || 0;
    const queued = supply.pendingFromQueued || 0;
    const projected = used + queued;
    const free = max - used;
    let urgency: SupplyUrgency = "none";
    let reason = "sufficient";
    if (max === 0) {
      urgency = "normal";
      reason = "no housing established";
    } else if (projected >= max) {
      urgency = "emergency";
      reason = "supply blocked or imminent";
    } else if (free <= this.normalThresholdBuffer) {
      urgency = "normal";
      reason = `low buffer (free=${free})`;
    }
    this.cached = { urgency, reason };
    return this.cached;
  }

  /** Choose housing structure type to build. */
  getHousingObjectName(): ObjectNames {
    return ObjectNames.WorkMill;
  }
}
