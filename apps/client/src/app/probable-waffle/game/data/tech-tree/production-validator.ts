// Centralized production & queue validation using tech tree, supply & resource state.
import {
  ObjectNames,
  type PlayerNumber,
  PreRequirement,
  ProbableWafflePlayer,
  ResourceType
} from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "../../player/ai-controller/player-ai-blackboard";
import { TechTreeService } from "./tech-tree.service";
import { getCostForObjectName } from "../../entity/components/production/cost-utils";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { getPlayer } from "../scene-data";
import { getPwActorDefinition } from "../../prefabs/definitions/actor-definitions";
import { getActorComponent } from "../actor-component";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { RandomService } from "../../world/services/random.service";
import { shouldConsiderActorUnlocked } from "./actor-unlock-utils";

export class ProductionValidator {
  private static readonly debugEnabled = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly blackboard: PlayerAiBlackboard
  ) {}

  validate(actorName: ObjectNames): PreRequirement {
    const result: PreRequirement = new PreRequirement();
    const techSvc = getSceneService(this.scene, TechTreeService);
    const playerNumber = this.player.playerNumber;

    // Validate player number exists
    if (playerNumber === undefined) {
      throw new Error("Player number is undefined for production validation");
    }

    // Tech checks using unified tech tree (supports multi-faction gameplay)
    ProductionValidator.validateTechPrerequisites(techSvc, playerNumber, actorName, result);

    // Additional validation: check if actor exists in tech tree
    if (techSvc) {
      const definition = techSvc.getDefinition(actorName);
      if (!definition) {
        throw new Error(`TechTreeService is missing definition for ${actorName}`);
      }
    }

    // Check building prerequisites
    this.validateBuildingPrerequisites(actorName, result);

    // Supply check (simple): if projected queued would exceed capacity
    const supply = this.blackboard.production.supply;
    if (supply.max > 0 && supply.used + supply.pendingFromQueued >= supply.max) {
      result.prereqs.supply = supply.max - supply.used - supply.pendingFromQueued;
    }

    // Resource cost check (only if tech & supply OK)
    const cost = getCostForObjectName(actorName);
    if (result.canQueue && cost) {
      if (!this.blackboard.hasAtLeastResources(cost)) {
        result.prereqs.resources = cost;
      }
    }

    if (ProductionValidator.debugEnabled && !result.canQueue) {
      // eslint-disable-next-line no-console
      console.debug("[ProductionValidator] block", {
        actorName,
        reason: JSON.stringify(result.prereqs)
      });
    }
    return result;
  }

  private validateBuildingPrerequisites(actorName: ObjectNames, result: PreRequirement): void {
    const def = getPwActorDefinition(actorName, null);
    const buildingPrereqs = def?.components?.buildingPrerequisites;

    if (!buildingPrereqs) return;

    const missingBuildings: ObjectNames[] = [];

    // Filter buildings to only include finished and alive ones
    const validBuildings = this.blackboard.productionBuildings.filter((building) =>
      shouldConsiderActorUnlocked(building)
    );

    // Check requiresAnyOf
    if (buildingPrereqs.requiresAnyOf && buildingPrereqs.requiresAnyOf.length > 0) {
      const hasAnyRequired = buildingPrereqs.requiresAnyOf.some((requiredBuilding) =>
        validBuildings.some((building) => {
          return building.name === requiredBuilding;
        })
      );

      if (!hasAnyRequired) {
        missingBuildings.push(...buildingPrereqs.requiresAnyOf);
      }
    }

    // Check requiresAllOf
    if (buildingPrereqs.requiresAllOf && buildingPrereqs.requiresAllOf.length > 0) {
      const missingRequired = buildingPrereqs.requiresAllOf.filter(
        (requiredBuilding) =>
          !validBuildings.some((building) => {
            return building.name === requiredBuilding;
          })
      );

      if (missingRequired.length > 0) {
        missingBuildings.push(...missingRequired);
      }
    }

    if (missingBuildings.length > 0) {
      result.prereqs.objectNames.push(...missingBuildings);
    }
  }

  /** Insert prerequisite tasks into blackboard production prereqQueue (order: earliest first). */
  schedulePrerequisites(prereqs: PreRequirement, finalTarget: ObjectNames) {
    const now = performance.now();
    const randomService = getSceneService(this.scene, RandomService)!;
    // Insert in reverse so that earliest prerequisite appears first in queue processing
    const objectNames = [...prereqs.prereqs.objectNames];
    const researchTypes = [...prereqs.prereqs.researchTypes];
    const supply = prereqs.prereqs.supply;
    const resources = prereqs.prereqs.resources;

    objectNames.reverse().forEach((p) => {
      this.blackboard.production.prereqQueue.push({
        id: `${p}-${now}-${randomService.random().toString(36).slice(2)}`,
        type: "prefab",
        preRequirement: new PreRequirement({
          objectNames: [p],
          researchTypes: [],
          resources: {},
          supply: null
        }),
        insertedAt: now
      });
    });
    researchTypes.reverse().forEach((p) => {
      this.blackboard.production.prereqQueue.push({
        id: `${p}-${now}-${randomService.random().toString(36).slice(2)}`,
        type: "research",
        preRequirement: new PreRequirement({
          objectNames: [],
          researchTypes: [p],
          resources: {},
          supply: null
        }),
        insertedAt: now
      });
    });
    if (supply) {
      this.blackboard.production.prereqQueue.push({
        id: `supply-${now}-${randomService.random().toString(36).slice(2)}`,
        type: "supply",
        preRequirement: new PreRequirement({
          objectNames: [],
          researchTypes: [],
          resources: {},
          supply
        }),
        insertedAt: now
      });
    }
    if (resources && Object.keys(resources).length > 0) {
      this.blackboard.production.prereqQueue.push({
        id: `resources-${now}-${randomService.random().toString(36).slice(2)}`,
        type: "resources",
        preRequirement: new PreRequirement({
          objectNames: [],
          researchTypes: [],
          resources,
          supply: null
        }),
        insertedAt: now
      });
    }
  }

  private static validateTechPrerequisites(
    techSvc: TechTreeService | undefined,
    playerNumber: PlayerNumber,
    actorName: ObjectNames,
    result: PreRequirement
  ): void {
    if (techSvc) {
      // Always check prerequisites, regardless of whether unit has been built before
      // This ensures requirements are shown even for "unlocked" units
      // Uses unified tech tree that supports multi-faction gameplay
      const prereqs = techSvc.getPrerequisites(playerNumber, actorName);
      result.prereqs.objectNames.push(...prereqs.prereqs.objectNames);
      result.prereqs.researchTypes.push(...prereqs.prereqs.researchTypes);
    }
  }

  private static validateBuildingPrerequisitesStatic(
    scene: Phaser.Scene,
    playerNumber: PlayerNumber,
    actorName: ObjectNames,
    result: PreRequirement
  ): void {
    const def = getPwActorDefinition(actorName, null);
    const buildingPrereqs = def?.components?.buildingPrerequisites;

    if (!buildingPrereqs) return;

    const missingBuildings: ObjectNames[] = [];

    // Get player's buildings from ActorIndexSystem
    const actorIndex = getSceneService(scene, ActorIndexSystem);
    if (!actorIndex) return;

    const ownedActors = actorIndex.getOwnedActors(playerNumber);
    // Filter to only include production buildings that are finished and alive
    const productionBuildings = Array.from(ownedActors).filter((actor) => {
      return getActorComponent(actor, ProductionComponent) !== undefined && shouldConsiderActorUnlocked(actor);
    });

    // Check requiresAnyOf
    if (buildingPrereqs.requiresAnyOf && buildingPrereqs.requiresAnyOf.length > 0) {
      const hasAnyRequired = buildingPrereqs.requiresAnyOf.some((requiredBuilding) =>
        productionBuildings.some((building) => {
          return building.name === requiredBuilding;
        })
      );

      if (!hasAnyRequired) {
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
        missingBuildings.push(...missingRequired);
      }
    }

    if (missingBuildings.length > 0) {
      result.prereqs.objectNames.push(...missingBuildings);
    }
  }

  static validateObject(
    scene: Phaser.Scene,
    playerNumber: PlayerNumber,
    actorName: ObjectNames,
    currentCost: Partial<Record<ResourceType, number>> = {}
  ): PreRequirement {
    const result: PreRequirement = new PreRequirement();
    const player = getPlayer(scene, playerNumber);
    if (!player) {
      return result;
    }

    // Tech checks using unified tech tree (supports multi-faction gameplay)
    const techSvc = getSceneService(scene, TechTreeService);
    ProductionValidator.validateTechPrerequisites(techSvc, playerNumber, actorName, result);

    // Check building prerequisites
    ProductionValidator.validateBuildingPrerequisitesStatic(scene, playerNumber, actorName, result);

    // Resource cost check
    const cost = getCostForObjectName(actorName);
    if (cost) {
      const totalCost = { ...currentCost };
      for (const resource in cost) {
        totalCost[resource as ResourceType] =
          (totalCost[resource as ResourceType] || 0) + cost[resource as ResourceType]!;
      }

      if (!player.canPayAllResources(totalCost)) {
        result.prereqs.resources = cost;
      }
    }

    return result;
  }
}
