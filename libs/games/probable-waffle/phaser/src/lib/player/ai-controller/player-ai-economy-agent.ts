import { State } from "mistreevous";
import { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../data/actor-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { AI_CONFIG } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/ai-config";
import { dispatchProductionCommand } from "../../data/commands/queue-command-dispatch";

import { dispatchAiOrder } from "./dispatch-ai-order";
import { PlayerAiConstructionAgent } from "./player-ai-construction-agent";

/** Retains legacy workforce, resource and research behavior on the shared agent context. */
export class PlayerAiEconomyAgent extends PlayerAiConstructionAgent {
  NeedMoreResources() {
    const threshold = this.adaptiveThresholds.getNeedMoreResourcesThreshold();
    const total = this.blackboard.getTotalResources();
    const needMore = total < threshold;
    this.logDebugInfo(`[Resources] Need more check: ${total.toFixed(0)} vs ${threshold} = ${needMore ? "YES" : "NO"}`);
    return needMore;
  }

  HasSufficientResources() {
    const threshold = this.adaptiveThresholds.getHasSufficientResourcesThreshold();
    const total = this.blackboard.getTotalResources();
    const sufficient = total >= threshold;
    this.logDebugInfo(
      `[Resources] Sufficient check: ${total.toFixed(0)} vs ${threshold} = ${sufficient ? "YES" : "NO"}`
    );
    return sufficient;
  }

  ResourceShortage() {
    const threshold = this.adaptiveThresholds.getResourceGatheringThreshold();
    const total = this.blackboard.getTotalResources();
    const shortage = total < threshold;
    if (shortage) {
      this.logDebugInfo(`[Resources] SHORTAGE detected: ${total.toFixed(0)} < ${threshold}`);
    }
    return shortage;
  }

  /**
   * Updates the AI workforce plan from current indexed world state.
   * It uses derived needs and existing commands rather than mutating campaign state directly, so host-owned AI remains replayable.
   */
  async AssignWorkersToGather(): Promise<State> {
    const idleWorkers = this.blackboard.getIdleWorkers();
    if (idleWorkers.length === 0) {
      this.logDebugInfo("[Workers] No idle workers to assign");
      this.recordDecision("assignWorkersToGather", "failed", "no_idle_workers");
      return State.FAILED;
    }

    // Use LogisticsManager to determine the most constrained (needed) resource.
    const neededResource = this.logisticsManager.getMostConstrainedResource();
    const targetResource = neededResource ?? ResourceType.Wood;

    if (!neededResource) {
      this.logDebugInfo(
        `[Workers] No specific resource constraint, assigning ${idleWorkers.length} idle workers to ${targetResource} (fallback)`
      );
    } else {
      this.logDebugInfo(
        `[Workers] Assigning ${idleWorkers.length} idle workers to gather ${neededResource} (most constrained)`
      );
    }

    let assigned = 0;
    for (const worker of idleWorkers) {
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) continue;

      // Skip if already gathering the target resource (avoid redundant reassignment)
      const currentTarget = gathererComponent.currentResourceSource;
      if (currentTarget && currentTarget.name && currentTarget.name.includes(targetResource)) {
        continue;
      }

      const closestResourceSource = await gathererComponent.getClosestResourceSource(
        targetResource,
        AI_CONFIG.gatherSearchRadius
      );
      if (closestResourceSource) {
        const aiController = getActorComponent(worker, PawnAiController);
        const newOrder = new OrderData(OrderType.Gather, { targetGameObject: closestResourceSource });
        if (aiController) {
          const result = dispatchAiOrder(this.scene, worker, newOrder, this.player.playerNumber!);
          this.recordDecision(
            "assignWorkersToGather",
            result.status === "dispatched" ? "dispatched" : "failed",
            result.reason
          );
          if (result.status === "dispatched") assigned++;
        }
      }
    }

    this.logDebugInfo(
      `[Workers] Successfully assigned ${assigned}/${idleWorkers.length} workers to gather ${targetResource}`
    );
    return assigned > 0 ? State.SUCCEEDED : State.FAILED;
  }

  HasIdleTrainingBuilding() {
    return this.blackboard.trainingBuildings.some((building) => {
      const productionComponent = getActorComponent(building, ProductionComponent);
      return productionComponent?.isIdle;
    });
  }

  HasEnoughResourcesForWorker() {
    // Evaluate against adaptive threshold (no longer spoofing resources)
    const threshold = this.adaptiveThresholds.getHasEnoughResourcesForWorkerThreshold();
    const total = this.blackboard.getTotalResources();
    const hasEnough = total >= threshold;
    this.logDebugInfo(
      `[Production] Worker cost check: ${total.toFixed(0)} vs ${threshold} = ${hasEnough ? "YES" : "NO"}`
    );
    return hasEnough;
  }

  /**
   * Updates the AI workforce plan from current indexed world state.
   * It uses derived needs and existing commands rather than mutating campaign state directly, so host-owned AI remains replayable.
   */
  TrainWorker() {
    if (!this.HasEnoughResourcesForWorker()) {
      this.logDebugInfo("[Production] Insufficient resources for worker training");
      return State.FAILED;
    }
    const faction = this.player.factionType;
    let workerName = null;
    switch (faction) {
      case FactionType.Skaduwee:
        workerName = ObjectNames.SkaduweeWorker;
        break;
      case FactionType.Tivara:
        workerName = ObjectNames.TivaraWorker;
        break;
      default:
        this.logDebugInfo(`[Production] Unsupported faction for worker training: ${faction}`);
        return State.FAILED; // Unsupported faction
    }
    if (this.productionValidator) {
      const validation = this.productionValidator.validate(workerName);
      if (!validation.canQueue) {
        const hasPrereqs = validation.prereqs.objectNames.length > 0 || validation.prereqs.researchTypes.length > 0;

        if (hasPrereqs) {
          this.logDebugInfo(
            `[Production] Worker training blocked by prerequisites. Scheduling: ${JSON.stringify(validation.prereqs)}`
          );
          this.productionValidator.schedulePrerequisites(validation, workerName);
        }
        return State.FAILED;
      }
    }
    this.logDebugInfo(`[Production] Training new worker: ${workerName}`);
    // find a building that can train this worker
    const trainingBuildings = this.blackboard.trainingBuildings.filter((building) => {
      const productionComponent = getActorComponent(building, ProductionComponent);
      if (!productionComponent) return false;
      if (!productionComponent.isIdle) return false;
      const availableToProduce = productionComponent.productionDefinition.availableProduceActors;
      if (!availableToProduce.includes(workerName)) return false;
      return true;
    });

    if (trainingBuildings.length === 0) return State.FAILED;
    const targetBuilding = trainingBuildings[0]!;
    if (dispatchProductionCommand(this.scene, [targetBuilding], this.player.playerNumber!, workerName)) {
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  GatherResources() {
    const workers = this.blackboard.workers.filter((worker) => {
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return false;
      return gathererComponent.isGathering;
    });
    if (workers.length > 0) {
      this.logDebugInfo("Workers are already gathering resources.");
      this.recordDecision("gatherResources", "succeeded", "already_gathering");
      return State.SUCCEEDED;
    }
    this.recordDecision("gatherResources", "failed", "no_active_gatherers");
    return State.FAILED;
  }

  ContinueNormalGathering() {
    this.logDebugInfo("Continuing normal gathering...");
    return State.SUCCEEDED;
  }

  NeedMoreWorkers(): boolean {
    const currentWorkers = this.blackboard.workers.length;
    const baseSize = this.blackboard.baseSize;
    const enemyStrength = this.blackboard.enemyMilitaryStrength;
    const strategy = this.blackboard.currentStrategy;

    let targetWorkers = 5 + baseSize * 2; // base workers + 2 per building

    if (strategy === "economic") {
      targetWorkers *= 1.5;
    } else if (strategy === "aggressive") {
      targetWorkers *= 0.8;
    }

    // if we are under attack, we need less workers
    if (this.blackboard.enemiesNearBase.length > 0) {
      targetWorkers *= 0.7;
    }

    // if enemy is strong, we need more military, so less workers
    if (enemyStrength > this.blackboard.militaryStrength) {
      targetWorkers *= 0.8;
    }

    return currentWorkers < targetWorkers;
  }

  async ReassignWorkersToResource(): Promise<State> {
    const criticalResource = this.logisticsManager.getMostConstrainedResource();
    const workers = this.blackboard.workers.filter((worker) => {
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return false;
      return gathererComponent.isGathering;
    });
    if (workers.length > 0 && criticalResource) {
      let assigned = 0;
      for (const worker of workers) {
        const gathererComponent = getActorComponent(worker, GathererComponent);
        if (!gathererComponent) continue;
        const closestResourceSource = await gathererComponent.getClosestResourceSource(
          criticalResource,
          AI_CONFIG.gatherSearchRadius
        ); // replaced 100
        if (!closestResourceSource) continue;
        const aiController = getActorComponent(worker, PawnAiController);
        const newOrder = new OrderData(OrderType.Gather, { targetGameObject: closestResourceSource });
        if (aiController) {
          const result = dispatchAiOrder(this.scene, worker, newOrder, this.player.playerNumber!);
          if (result.status === "dispatched") assigned += 1;
        }
      }
      if (assigned === 0) return State.FAILED;
      this.logDebugInfo("Reassigned workers to gather the most critical resource.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  async AssignWorkersToResource(): Promise<State> {
    return this.AssignWorkersToGather();
  }

  SufficientResourcesForUpgrade() {
    const threshold = this.adaptiveThresholds.getSufficientResourcesForUpgradeThreshold();
    return this.blackboard.getTotalResources() >= threshold; // legacy placeholder
  }

  StartUpgrade() {
    if (this.purePlannerOwnsResearch) {
      this.recordDecision("startUpgrade", "failed", "pure_planner_authoritative");
      return State.FAILED;
    }
    const state = this.techManager.tryStartResearch();
    this.recordDecision(
      "startUpgrade",
      state === State.SUCCEEDED ? "succeeded" : "failed",
      state === State.SUCCEEDED ? "research_started" : "no_legal_research"
    );
    return state;
  }
}
