import { State } from "mistreevous";
import { IPlayerControllerAgent } from "./player-ai-controller.agent.interface";
import { Agent } from "mistreevous/dist/Agent";
import { PlayerAiBlackboard } from "../../../../entity/character/ai/player-ai/player-ai-blackboard";
import { ObjectNames, ProbableWafflePlayer, ResourceType, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../../../../environments/environment";
import { getSceneService } from "../../../components/scene-component-helpers";
import { DebuggingService } from "../../../services/DebuggingService";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../../../data/actor-component";
import { ProductionComponent } from "../../../../entity/building/production/production-component";
import { pwActorDefinitions } from "../../../../data/actor-definitions";
import { ScenePlayerHelpers } from "../../../../data/scene-player-helpers";
import { GathererComponent } from "../../../../entity/actor/components/gatherer-component";
import { BuilderComponent } from "../../../../entity/actor/components/builder-component";
import { PawnAiController } from "../player-pawn-ai-controller/pawn-ai-controller";
import { OrderData } from "../../../../entity/character/ai/OrderData";
import { OrderType } from "../../../../entity/character/ai/order-type";
import { BuildingCursor } from "../building-cursor";
import { getGameObjectLogicalTransform } from "../../../../data/game-object-helper";
import { GameplayLibrary } from "../../../../library/gameplay-library";
import GameObject = Phaser.GameObjects.GameObject;
import { MapAnalyzer } from "../../../../entity/character/ai/player-ai/map-analyzer";
import { BasePlanner } from "../../../../entity/character/ai/player-ai/base-planner";

export class PlayerAiControllerAgent implements IPlayerControllerAgent, Agent {
  private readonly baseHeavyAttackThreshold = 10; // Enemy units count for a heavy attack
  private readonly militaryPowerThreshold = 3; // Minimum military power to attack
  private readonly resourceSurplusThreshold = 500; // Surplus resources needed for expansion or upgrades
  private readonly resourceGatheringThreshold = 300; // Minimum resources needed to stop gathering
  private readonly needMoreResourcesThreshold = 5000; // Threshold for needing more resources
  private readonly hasSufficientResourcesThreshold = 500; // Threshold for sufficient resources
  private readonly hasEnoughResourcesForWorkerThreshold = 100; // Threshold for training
  private readonly sufficientResourcesForUpgradeThreshold = 1000; // Threshold for upgrades
  private displayDebugInfo = false;
  private aiDebuggingSubscription?: Subscription;
  private mapAnalyzer?: MapAnalyzer;
  private basePlanner: BasePlanner;
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
    this.mapAnalyzer = new MapAnalyzer(this.scene, this.player.playerNumber!);
    this.basePlanner = new BasePlanner(this.mapAnalyzer);
  }

  [propertyName: string]: unknown;

  AnalyzeGameMap(): State {
    try {
      if (!this.mapAnalyzer) this.mapAnalyzer = new MapAnalyzer(this.scene, this.player.playerNumber!);
      const result = this.mapAnalyzer.analyzeIfStale(2000);
      this.blackboard.mapAnalysis = result;
      this.blackboard.baseCenterTile = result.baseCenterTile ?? null;
      this.blackboard.suggestedBuildTiles = result.candidateBuildSpots ?? [];
      return State.SUCCEEDED;
    } catch {
      return State.FAILED;
    }
  }

  IsBaseUnderAttack() {
    return this.blackboard.enemiesNearBase.length > 0;
  }

  IsBaseUnderHeavyAttack() {
    return this.blackboard.enemiesNearBase.length > this.baseHeavyAttackThreshold;
  }

  HasEnoughMilitaryPower() {
    // todo temp assign units all SkaduweeWarriorMale from map
    this.blackboard.units = this.scene.children.getAll("name", ObjectNames.SkaduweeWarriorMale); // TODO SHOULD BE REMOVED FROM HERE LATER

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
    // todo temp assign enemyBase
    const { actorsByEnemy } = ScenePlayerHelpers.getActorsByPlayer(this.scene, this.player.playerNumber!); // TODO SHOULD BE REMOVED FROM HERE LATER

    if (!this.HasEnoughMilitaryPower()) {
      return State.FAILED;
    }
    this.logDebugInfo("Attacking enemy base with full force!");
    this.blackboard.units.forEach((unit) => {
      const aiController = getActorComponent(unit, PawnAiController);
      if (!aiController) return;
      if (aiController.blackboard.getCurrentOrder()) return; // currently busy

      // find the closest enemy actor
      let closestEnemy = null;
      let closestDistance = Infinity;
      actorsByEnemy.forEach((actors: GameObject[]) => {
        actors.forEach((actor: GameObject) => {
          const distance = GameplayLibrary.getTileDistanceBetweenGameObjects(unit, actor);
          if (distance !== null && distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = actor;
          }
        });
      });
      if (!closestEnemy) return;

      const newOrder = new OrderData(OrderType.Attack, { targetGameObject: closestEnemy });
      aiController.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
      aiController.blackboard.setCurrentOrder(newOrder);
    });
    return State.SUCCEEDED;
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
    // todo temp assign workers all TivaraWorkerMale from map
    this.blackboard.workers = this.scene.children.getAll("name", ObjectNames.SkaduweeWorkerMale); // TODO SHOULD BE REMOVED FROM HERE LATER

    let anyAssigned = false;
    this.blackboard.workers.forEach((worker) => {
      const aiController = getActorComponent(worker, PawnAiController);
      if (!aiController) return;
      if (aiController.blackboard.getCurrentOrder()) return; // currently busy
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return;
      const closestResourceSource = gathererComponent.getClosestResourceSource(ResourceType.Wood, 100); // todo hardcoded
      if (!closestResourceSource) return;
      const newOrder = new OrderData(OrderType.Gather, { targetGameObject: closestResourceSource });
      aiController.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
      aiController.blackboard.setCurrentOrder(newOrder);
      anyAssigned = true;
    });
    if (anyAssigned) {
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
      // this.logDebugInfo("Starting a tech or unit upgrade.");
      // todo this.blackboard.upgradeBuilding.startUpgrade();
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  NeedMoreHousing() {
    // return random with 10% chance
    return Math.random() < 0.1;

    return this.blackboard.housingCapacity <= this.blackboard.units.length + 5; // Buffer for housing
  }

  NeedMoreProduction() {
    // return random with 10% chance
    return Math.random() < 0.1;

    return this.blackboard.productionBuildings.length < this.blackboard.desiredProductionBuildings;
  }

  NeedMoreDefense() {
    // return random with 10% chance
    return Math.random() < 0.1;

    return this.blackboard.defensiveStructures.length < this.blackboard.desiredDefensiveStructures;
  }

  private assignBuilding(buildingType: ObjectNames): State {
    // todo temp assign workers all TivaraWorkerMale from map
    this.blackboard.workers = this.scene.children.getAll("name", ObjectNames.SkaduweeWorkerMale); // TODO SHOULD BE REMOVED FROM HERE LATER

    const validWorkers = this.blackboard.workers.filter((worker) => {
      const aiController = getActorComponent(worker, PawnAiController);
      if (!aiController) return false;
      // do not check if busy - override current order
      // if (aiController.blackboard.getCurrentOrder()) return false; // currently busy
      const builderComponent = getActorComponent(worker, BuilderComponent);
      if (!builderComponent) return false;
      return builderComponent.isIdle();
    });

    if (validWorkers.length === 0) return State.FAILED;

    // spawn building:
    // get random location - get point next to worker
    const worker = this.blackboard.workers[0];
    const transform = getGameObjectLogicalTransform(worker);
    const randomX = transform!.x + Math.floor(Math.random() * 10) - 10;
    const randomY = transform!.y + Math.floor(Math.random() * 10) - 10;
    const location = {
      x: randomX,
      y: randomY,
      z: 0
    } satisfies Vector3Simple;

    const building = BuildingCursor.spawnBuildingForPlayer(
      this.scene,
      buildingType,
      location,
      this.player.playerNumber
    );

    validWorkers.forEach((w) => {
      const aiController = getActorComponent(w, PawnAiController);
      const newOrder = new OrderData(OrderType.Build, { targetGameObject: building });
      aiController!.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
      aiController!.blackboard.setCurrentOrder(newOrder);
    });

    this.logDebugInfo("Assigned workers to build a new building.");
    return State.SUCCEEDED;
  }

  AssignHousingBuilding(): State {
    return this.assignBuilding(ObjectNames.WorkMill);
  }

  AssignProductionBuilding(): State {
    return this.assignBuilding(ObjectNames.Owlery);
  }

  AssignDefenseBuilding(): State {
    return this.assignBuilding(ObjectNames.InfantryInn);
  }

  NeedToScout() {
    return false; // todo
    // return !this.blackboard.mapFullyExplored && this.blackboard.units.some((unit) => unit.isScout());
  }

  AssignScoutUnits() {
    // const idleScouts = this.blackboard.units.filter((unit) => unit.isScout() && unit.isIdle());
    // if (idleScouts.length > 0) {
    //   idleScouts.forEach((scout) => scout.explore());
    //   this.logDebugInfo("Assigned scouts to explore.");
    //   return State.SUCCEEDED;
    // }
    return State.FAILED;
  }

  IsInCombat() {
    // return this.blackboard.units.some((unit) => unit.isInCombat());
    return false; // todo
  }

  LowHealthUnit(): boolean {
    // todo return this.blackboard.units.some((unit) => unit.health < 20); // Example low health threshold
    return false;
  }

  RetreatUnit() {
    // todo const lowHealthUnits = this.blackboard.units.filter((unit) => unit.health < 20); // Threshold for "low health"
    // todo if (lowHealthUnits.length > 0) {
    // todo   lowHealthUnits.forEach((unit) => unit.retreatToSafeZone());
    // todo   this.logDebugInfo("Retreating low-health units.");
    // todo   return State.SUCCEEDED;
    // todo }
    return State.FAILED;
  }

  FocusFire() {
    const enemy = this.blackboard.primaryTarget;
    // todo if (enemy) {
    // todo   this.blackboard.units.forEach((unit) => unit.attack(enemy));
    // todo   this.logDebugInfo("Focusing fire on enemy:", enemy.name);
    // todo   return State.SUCCEEDED;
    // todo }
    return State.FAILED;
  }

  FlankEnemy() {
    const enemies = this.blackboard.enemiesInCombat;
    // todo if (enemies.length > 0 && this.EnemyFlankOpen()) {
    // todo   this.logDebugInfo("Flanking the enemy.");
    // todo   this.blackboard.units.forEach((unit) => unit.moveToFlank(enemies[0]));
    // todo   return State.SUCCEEDED;
    // todo }
    return State.FAILED;
  }

  EnemySpotted(): boolean {
    return this.blackboard.visibleEnemies.length > 0;
  }

  AnalyzeEnemyBase(): State {
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

  EnemyInRange(): boolean {
    // todo return this.blackboard.units.some((unit) => unit.enemyInRange());
    return false;
  }

  EnemyFlankOpen(): boolean {
    return this.blackboard.enemyFlankOpen;
  }

  DecideNextMoveBasedOnAnalysis(): State {
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
