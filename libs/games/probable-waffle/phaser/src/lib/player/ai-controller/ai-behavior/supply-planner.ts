import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";

type SupplyUrgency = "none" | "normal" | "emergency";
interface SupplyAssessment {
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

  assess(now: number = this.blackboard.getNow()): SupplyAssessment {
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

  /**
   * Resolves the faction builder's constructible housing from the tech graph.
   * Capability stays separate from affordability and prerequisites, which the
   * production validator checks when a candidate is admitted for construction.
   */
  getHousingCandidates(techTree: TechTreeService, factionType: FactionType): ObjectNames[] {
    const [, builder] = techTree.getFullAiFoundation(factionType);
    if (!builder) return [];

    return techTree
      .getConstructableBuildings(builder)
      .filter((objectName) => (techTree.getDefinition(objectName)?.components?.housing?.housingCapacity ?? 0) > 0)
      .sort((left, right) => left.localeCompare(right));
  }

  /** Returns the stable first capability candidate, or no candidate when none is legal to construct. */
  getHousingObjectName(techTree: TechTreeService, factionType: FactionType): ObjectNames | null {
    return this.getHousingCandidates(techTree, factionType)[0] ?? null;
  }
}
