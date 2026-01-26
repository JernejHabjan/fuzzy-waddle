// Centralized production & queue validation using tech tree, supply & resource state.
import {
  FactionType,
  ObjectNames,
  type PlayerNumber,
  ProbableWafflePlayer,
  ResourceType
} from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "../../player/ai-controller/player-ai-blackboard";
import { TechTreeService } from "./tech-tree.service";
import { getCostForObjectName } from "../../entity/components/production/cost-utils";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { getPlayer } from "../scene-data";
import { pwActorDefinitions } from "../../prefabs/definitions/actor-definitions";
import { getActorComponent } from "../actor-component";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { ProductionInvalidReason } from "./production-invalid-reason";
import type { ProductionValidationResult } from "./production-validation-result";
import { RandomService } from "../../world/services/random.service";

export class ProductionValidator {
  private static readonly debugEnabled = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly blackboard: PlayerAiBlackboard
  ) {}

  validate(actorName: ObjectNames): ProductionValidationResult {
    const result: ProductionValidationResult = { canQueue: true, prereqs: [] };
    const techSvc = getSceneService(this.scene, TechTreeService);
    const faction = this.player.factionType;
    const playerNumber = this.player.playerNumber;

    // Validate player number exists
    if (playerNumber === undefined) {
      result.canQueue = false;
      result.reason = ProductionInvalidReason.TechLocked;
      return result;
    }

    // Tech checks using tech tree (now player-based, not faction-based)
    ProductionValidator.validateTechPrerequisites(techSvc, playerNumber, faction, actorName, result);

    // Additional validation: check if actor exists in tech tree
    if (techSvc && faction != null) {
      const definition = techSvc.getDefinition(faction, actorName);
      if (!definition) {
        result.canQueue = false;
        result.reason = ProductionInvalidReason.TechLocked;
        if (ProductionValidator.debugEnabled) {
          // eslint-disable-next-line no-console
          console.warn(`[ProductionValidator] Actor ${actorName} not found in tech tree for faction ${faction}`);
        }
        return result;
      }
    }

    // Check building prerequisites
    this.validateBuildingPrerequisites(actorName, result);

    // Supply check (simple): if projected queued would exceed capacity
    const supply = this.blackboard.production.supply;
    if (supply.max > 0 && supply.used + supply.pendingFromQueued >= supply.max) {
      result.canQueue = false;
      result.supplyBlocked = true;
      result.reason = result.reason || ProductionInvalidReason.SupplyBlocked;
    }

    // Resource cost check (only if tech & supply OK)
    const cost = getCostForObjectName(actorName);
    result.cost = cost;
    if (result.canQueue && cost) {
      if (!this.blackboard.hasAtLeastResources(cost)) {
        result.canQueue = false;
        result.reason = ProductionInvalidReason.NotEnoughResources;
      }
    }

    if (ProductionValidator.debugEnabled && !result.canQueue) {
      // eslint-disable-next-line no-console
      console.debug("[ProductionValidator] block", {
        actorName,
        reason: result.reason,
        prereqs: result.prereqs,
        missingBuildings: result.missingBuildings
      });
    }
    return result;
  }

  private validateBuildingPrerequisites(actorName: ObjectNames, result: ProductionValidationResult): void {
    const def = pwActorDefinitions[actorName];
    const buildingPrereqs = def?.components?.buildingPrerequisites;

    if (!buildingPrereqs) return;

    const missingBuildings: ObjectNames[] = [];

    // Check requiresAnyOf
    if (buildingPrereqs.requiresAnyOf && buildingPrereqs.requiresAnyOf.length > 0) {
      const hasAnyRequired = buildingPrereqs.requiresAnyOf.some((requiredBuilding) =>
        this.blackboard.productionBuildings.some((building) => {
          return building.name === requiredBuilding;
        })
      );

      if (!hasAnyRequired) {
        result.canQueue = false;
        result.buildingPrereqBlocked = true;
        result.reason = ProductionInvalidReason.BuildingPrerequisitesMissing;
        missingBuildings.push(...buildingPrereqs.requiresAnyOf);
      }
    }

    // Check requiresAllOf
    if (buildingPrereqs.requiresAllOf && buildingPrereqs.requiresAllOf.length > 0) {
      const missingRequired = buildingPrereqs.requiresAllOf.filter(
        (requiredBuilding) =>
          !this.blackboard.productionBuildings.some((building) => {
            return building.name === requiredBuilding;
          })
      );

      if (missingRequired.length > 0) {
        result.canQueue = false;
        result.buildingPrereqBlocked = true;
        result.reason = ProductionInvalidReason.BuildingPrerequisitesMissing;
        missingBuildings.push(...missingRequired);
      }
    }

    if (missingBuildings.length > 0) {
      result.missingBuildings = missingBuildings;
      // Also populate prereqs to maintain consistency with tech prerequisite validation
      result.prereqs = [...(result.prereqs || []), ...missingBuildings];
    }
  }

  /** Insert prerequisite tasks into blackboard production prereqQueue (order: earliest first). */
  schedulePrerequisites(prereqs: ObjectNames[], finalTarget: ObjectNames) {
    const now = performance.now();
    // Insert in reverse so that earliest prerequisite appears first in queue processing
    prereqs.reverse().forEach((p) => {
      const randomService = getSceneService(this.scene, RandomService)!;
      this.blackboard.production.prereqQueue.push({
        id: `${p}-${now}-${randomService.random().toString(36).slice(2)}`,
        type: "construct", // default semantic; execution layer decides produce vs construct
        objectName: p,
        insertedAt: now
      });
    });
  }

  private static validateTechPrerequisites(
    techSvc: TechTreeService | undefined,
    playerNumber: PlayerNumber,
    faction: FactionType | undefined,
    actorName: ObjectNames,
    result: ProductionValidationResult
  ) {
    if (techSvc && faction != null) {
      // Check if unlocked for this specific player, not just faction
      if (!techSvc.isUnlocked(playerNumber, actorName)) {
        const prereqs = techSvc.getPrerequisites(playerNumber, faction, actorName);
        if (prereqs.size > 0) {
          result.canQueue = false;
          result.techBlocked = true;
          result.prereqs = Array.from(prereqs);
          result.reason = ProductionInvalidReason.TechLocked;
        }
      }
    }
  }

  private static validateBuildingPrerequisitesStatic(
    scene: Phaser.Scene,
    playerNumber: PlayerNumber,
    actorName: ObjectNames,
    result: ProductionValidationResult
  ): void {
    const def = pwActorDefinitions[actorName];
    const buildingPrereqs = def?.components?.buildingPrerequisites;

    if (!buildingPrereqs) return;

    const missingBuildings: ObjectNames[] = [];

    // Get player's buildings from ActorIndexSystem
    const actorIndex = getSceneService(scene, ActorIndexSystem);
    if (!actorIndex) return;

    const ownedActors = actorIndex.getOwnedActors(playerNumber);
    const productionBuildings = Array.from(ownedActors).filter((actor) => {
      return getActorComponent(actor, ProductionComponent) !== undefined;
    });

    // Check requiresAnyOf
    if (buildingPrereqs.requiresAnyOf && buildingPrereqs.requiresAnyOf.length > 0) {
      const hasAnyRequired = buildingPrereqs.requiresAnyOf.some((requiredBuilding) =>
        productionBuildings.some((building) => {
          return building.name === requiredBuilding;
        })
      );

      if (!hasAnyRequired) {
        result.canQueue = false;
        result.buildingPrereqBlocked = true;
        result.reason = ProductionInvalidReason.BuildingPrerequisitesMissing;
        missingBuildings.push(...buildingPrereqs.requiresAnyOf);
      }
    }

    // Check requiresAllOf
    if (buildingPrereqs.requiresAllOf && buildingPrereqs.requiresAllOf.length > 0) {
      const missingRequired = buildingPrereqs.requiresAllOf.filter(
        (requiredBuilding) =>
          !productionBuildings.some((building) => {
            return building.name === requiredBuilding;
          })
      );

      if (missingRequired.length > 0) {
        result.canQueue = false;
        result.buildingPrereqBlocked = true;
        result.reason = ProductionInvalidReason.BuildingPrerequisitesMissing;
        missingBuildings.push(...missingRequired);
      }
    }

    if (missingBuildings.length > 0) {
      result.missingBuildings = missingBuildings;
      // Also populate prereqs to maintain consistency with tech prerequisite validation
      result.prereqs = [...(result.prereqs || []), ...missingBuildings];
    }
  }

  static validateObject(
    scene: Phaser.Scene,
    playerNumber: PlayerNumber,
    actorName: ObjectNames,
    currentCost: Partial<Record<ResourceType, number>> = {}
  ): ProductionValidationResult {
    const result: ProductionValidationResult = { canQueue: true, prereqs: [] };
    const player = getPlayer(scene, playerNumber);
    if (!player) {
      result.canQueue = false;
      return result;
    }

    // Tech checks (now player-based)
    const techSvc = getSceneService(scene, TechTreeService);
    const faction = player.factionType;
    ProductionValidator.validateTechPrerequisites(techSvc, playerNumber, faction, actorName, result);

    // Check building prerequisites
    ProductionValidator.validateBuildingPrerequisitesStatic(scene, playerNumber, actorName, result);

    // Resource cost check
    const cost = getCostForObjectName(actorName);
    result.cost = cost;
    if (cost) {
      const totalCost = { ...currentCost };
      for (const resource in cost) {
        totalCost[resource as ResourceType] =
          (totalCost[resource as ResourceType] || 0) + cost[resource as ResourceType]!;
      }

      if (!player.canPayAllResources(totalCost)) {
        result.canQueue = false;
        result.reason = ProductionInvalidReason.NotEnoughResources;
      }
    }

    return result;
  }
}
