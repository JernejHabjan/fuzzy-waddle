import { State } from "mistreevous";
import { FactionType, ObjectNames, ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { getCostForObjectName } from "../../../entity/components/production/cost-utils";
import { ProductionValidator } from "../../../data/tech-tree/production-validator";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AI_CONFIG } from "../ai-config";
import { FlyingComponent } from "../../../entity/components/movement/flying-component";
import { AdaptiveThresholdManager } from "./adaptive-threshold-manager";
import { getUnitStrength } from "../ai-utils";

/**
 * ForceMaintenanceManager
 * - Decides whether to queue more military units.
 * - Selects appropriate units (melee/ranged) based on enemy threats.
 * - Handles cooldown, resource checks, and production validation.
 */
export class ForceMaintenanceManager {
  private lastUnitQueueTime = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly blackboard: PlayerAiBlackboard,
    private readonly log: (...args: any[]) => void,
    private readonly productionValidator: ProductionValidator,
    private readonly adaptiveThresholds: AdaptiveThresholdManager
  ) {}

  shouldProduceMilitaryUnit(): boolean {
    const targetStrength = this.adaptiveThresholds.getMilitaryUnitTargetStrength();
    const now = performance.now();
    if (now - this.lastUnitQueueTime < AI_CONFIG.unitQueueCooldownMs) return false;
    const unitsStrength = this.blackboard.units.reduce((sum, u) => sum + getUnitStrength(u), 0);
    return unitsStrength < targetStrength;
  }

  hasResourcesForQueuedUnit(): boolean {
    // A simple check to see if we have enough for a basic unit.
    // The main queueing logic does a more specific check.
    return (
      this.blackboard.getTotalResources() >= this.adaptiveThresholds.getHasEnoughResourcesForMilitaryUnitThreshold()
    );
  }

  isSupplyCapped(): boolean {
    return this.blackboard.production.supply.used >= this.blackboard.production.supply.max;
  }

  queueMilitaryUnitProduction(): State {
    const now = performance.now();
    if (!this.hasResourcesForQueuedUnit()) return State.FAILED;
    if (this.blackboard.getTotalResources() < this.adaptiveThresholds.getResourceGatheringThreshold()) {
      return State.FAILED; // economy is low
    }

    const buildings = this.blackboard.trainingBuildings.filter((b) => {
      const prod = getActorComponent(b, ProductionComponent);
      return prod?.isIdle;
    });
    if (!buildings.length) return State.FAILED;

    let productionComponent: ProductionComponent | null = null;
    let pickedUnitName: ObjectNames | null = null;
    let productionCost = null;

    for (const building of buildings) {
      const prod = getActorComponent(building, ProductionComponent);
      if (!prod) continue;

      const availableUnits = prod.productionDefinition.availableProduceActors as ObjectNames[];
      if (availableUnits.length === 0) continue;

      const techTree = getSceneService(this.scene, TechTreeService);
      if (!techTree) continue;

      const enemyHasFlight = this.blackboard.visibleEnemies.some((enemy) => getActorComponent(enemy, FlyingComponent));

      let preferredUnits: ObjectNames[];
      if (enemyHasFlight) {
        this.log("Enemy has flying units, prioritizing ranged units.");
        preferredUnits = techTree.getRangedInfantryUnits(availableUnits);
        // Fallback to melee if no ranged are available from this building
        if (preferredUnits.length === 0) {
          preferredUnits = techTree.getMeleeInfantryUnits(availableUnits);
        }
      } else {
        preferredUnits = techTree.getMeleeInfantryUnits(availableUnits);
        // Fallback to ranged if no melee are available
        if (preferredUnits.length === 0) {
          preferredUnits = techTree.getRangedInfantryUnits(availableUnits);
        }
      }

      if (preferredUnits.length === 0) continue;

      for (const unitName of preferredUnits) {
        const validation = this.productionValidator.validate(unitName);
        if (!validation.canQueue) {
          const hasPrereqs =
            validation.prereqs.objectNames.length > 0 ||
            validation.prereqs.researchTypes.length > 0 ||
            Object.keys(validation.prereqs.resources).length > 0 ||
            (validation.prereqs.supply !== null && validation.prereqs.supply > 0);

          if (hasPrereqs) {
            this.productionValidator.schedulePrerequisites(validation, unitName);
          }
          continue;
        }

        const cost = getCostForObjectName(unitName);
        if (!cost || !this.blackboard.hasAtLeastResources(cost)) {
          continue;
        }

        const def = pwActorDefinitions[unitName];
        if (!def?.components?.productionCost) continue;

        productionComponent = prod;
        productionCost = def.components.productionCost;
        pickedUnitName = unitName;
        break;
      }
    }

    if (!productionComponent || productionCost === null || pickedUnitName === null) return State.FAILED;

    productionComponent.startProduction({
      actorName: pickedUnitName,
      costData: productionCost
    });

    this.lastUnitQueueTime = now;
    this.log(`Queued military unit production: ${pickedUnitName}`);
    return State.SUCCEEDED;
  }
}
