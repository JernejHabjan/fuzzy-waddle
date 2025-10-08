import { State } from "mistreevous";
import { ObjectNames, ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { getCostForObjectName } from "../../../entity/components/production/cost-utils";
import { ProductionValidator } from "../../../data/tech-tree/production-validator";

/**
 * ForceMaintenanceManager
 * - Decides whether to queue more military units (simple heuristic for now).
 * - Handles cooldown + resource checks.
 * - Kept separate to isolate production logic away from the agent.
 */
export class ForceMaintenanceManager {
  private lastUnitQueueTime = 0;
  private readonly unitQueueCooldownMs = 5000;

  constructor(
    // scene currently unused but kept to match existing agent instantiation (future pathing / rally logic)
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly blackboard: PlayerAiBlackboard,
    private readonly log: (...args: any[]) => void,
    private readonly productionValidator: ProductionValidator = new ProductionValidator(scene, player, blackboard)
  ) {}

  shouldProduceMilitaryUnit(): boolean {
    const target =
      this.blackboard.currentStrategy === "aggressive" ? 12 : this.blackboard.currentStrategy === "defensive" ? 8 : 6;
    const now = Date.now();
    if (now - this.lastUnitQueueTime < this.unitQueueCooldownMs) return false;
    return this.blackboard.units.length < target;
  }

  hasResourcesForQueuedUnit(): boolean {
    // Per-Definition Supply Costing Integration: use first viable preferred unit cost
    const preferred: ObjectNames[] = [ObjectNames.SkaduweeWarriorMale, ObjectNames.TivaraMacemanMale].filter(
      Boolean
    ) as ObjectNames[];
    for (const unit of preferred) {
      const cost = getCostForObjectName(unit);
      if (!cost) continue;
      if (this.blackboard.hasAtLeastResources(cost)) return true;
    }
    return false;
  }

  queueMilitaryUnitProduction(): State {
    const now = Date.now();
    if (!this.hasResourcesForQueuedUnit()) return State.FAILED;

    const trainingBuildings = this.blackboard.trainingBuildings;
    if (!trainingBuildings || trainingBuildings.length === 0) return State.FAILED;

    const building = trainingBuildings.find((b) => {
      const prod = getActorComponent(b, ProductionComponent);
      return prod && prod.isIdle;
    });
    if (!building) return State.FAILED;

    const prod = getActorComponent(building, ProductionComponent);
    if (!prod) return State.FAILED;

    // Choose first available warrior definition (fallback chain)
    const preferred: ObjectNames[] = [ObjectNames.SkaduweeWarriorMale, ObjectNames.TivaraMacemanMale].filter(Boolean);

    let unitName: ObjectNames | null = null;
    for (const candidate of preferred) {
      if (candidate && pwActorDefinitions[candidate]) {
        unitName = candidate;
        break;
      }
    }
    if (!unitName) return State.FAILED;

    // Centralized validation (now uses injected productionValidator)
    const val = this.productionValidator.validate(unitName);
    if (!val.canQueue) {
      if (val.techBlocked && val.prereqs.length > 0) {
        this.productionValidator.schedulePrerequisites(val.prereqs, unitName);
      }
      return State.FAILED;
    }

    const def = pwActorDefinitions[unitName];
    if (!def?.components?.productionCost) return State.FAILED;
    const costResources = def.components.productionCost.resources; // dynamic cost capture

    prod.startProduction({
      actorName: unitName,
      costData: def.components.productionCost
    });

    this.lastUnitQueueTime = now;
    this.log("Queued military unit production:", unitName);
    return State.SUCCEEDED;
  }
}
