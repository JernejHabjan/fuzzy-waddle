import { State } from "mistreevous";
import { IPlayerControllerAgent } from "./player-ai-controller.agent.interface";
import { Agent } from "mistreevous/dist/Agent";
import { PlayerAiBlackboard } from "../../../../entity/character/ai/player-ai/player-ai-blackboard";
import { ProbableWafflePlayer, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../../../../environments/environment";
import { getSceneService } from "../../../../scenes/components/scene-component-helpers";
import { DebuggingService } from "../../../../scenes/services/DebuggingService";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../../../data/actor-component";
import { ProductionComponent } from "../../../../entity/building/production/production-component";
import { ObjectNames } from "../../../../data/object-names";
import { pwActorDefinitions } from "../../../../data/actor-definitions";
import { ScenePlayerHelpers } from "../../../../data/scene-player-helpers";
import { GathererComponent } from "../../../../entity/actor/components/gatherer-component";
import { BuilderComponent } from "../../../../entity/actor/components/builder-component";

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
    const idleWorkers = this.blackboard.workers.filter((worker) => {
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return false;
      return !gathererComponent.isGathering;
    });
    if (idleWorkers.length > 0) {
      idleWorkers.forEach((worker) => {
        const gathererComponent = getActorComponent(worker, GathererComponent);
        if (!gathererComponent) return;
        const closestResourceSource = gathererComponent.getClosestResourceSource(ResourceType.Wood, 100); // todo hardcoded
        if (!closestResourceSource) return;
        gathererComponent.startGatheringResources(closestResourceSource);
      });
      this.logDebugInfo("Assigned idle workers to gather resources.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  HasIdleTrainingBuilding() {
    // todo temp assign training buildings
    const { currentPlayerActors } = ScenePlayerHelpers.getActorsByPlayer(this.scene, this.player.playerNumber!); // TODO SHOULD BE REMOVED FROM HERE LATER
    this.blackboard.trainingBuildings = currentPlayerActors; // TODO SHOULD BE REMOVED FROM HERE LATER

    return this.blackboard.trainingBuildings.some((building) => {
      const productionComponent = getActorComponent(building, ProductionComponent);
      if (!productionComponent) return false;
      return productionComponent.isIdle;
    });
  }

  HasEnoughResourcesForWorker() {
    // todo temp assigning resources
    this.blackboard.resources = 1000; // TODO SHOULD BE REMOVED FROM HERE LATER

    return this.blackboard.resources >= this.hasEnoughResourcesForWorkerThreshold;
  }

  TrainWorker() {
    if (!this.HasEnoughResourcesForWorker()) return State.FAILED;
    this.logDebugInfo("Training a new worker...");
    const trainingBuildings = this.blackboard.trainingBuildings.filter((building) => {
      const productionComponent = getActorComponent(building, ProductionComponent);
      if (!productionComponent) return false;
      if (!productionComponent.isIdle) return false;
      // check if it can train a worker
      // todo use productionComponent.canAssignProduction
      return true;
    });
    if (trainingBuildings.length === 0) return State.FAILED;
    getActorComponent(trainingBuildings[0], ProductionComponent)!.startProduction({
      actorName: ObjectNames.SkaduweeWorkerMale, // todo,
      costData: pwActorDefinitions.TivaraWorkerMale.components!.productionCost!
    });
    return State.SUCCEEDED;
  }

  GatherResources() {
    const workers = this.blackboard.workers.filter((worker) => {
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return false;
      return gathererComponent.isGathering;
    });
    if (workers.length > 0) {
      workers.forEach((worker) => {
        const gathererComponent = getActorComponent(worker, GathererComponent);
        if (!gathererComponent) return;
        // todo gathererComponent.gather(gathererComponent.getClosestResourceSource(ResourceType.Wood, 100)!);
      });
      this.logDebugInfo("Workers are gathering resources.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  AssignWorkerToBuild() {
    const idleWorkers = this.blackboard.workers.filter((worker) => {
      const builderComponent = getActorComponent(worker, BuilderComponent);
      if (!builderComponent) return false;
      return builderComponent.isIdle();
    });
    if (idleWorkers.length > 0 && this.blackboard.selectedStructure) {
      const builderComponent = getActorComponent(idleWorkers[0], BuilderComponent);
      builderComponent?.assignToConstructionSite(this.blackboard.selectedStructure);
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

  NeedMoreWorkers(): boolean {
    // todo temp assign workers all TivaraWorkerMale from map
    this.blackboard.workers = this.scene.children.getAll("name", ObjectNames.SkaduweeWorkerMale); // TODO SHOULD BE REMOVED FROM HERE LATER

    return this.blackboard.workers.length < 5; // Example threshold
  }

  ReassignWorkersToResource() {
    const criticalResource = this.blackboard.getMostNeededResource();
    const workers = this.blackboard.workers.filter((worker) => {
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return false;
      return gathererComponent.isGathering;
    });
    if (workers.length > 0 && criticalResource) {
      workers.forEach((worker) => {
        const gathererComponent = getActorComponent(worker, GathererComponent);
        if (!gathererComponent) return;
        const closestResourceSource = gathererComponent.getClosestResourceSource(criticalResource.type, 100);
        if (!closestResourceSource) return;
        gathererComponent.startGatheringResources(closestResourceSource);
      });
      this.logDebugInfo("Reassigned workers to gather the most critical resource.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  AssignWorkersToResource() {
    const workers = this.blackboard.workers.filter((worker) => {
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return false;
      return !gathererComponent.isGathering;
    });
    if (workers.length > 0) {
      workers.forEach((worker) => {
        const gathererComponent = getActorComponent(worker, GathererComponent);
        if (!gathererComponent) return;
        const closestResourceSource = gathererComponent.getClosestResourceSource(ResourceType.Wood, 100); // todo hardcoded
        if (!closestResourceSource) return;
      });
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
      // todo this.blackboard.upgradeBuilding.startUpgrade();
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

  AssignHousingBuilding(): State {
    return State.SUCCEEDED;
  }
  AssignProductionBuilding(): State {
    return State.SUCCEEDED;
  }
  AssignDefenseBuilding(): State {
    return State.SUCCEEDED;
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

  // TODO we can use something like this to determine if the player is weak (BUT IT NEEDS TO BE EVENT-DRIVEN AND STORED IN THE BLACKBOARD OR PLAYER DIRECTLY)
  // const { currentPlayerActors, enemyActors } = ScenePlayerHelpers.getActorsByPlayer(this.scene, this.player.playerNumber!);
  // let enemyPlayersUnitsCount = 0;
  // // find enemy player with least units
  // enemyActors.forEach((actors) => {
  //   if (actors.length < enemyPlayersUnitsCount || enemyPlayersUnitsCount === 0) {
  //     enemyPlayersUnitsCount = actors.length;
  //   }
  // });
  // const currentPlayerUnitsCount = currentPlayerActors.length;
  // return enemyPlayersUnitsCount < currentPlayerUnitsCount;
  IsEnemyPlayerWeak() {
    return this.blackboard.militaryStrength < this.blackboard.enemyMilitaryStrength;
  }

  ContinueScouting() {
    this.logDebugInfo("Continuing to scout the map.");
    return State.SUCCEEDED;
  }

  ShiftToAggressiveStrategy() {
    if (this.blackboard.currentStrategy === "aggressive") return State.FAILED;
    this.blackboard.currentStrategy = "aggressive";
    this.logDebugInfo("Switched to aggressive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToDefensiveStrategy() {
    if (this.blackboard.currentStrategy === "defensive") return State.FAILED;
    this.blackboard.currentStrategy = "defensive";
    this.logDebugInfo("Switched to defensive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToEconomicStrategy() {
    if (this.blackboard.currentStrategy === "economic") return State.FAILED;
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
