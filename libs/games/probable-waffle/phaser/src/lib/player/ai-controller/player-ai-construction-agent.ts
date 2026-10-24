import { State } from "mistreevous";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { type Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { getActorComponent } from "../../data/actor-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { ResearchComponent } from "../../entity/components/research/research-component";
import { getPwActorDefinition, pwActorDefinitions } from "../../prefabs/definitions/actor-definitions";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { AI_CONFIG } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/ai-config";
import { dispatchProductionCommand, dispatchResearchCommand } from "../../data/commands/queue-command-dispatch";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PlayerAiAgentContext } from "./player-ai-agent-context";

/** Retains legacy construction and prerequisite application on the shared agent context. */
export class PlayerAiConstructionAgent extends PlayerAiAgentContext {
  /**
   * Drains planned prerequisites in priority order while rechecking live ownership, resources, and production availability.
   * It prevents duplicate requests and leaves unresolved work queued for a later AI cadence rather than forcing an invalid build.
   */
  protected processPrerequisiteQueue() {
    const queue = this.blackboard.production.prereqQueue;
    if (!queue || queue.length === 0) return;
    const next = queue[0];
    if (!next) return;

    // Handle different prerequisite types
    switch (next.type) {
      case "prefab": {
        // Extract the target object name from the prereq
        const targetObjectName =
          next.preRequirement.prereqs.objectNames.length > 0 ? next.preRequirement.prereqs.objectNames[0] : null;

        if (!targetObjectName) {
          queue.shift(); // Remove invalid entry
          return;
        }

        // Heuristic: attempt construct via assignBuilding if building definition exists; else attempt production.
        const isBuilding = getPwActorDefinition(targetObjectName, null)?.components?.production; // buildings have production component usually
        if (isBuilding) {
          const state = this.assignBuilding(targetObjectName);
          if (state === State.SUCCEEDED) queue.shift();
          return;
        } else {
          // Attempt to queue production in any idle training building
          const prodBuilding = this.blackboard.trainingBuildings.find((b) => {
            const prod = getActorComponent(b, ProductionComponent);
            return prod?.isIdle;
          });
          if (prodBuilding) {
            const prod = getActorComponent(prodBuilding, ProductionComponent);
            if (prod) {
              const validation = this.productionValidator.validate(targetObjectName);
              if (validation && !validation.canQueue) {
                // If still blocked (e.g., nested prereqs) schedule them (avoid infinite loop by checking difference)
                const hasPrereqs =
                  validation.prereqs.objectNames.length > 0 ||
                  validation.prereqs.researchTypes.length > 0 ||
                  Object.keys(validation.prereqs.resources).length > 0 ||
                  (validation.prereqs.supply !== null && validation.prereqs.supply > 0);

                if (hasPrereqs) {
                  this.productionValidator.schedulePrerequisites(validation, targetObjectName);
                }
                return;
              }
              if (dispatchProductionCommand(this.scene, [prodBuilding], this.player.playerNumber!, targetObjectName)) {
                queue.shift();
              }
            }
          }
        }
        break;
      }

      case "research": {
        const researchType =
          next.preRequirement.prereqs.researchTypes.length > 0 ? next.preRequirement.prereqs.researchTypes[0] : null;

        if (!researchType) {
          queue.shift(); // Remove invalid entry
          return;
        }

        // Check if already researched
        const owner = this.player.playerNumber;
        if (owner !== undefined && getSceneService(this.scene, TechTreeService)!.isResearched(owner, researchType)) {
          queue.shift(); // Already completed
          return;
        }

        // Find a building that can perform this research and is not currently researching
        const researchBuilding = this.blackboard.productionBuildings.find((b) => {
          const researchComponent = getActorComponent(b, ResearchComponent);
          if (!researchComponent) return false;

          // Check if building can perform this specific research and is not currently researching
          return researchComponent.availableResearch.includes(researchType) && !researchComponent.isResearching;
        });

        if (researchBuilding) {
          const researchComponent = getActorComponent(researchBuilding, ResearchComponent);
          if (researchComponent) {
            const started = dispatchResearchCommand(
              this.scene,
              researchBuilding,
              this.player.playerNumber!,
              researchType
            );
            if (started) {
              this.logDebugInfo(`[AI] Started research: ${researchType}`);
              queue.shift(); // Successfully started, remove from queue
            } else {
              const validation = researchComponent.canStartResearch(researchType);
              this.logDebugInfo(`[AI] Cannot start research ${researchType}: ${validation.reason}`);
              // Don't remove from queue, might become available later (e.g., when resources arrive)
            }
          }
        } else {
          // No building available for this research - might need to build one first
          this.logDebugInfo(`[AI] No building available for research: ${researchType}`);
        }
        break;
      }

      case "supply": {
        const requiredSupply = next.preRequirement.prereqs.supply;
        if (!requiredSupply) {
          queue.shift(); // Remove invalid entry
          return;
        }

        // Check if we now have enough supply
        const currentSupply = this.blackboard.production.supply.max;
        const currentSupplyUsed = this.blackboard.production.supply.used;
        const availableSupply = currentSupply - currentSupplyUsed;

        if (availableSupply >= requiredSupply) {
          queue.shift(); // Supply requirement met
        } else {
          // Try to build supply structures
          // Find supply-providing building (e.g., house, farm, etc.)
          const supplyBuildingEntry = Object.entries(pwActorDefinitions)
            .filter(([_, def]) => !!def?.components?.housing?.housingCapacity)
            .sort(([, defA], [, defB]) => {
              const capA = defA?.components?.housing?.housingCapacity ?? 0;
              const capB = defB?.components?.housing?.housingCapacity ?? 0;
              return capB - capA; // Descending order (higher capacity first)
            })[0];

          if (supplyBuildingEntry) {
            const [supplyBuildingName] = supplyBuildingEntry;
            this.assignBuilding(supplyBuildingName as ObjectNames);
            // Don't remove from queue until supply is actually available
          }
        }
        break;
      }

      case "resources": {
        const requiredResources = next.preRequirement.prereqs.resources;
        if (!requiredResources || Object.keys(requiredResources).length === 0) {
          queue.shift(); // Remove invalid entry
          return;
        }

        // Check if we now have enough resources
        let hasAllResources = true;
        for (const [resourceType, amount] of Object.entries(requiredResources)) {
          const currentAmount = this.blackboard.economy.resources[resourceType as ResourceType] || 0;
          if (amount !== undefined && currentAmount < amount) {
            hasAllResources = false;
            break;
          }
        }

        if (hasAllResources) {
          queue.shift(); // Resource requirement met
        }
        // Otherwise wait for resources to accumulate
        break;
      }
    }
  }

  /**
   * Selects and assigns a feasible building task from the AI plan.
   * It balances capacity, placement, prerequisites, and current economy while preserving the controller's deterministic scheduling boundaries.
   */
  protected assignBuilding(buildingType: ObjectNames, preferredLocationTileXY?: Vector3Simple): State {
    // Preferred order:
    // 1. Explicit preferredLocationTileXY (reserved)
    // 2. Consumed plan for type
    // 3. Existing planned tile for type (not yet consumed)
    // 4. Heuristic radial search
    let tileLocationXYZ: Vector3Simple | null = preferredLocationTileXY ?? null;
    let planConsumed: { tile: { x: number; y: number } } | null = null;
    if (!tileLocationXYZ) {
      const consumed = this.basePlanner.consumePlanForType(buildingType);
      if (consumed) {
        planConsumed = consumed;
        tileLocationXYZ = { x: consumed.tile.x, y: consumed.tile.y, z: 0 } as Vector3Simple;
      }
    }
    if (!tileLocationXYZ) {
      const plannedTile = this.basePlanner.getPlannedTileForType(buildingType);
      if (plannedTile) {
        tileLocationXYZ = { x: plannedTile.x, y: plannedTile.y, z: 0 } as Vector3Simple;
      }
    }

    // Improved placement (legacy fallback) if still no location
    if (!tileLocationXYZ) {
      const baseCenter = this.blackboard.baseCenterTile;
      const index = getSceneService(this.scene, ActorIndexSystem);
      if (baseCenter && index) {
        outer: for (
          let r = AI_CONFIG.buildingPlacementSearchStartRadius;
          r <= AI_CONFIG.buildingPlacementSearchMaxRadius;
          r += AI_CONFIG.buildingPlacementSearchIncrement
        ) {
          for (let dx = -r; dx <= r; dx += AI_CONFIG.buildingPlacementSearchStep) {
            for (let dy = -r; dy <= r; dy += AI_CONFIG.buildingPlacementSearchStep) {
              const tile = { x: baseCenter.x + dx, y: baseCenter.y + dy };
              if (index.isTileFree(tile)) {
                tileLocationXYZ = { x: tile.x, y: tile.y, z: 0 } as Vector3Simple;
                break outer;
              }
            }
          }
        }
      }
      if (!tileLocationXYZ) {
        // Fallback random near first worker if no free tile found
        const worker = this.blackboard.workers[0];
        if (!worker) return State.FAILED;
        const transform = getGameObjectLogicalTransform(worker);
        const rx =
          transform!.x +
          this.randomService.between(0, AI_CONFIG.buildingPlacementRandomOffsetRange) -
          AI_CONFIG.buildingPlacementRandomOffsetRange;
        const ry =
          transform!.y +
          this.randomService.between(0, AI_CONFIG.buildingPlacementRandomOffsetRange) -
          AI_CONFIG.buildingPlacementRandomOffsetRange;
        tileLocationXYZ = { x: rx, y: ry, z: 0 } as Vector3Simple;
      }
    }

    const validWorkers = this.blackboard.workers.filter((worker) => {
      const aiController = getActorComponent(worker, PawnAiController);
      if (!aiController) return false;
      const builderComponent = getActorComponent(worker, BuilderComponent);
      return (
        !!builderComponent &&
        builderComponent.isIdle() &&
        builderComponent.constructableBuildings.includes(buildingType)
      );
    });
    if (validWorkers.length === 0) {
      // Release consumed plan if no workers available
      if (planConsumed) this.basePlanner.releasePlanAt(planConsumed.tile);
      return State.FAILED;
    }

    const workerIds = validWorkers
      .map((worker) => getActorComponent(worker, IdComponent)?.id)
      .filter((actorId): actorId is string => actorId !== undefined);
    const commandBus = getSceneService(this.scene, CommandBusService);
    const dispatch = commandBus?.dispatch({
      type: "CONSTRUCT",
      playerNumber: this.player.playerNumber!,
      actorIds: workerIds,
      actorName: buildingType,
      tileVec3: tileLocationXYZ,
      siteKey: `${this.player.playerNumber}:${buildingType}:${tileLocationXYZ.x}:${tileLocationXYZ.y}`
    });
    if (!dispatch || dispatch.status !== "dispatched") {
      if (planConsumed) this.basePlanner.releasePlanAt(planConsumed.tile);
      return State.FAILED;
    }
    // Mark reservation usage & release any lingering plan reservation reference
    this.basePlanner.markTileUsed({ x: tileLocationXYZ.x, y: tileLocationXYZ.y });
    this.basePlanner.releasePlanAt({ x: tileLocationXYZ.x, y: tileLocationXYZ.y });
    this.logDebugInfo("Assigned workers to build a new building (planned-aware).");
    return State.SUCCEEDED;
  }
}
