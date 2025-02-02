import { State } from "mistreevous";
import { IPlayerControllerAgent } from "./player-ai-controller.agent.interface";
import { Agent } from "mistreevous/dist/Agent";
import { PlayerAiBlackboard } from "../../../../entity/character/ai/player-ai/player-ai-blackboard";
import { ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../../../../environments/environment";
import { getSceneService } from "../../../../scenes/components/scene-component-helpers";
import { DebuggingService } from "../../../../scenes/services/DebuggingService";
import { Subscription } from "rxjs";

export class PlayerAiControllerAgent implements IPlayerControllerAgent, Agent {
  private readonly baseHeavyAttackThreshold = 10; // Enemy units count for a heavy attack
  private readonly militaryPowerThreshold = 50; // Minimum military power to attack
  private readonly resourceSurplusThreshold = 500; // Surplus resources needed for expansion or upgrades
  private readonly resourceGatheringThreshold = 300; // Minimum resources needed to stop gathering
  private readonly needMoreResourcesThreshold = 200; // Threshold for needing more resources
  private readonly hasSufficientResourcesThreshold = 500; // Threshold for sufficient resources
  private readonly hasEnoughResourcesForWorkerThreshold = 100; // Threshold for training
  private readonly sufficientResourcesForUpgradeThreshold = 1000; // Threshold for upgrades
  private displayDebugInfo = false;
  private aiDebuggingSubscription?: Subscription;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly blackboard: PlayerAiBlackboard
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    if (!environment.production) {
      const aiDebuggingService = getSceneService(this.scene, DebuggingService)!;
      this.aiDebuggingSubscription = aiDebuggingService.debugChanged.subscribe((debug) => {
        this.displayDebugInfo = debug;
      });
    }
  }

  [propertyName: string]: unknown;

  IsBaseUnderAttack() {
    return this.blackboard.enemiesNearBase.length > 0;
  }

  IsBaseUnderHeavyAttack() {
    return this.blackboard.enemiesNearBase.length > this.baseHeavyAttackThreshold;
  }

  IsEnemyVisible() {
    return this.blackboard.visibleEnemies.length > 0;
  }

  HasEnoughMilitaryPower() {
    return this.blackboard.units.length >= this.militaryPowerThreshold;
  }

  HasSurplusResources() {
    return this.blackboard.resources > this.resourceSurplusThreshold;
  }

  AssignDefendersToEnemies() {
    if (this.blackboard.defendingUnits.length > 0 && this.blackboard.enemiesNearBase.length > 0) {
      this.logDebugInfo("Assigning defenders to engage nearby enemies.");
      this.blackboard.defendingUnits.forEach((unit) => unit.assignTarget(this.blackboard.enemiesNearBase[0]));
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  AttackEnemyBase() {
    if (this.HasEnoughMilitaryPower()) {
      this.logDebugInfo("Attacking enemy base with full force!");
      this.blackboard.units.forEach((unit) => unit.attack(this.blackboard.enemyBase));
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  NeedMoreResources() {
    return this.blackboard.resources < this.needMoreResourcesThreshold;
  }

  IsBaseExpansionNeeded() {
    return this.blackboard.baseSize < this.blackboard.desiredBaseSize;
  }

  HasSufficientResources() {
    return this.blackboard.resources >= this.hasSufficientResourcesThreshold;
  }

  ResourceShortage() {
    return this.blackboard.resources < this.resourceGatheringThreshold;
  }

  ChooseStructureToBuild() {
    const availableStructures = this.blackboard.availableStructures();
    if (availableStructures.length > 0) {
      this.blackboard.selectedStructure = availableStructures[0]; // Choose the first available structure
      this.logDebugInfo("Selected structure to build:", this.blackboard.selectedStructure);
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  AssignWorkersToGather() {
    const idleWorkers = this.blackboard.workers.filter((worker) => worker.isIdle());
    if (idleWorkers.length > 0) {
      idleWorkers.forEach((worker) => worker.gather(this.blackboard.closestResource()));
      this.logDebugInfo("Assigned idle workers to gather resources.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  HasIdleTrainingBuilding() {
    return this.blackboard.trainingBuildings.some((building) => building.isIdle());
  }

  HasEnoughResourcesForWorker() {
    return this.blackboard.resources >= this.hasEnoughResourcesForWorkerThreshold;
  }

  TrainWorker() {
    if (this.HasEnoughResourcesForWorker()) {
      this.logDebugInfo("Training a new worker...");
      this.blackboard.trainingBuildings[0].trainUnit("worker");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  GatherResources() {
    const workers = this.blackboard.workers.filter((worker) => worker.isGathering());
    if (workers.length > 0) {
      workers.forEach((worker) => worker.continueGathering());
      this.logDebugInfo("Workers are gathering resources.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  AssignWorkerToBuild() {
    const idleWorkers = this.blackboard.workers.filter((worker) => worker.isIdle());
    if (idleWorkers.length > 0 && this.blackboard.selectedStructure) {
      idleWorkers[0].startBuilding(this.blackboard.selectedStructure);
      this.logDebugInfo("Assigned worker to build structure.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  StartBuildingStructure() {
    const selectedStructure = this.blackboard.selectedStructure;
    if (selectedStructure && this.HasSufficientResources()) {
      selectedStructure.startConstruction();
      this.logDebugInfo("Started building:", selectedStructure.name);
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  ContinueNormalGathering() {
    this.logDebugInfo("Continuing normal gathering...");
    return State.SUCCEEDED;
  }

  ReassignWorkersToResource() {
    const criticalResource = this.blackboard.getMostNeededResource();
    const workers = this.blackboard.workers.filter((worker) => worker.isGathering());
    if (workers.length > 0 && criticalResource) {
      workers.forEach((worker) => worker.gather(criticalResource));
      this.logDebugInfo("Reassigned workers to gather the most critical resource.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  AssignWorkersToResource() {
    const resource = this.blackboard.closestResource();
    const workers = this.blackboard.workers.filter((worker) => worker.isIdle());
    if (workers.length > 0 && resource) {
      workers.forEach((worker) => worker.gather(resource));
      this.logDebugInfo("Assigned workers to gather the closest resource.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  SufficientResourcesForUpgrade() {
    return this.blackboard.resources >= this.sufficientResourcesForUpgradeThreshold;
  }

  StartUpgrade() {
    if (this.SufficientResourcesForUpgrade()) {
      this.logDebugInfo("Starting a tech or unit upgrade.");
      this.blackboard.upgradeBuilding.startUpgrade();
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  NeedMoreHousing() {
    return this.blackboard.housingCapacity <= this.blackboard.units.length + 5; // Buffer for housing
  }

  NeedMoreProduction() {
    return this.blackboard.productionBuildings.length < this.blackboard.desiredProductionBuildings;
  }

  NeedMoreDefense() {
    return this.blackboard.defensiveStructures.length < this.blackboard.desiredDefensiveStructures;
  }

  NeedToScout() {
    return !this.blackboard.mapFullyExplored && this.blackboard.units.some((unit) => unit.isScout());
  }

  AssignScoutUnits() {
    const idleScouts = this.blackboard.units.filter((unit) => unit.isScout() && unit.isIdle());
    if (idleScouts.length > 0) {
      idleScouts.forEach((scout) => scout.explore());
      this.logDebugInfo("Assigned scouts to explore.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  IsInCombat() {
    return this.blackboard.units.some((unit) => unit.isInCombat());
  }

  LowHealthUnit() {
    return this.blackboard.units.some((unit) => unit.health < 20); // Example low health threshold
  }

  RetreatUnit() {
    const lowHealthUnits = this.blackboard.units.filter((unit) => unit.health < 20); // Threshold for "low health"
    if (lowHealthUnits.length > 0) {
      lowHealthUnits.forEach((unit) => unit.retreatToSafeZone());
      this.logDebugInfo("Retreating low-health units.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  FocusFire() {
    const enemy = this.blackboard.primaryTarget;
    if (enemy) {
      this.blackboard.units.forEach((unit) => unit.attack(enemy));
      this.logDebugInfo("Focusing fire on enemy:", enemy.name);
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  FlankEnemy() {
    const enemies = this.blackboard.enemiesInCombat;
    if (enemies.length > 0 && this.EnemyFlankOpen()) {
      this.logDebugInfo("Flanking the enemy.");
      this.blackboard.units.forEach((unit) => unit.moveToFlank(enemies[0]));
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  EnemySpotted() {
    return this.blackboard.visibleEnemies.length > 0;
  }

  AnalyzeEnemyBase() {
    if (this.blackboard.enemyBase) {
      this.logDebugInfo("Analyzing enemy base for weaknesses.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  GatherEnemyData() {
    this.logDebugInfo("Gathering enemy intelligence.");
    return State.SUCCEEDED;
  }

  EnemyInRange() {
    return this.blackboard.units.some((unit) => unit.enemyInRange());
  }

  EnemyFlankOpen() {
    return this.blackboard.enemyFlankOpen;
  }

  DecideNextMoveBasedOnAnalysis() {
    this.logDebugInfo("Deciding next move based on enemy analysis.");
    return State.SUCCEEDED;
  }

  IsPlayerWeak() {
    return this.blackboard.militaryStrength < this.blackboard.enemyMilitaryStrength;
  }

  ContinueScouting() {
    this.logDebugInfo("Continuing to scout the map.");
    return State.SUCCEEDED;
  }

  ShiftToAggressiveStrategy() {
    this.blackboard.currentStrategy = "aggressive";
    this.logDebugInfo("Switched to aggressive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToDefensiveStrategy() {
    this.blackboard.currentStrategy = "defensive";
    this.logDebugInfo("Switched to defensive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToEconomicStrategy() {
    this.blackboard.currentStrategy = "economic";
    this.logDebugInfo("Switched to economic strategy.");
    return State.SUCCEEDED;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logDebugInfo(message?: any, ...optionalParams: any[]) {
    if (!this.displayDebugInfo) return;
    console.log(message, ...optionalParams);
  }

  private onShutdown() {
    this.aiDebuggingSubscription?.unsubscribe();
  }
}
