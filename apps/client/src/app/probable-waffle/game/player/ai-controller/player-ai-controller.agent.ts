import { State } from "mistreevous";
import { type IPlayerControllerAgent } from "./player-ai-controller.agent.interface";
import { PlayerAiBlackboard } from "./player-ai-blackboard";
import {
  FactionType,
  ObjectNames,
  ProbableWafflePlayer,
  ResourceType,
  type Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../../environments/environment";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { DebuggingService } from "../../world/services/DebuggingService";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../data/actor-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { pwActorDefinitions } from "../../prefabs/definitions/actor-definitions";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { BuildingCursor } from "../human-controller/building-cursor";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { DistanceHelper } from "../../library/distance-helper";
import { MapAnalyzer } from "./ai-behavior/map-analyzer";
import { BasePlanner } from "./ai-behavior/base-planner";
import { CooldownManager } from "./cooldown-manager";
import { makeHysteresisTracker } from "./hysteresis-threshold";
import { ForceMaintenanceManager } from "./ai-behavior/force-maintenance-manager";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { ProductionValidator } from "../../data/tech-tree/production-validator";
import { getCostForObjectName } from "../../entity/components/production/cost-utils";
import { AI_CONFIG } from "./ai-config";
import { RepairManager } from "./ai-behavior/repair-manager";
import { LogisticsManager } from "./ai-behavior/logistics-manager";
import { TechProgressManager } from "./ai-behavior/tech-progress-manager";
import { AdaptiveThresholdManager } from "./ai-behavior/adaptive-threshold-manager";
import { CombatMicroManager } from "./ai-behavior/combat-micro-manager";
import { ScoutingManager } from "./ai-behavior/scouting-manager";
import { TargetingManager } from "./ai-behavior/targeting-manager";
import { SupplyPlanner } from "./ai-behavior/supply-planner";
import GameObject = Phaser.GameObjects.GameObject;

export class PlayerAiControllerAgent implements IPlayerControllerAgent {
  private displayDebugInfo = false;
  private aiDebuggingSubscription?: Subscription;
  private mapAnalyzer?: MapAnalyzer;
  private basePlanner: BasePlanner;
  private cooldowns = new CooldownManager();
  private hysteresisAggressive = makeHysteresisTracker({
    enter: AI_CONFIG.hysteresisAggressiveEnter,
    exit: AI_CONFIG.hysteresisAggressiveExit
  });
  private forceMaintenance?: ForceMaintenanceManager;
  private repairManager?: RepairManager;
  private logisticsManager?: LogisticsManager;
  private techManager?: TechProgressManager;
  private adaptiveThresholds?: AdaptiveThresholdManager;

  private combatMicro?: CombatMicroManager;
  private scoutingManager?: ScoutingManager;
  private targetingManager?: TargetingManager;
  private supplyPlanner?: SupplyPlanner;
  productionValidator?: ProductionValidator;

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
    this.cooldowns.configure("strategyShift", AI_CONFIG.strategyShiftIntervalMs);
    this.cooldowns.configure("analyzeMap", AI_CONFIG.mapAnalysisIntervalMs);
    this.cooldowns.configure("attackTrigger", AI_CONFIG.attackTriggerIntervalMs);
    this.productionValidator = new ProductionValidator(this.scene, this.player, this.blackboard);
    this.forceMaintenance = new ForceMaintenanceManager(
      this.scene,
      this.player,
      this.blackboard,
      this.logDebugInfo.bind(this),
      this.productionValidator
    );
    this.repairManager = new RepairManager(
      this.scene,
      this.player.playerNumber!,
      this.blackboard,
      this.logDebugInfo.bind(this)
    );
    this.logisticsManager = new LogisticsManager(this.blackboard, this.logDebugInfo.bind(this));
    this.techManager = new TechProgressManager(this.blackboard, this.logDebugInfo.bind(this));
    this.adaptiveThresholds = new AdaptiveThresholdManager(this.blackboard, this.basePlanner);
    this.combatMicro = new CombatMicroManager(this.scene, this.blackboard, this.logDebugInfo.bind(this));
    this.scoutingManager = new ScoutingManager(this.scene, this.blackboard, this.logDebugInfo.bind(this));
    this.targetingManager = new TargetingManager(this.blackboard);
    this.supplyPlanner = new SupplyPlanner(this.blackboard);
  }

  /** Pre-tick lifecycle hook called by controller before behaviour tree step. */
  preTick(now: number) {
    this.updateManagers(now);
  }

  private updateManagers(now: number) {
    // Refresh unit / production snapshots via ActorIndexSystem (replaces UnitDiscoveryManager)
    this.refreshOwnedActors(now);
    // Update scouting vision sampling
    this.scoutingManager?.updateVisionSampling(now);
    // Update primary target cache
    this.targetingManager?.update(now);
    // Assess supply & proactively plan housing if needed
    const supply = this.supplyPlanner?.assess(now);
    if (supply && supply.urgency !== "none") {
      const hasPlannedHousing = this.blackboard.production.plannedStructures.some(
        (p) => p.name === ObjectNames.WorkMill
      );
      if (!hasPlannedHousing) {
        const dynCost = getCostForObjectName(ObjectNames.WorkMill) || { wood: AI_CONFIG.defaultWorkMillWoodCost };
        this.blackboard.beginPlannedStructure(ObjectNames.WorkMill, dynCost, now); // dynamic cost
      }
    }
    this.processPrerequisiteQueue(now);
  }

  private processPrerequisiteQueue(now: number) {
    const queue = this.blackboard.production.prereqQueue;
    if (!queue || queue.length === 0) return;
    const next = queue[0];
    if (!next) return;
    // Heuristic: attempt construct via assignBuilding if building definition exists; else attempt production.
    const isBuilding = pwActorDefinitions[next.objectName]?.components?.production; // buildings have production component usually
    if (next.type === "construct" && isBuilding) {
      const state = this.assignBuilding(next.objectName as ObjectNames);
      if (state === State.SUCCEEDED) queue.shift();
      return;
    }
    if (next.type === "produce" || !isBuilding) {
      // Attempt to queue production in any idle training building
      const prodBuilding = this.blackboard.trainingBuildings.find((b) => {
        const prod = getActorComponent(b, ProductionComponent);
        return prod?.isIdle;
      });
      if (prodBuilding) {
        const prod = getActorComponent(prodBuilding, ProductionComponent);
        const def = pwActorDefinitions[next.objectName as ObjectNames];
        const costData = def?.components?.productionCost;
        if (prod && costData) {
          const validation = this.productionValidator?.validate(next.objectName as ObjectNames);
          if (validation && !validation.canQueue) {
            // If still blocked (e.g., nested prereqs) schedule them (avoid infinite loop by checking difference)
            if (validation.techBlocked && validation.prereqs.length > 0) {
              this.productionValidator?.schedulePrerequisites(validation.prereqs, next.objectName as ObjectNames);
            }
            return;
          }
          prod.startProduction({ actorName: next.objectName as ObjectNames, costData });
          queue.shift();
        }
      }
    }
  }

  private ownedScanInitialized = false;
  private lastOwnedRefreshAt = 0;
  private readonly ownedRefreshIntervalMs = AI_CONFIG.ownedRefreshIntervalMs;
  private refreshOwnedActors(now: number) {
    if (now - this.lastOwnedRefreshAt < this.ownedRefreshIntervalMs) return;
    const index = getSceneService(this.scene, ActorIndexSystem);
    if (!index) return;
    if (!this.ownedScanInitialized) {
      index.scanExistingActors();
      this.ownedScanInitialized = true;
    }
    const owned = index.getOwnedActors(this.player.playerNumber);
    const workers: GameObject[] = [];
    const units: GameObject[] = [];
    const production: GameObject[] = [];

    owned.forEach((go) => {
      const gatherer = getActorComponent(go, GathererComponent);
      const prod = getActorComponent(go, ProductionComponent);
      const attack = getActorComponent(go, AttackComponent);
      if (gatherer) workers.push(go);
      if (prod) production.push(go);
      if (attack && !gatherer) units.push(go);
    });

    this.blackboard.workers = workers;
    this.blackboard.productionBuildings = production;
    this.blackboard.trainingBuildings = production;
    this.blackboard.units = units;

    // Supply estimate
    this.blackboard.production.supply.used = units.length + workers.length;
    let queued = 0;
    production.forEach((b) => {
      const prod = getActorComponent(b, ProductionComponent);
      if (prod) queued += prod.itemsFromAllQueues.length;
    });
    this.blackboard.production.supply.pendingFromQueued = queued;

    // Derive enemy visibility & defense assignment
    const enemyCandidates: GameObject[] = [];
    const ownedSet = new Set(owned);
    const allActors = index.getAllIdActors();
    const baseCenter = this.blackboard.baseCenterTile;
    allActors.forEach((obj) => {
      if (ownedSet.has(obj)) return;
      const attack = getActorComponent(obj, AttackComponent); // treat only combative as visible candidate
      if (!attack) return;
      // Basic visibility heuristic: distance to any unit or base center < visionRadius
      const visionRadius = AI_CONFIG.enemyVisionRadiusTiles;
      let visible = false;
      if (baseCenter) {
        const anyObj: any = obj.body || obj;
        if (anyObj?.x != null) {
          const dx = anyObj.x - baseCenter.x;
          const dy = anyObj.y - baseCenter.y;
          if (dx * dx + dy * dy <= visionRadius * visionRadius) visible = true;
        }
      }
      if (!visible) {
        for (const u of units) {
          const d = DistanceHelper.getTileDistanceBetweenGameObjects(u, obj);
          if (d !== null && d <= visionRadius) {
            visible = true;
            break;
          }
        }
      }
      if (visible) enemyCandidates.push(obj);
    });

    // Update blackboard enemy-related fields
    this.blackboard.visibleEnemies = enemyCandidates;
    if (baseCenter) {
      const near: GameObject[] = [];
      enemyCandidates.forEach((e) => {
        const d = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(e, baseCenter);
        if (d !== null && d <= AI_CONFIG.enemyNearBaseRadiusTiles) near.push(e);
      });
      this.blackboard.enemiesNearBase = near;
    } else {
      this.blackboard.enemiesNearBase = enemyCandidates.slice(0, AI_CONFIG.fallbackVisibleEnemyLimit);
    }

    // Choose defending units: subset of friendly units near base center (or first few)
    const defenders: GameObject[] = [];
    if (baseCenter) {
      units.forEach((u) => {
        const d = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(u, baseCenter);
        if (d !== null && d <= AI_CONFIG.defenderAssignmentRadiusTiles) defenders.push(u);
      });
    }
    if (defenders.length === 0) defenders.push(...units.slice(0, AI_CONFIG.defenderFallbackMaxCount));
    this.blackboard.defendingUnits = defenders;

    this.lastOwnedRefreshAt = now;
  }

  // needed only when passing this agent to BehaviourTree constructor
  [propertyName: string]: unknown;

  AnalyzeGameMap(): State {
    // Cooldown gating: avoid excessive map analyses.
    const now = performance.now();
    if (!this.cooldowns.canRun("analyzeMap", now)) return State.FAILED;
    try {
      if (!this.mapAnalyzer) this.mapAnalyzer = new MapAnalyzer(this.scene, this.player.playerNumber!);
      const result = this.mapAnalyzer.analyzeIfStale(AI_CONFIG.mapAnalysisIntervalMs);
      this.blackboard.mapAnalysis = result;
      this.blackboard.baseCenterTile = result.baseCenterTile ?? null;
      this.blackboard.suggestedBuildTiles = result.candidateBuildSpots ?? [];
      this.cooldowns.markRun("analyzeMap", now);
      this.blackboard.cooldowns.analyzeMap = now; // mirror timestamp for other systems
      return State.SUCCEEDED;
    } catch {
      return State.FAILED;
    }
  }

  IsBaseUnderAttack() {
    return this.blackboard.enemiesNearBase.length > 0;
  }

  IsBaseUnderHeavyAttack() {
    return (
      this.blackboard.enemiesNearBase.length >
      (this.adaptiveThresholds?.getBaseHeavyAttackThreshold() ?? AI_CONFIG.baseHeavyAttackDefaultThreshold)
    ); // extracted fallback 10
  }

  HasEnoughMilitaryPower() {
    // Unit discovery manager keeps units list current; no temp reassignment
    return (
      this.blackboard.units.length >=
      (this.adaptiveThresholds?.getMilitaryPowerThreshold() ?? AI_CONFIG.militaryPowerDefaultThreshold)
    ); // extracted fallback 3
  }

  HasSurplusResources() {
    return (
      this.blackboard.getTotalResources() >
      (this.adaptiveThresholds?.getResourceSurplusThreshold() ?? AI_CONFIG.resourceSurplusDefaultThreshold)
    ); // extracted fallback 500
  }

  AssignDefendersToEnemies() {
    if (this.blackboard.defendingUnits.length > 0 && this.blackboard.enemiesNearBase.length > 0) {
      this.logDebugInfo("Assigning defenders to engage nearby enemies.");
      this.blackboard.defendingUnits.forEach((unit) => {
        const aiController = getActorComponent(unit, PawnAiController);
        if (!aiController) return;
        if (aiController.blackboard.getCurrentOrder()) return; // currently busy
        // Target closest enemy near base
        let closestEnemy: GameObject | null = null;
        let closestDist = Infinity;
        this.blackboard.enemiesNearBase.forEach((enemy) => {
          const d = DistanceHelper.getTileDistanceBetweenGameObjects(unit, enemy);
          if (d !== null && d < closestDist) {
            closestDist = d;
            closestEnemy = enemy;
          }
        });
        if (!closestEnemy) return;
        const newOrder = new OrderData(OrderType.Attack, { targetGameObject: closestEnemy });
        aiController.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
        aiController.blackboard.setCurrentOrder(newOrder);
      });
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  AttackEnemyBase() {
    const now = performance.now();
    if (!this.cooldowns.canRun("attackTrigger", now)) return State.FAILED;
    if (!this.HasEnoughMilitaryPower()) return State.FAILED;
    // Ensure target updated
    this.targetingManager?.update(now);
    const target = this.blackboard.primaryTarget;
    if (!target) return State.FAILED;
    this.logDebugInfo("Coordinated attack on primary target.");
    this.blackboard.units.forEach((unit) => {
      const aiController = getActorComponent(unit, PawnAiController);
      if (!aiController) return;
      if (aiController.blackboard.getCurrentOrder()) return;
      const newOrder = new OrderData(OrderType.Attack, { targetGameObject: target });
      aiController.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
      aiController.blackboard.setCurrentOrder(newOrder);
    });
    this.cooldowns.markRun("attackTrigger", now);
    this.blackboard.cooldowns.attackTrigger = now;
    return State.SUCCEEDED;
  }

  NeedMoreResources() {
    return (
      this.blackboard.getTotalResources() <
      (this.adaptiveThresholds?.getNeedMoreResourcesThreshold() ?? AI_CONFIG.needMoreResourcesThreshold)
    ); // extracted fallback 5000
  }

  IsBaseExpansionNeeded() {
    return this.blackboard.baseSize < this.blackboard.desiredBaseSize;
  }

  HasSufficientResources() {
    return (
      this.blackboard.getTotalResources() >=
      (this.adaptiveThresholds?.getHasSufficientResourcesThreshold() ?? AI_CONFIG.hasSufficientResourcesThreshold)
    ); // extracted fallback 500
  }

  ResourceShortage() {
    return (
      this.blackboard.getTotalResources() <
      (this.adaptiveThresholds?.getResourceGatheringThreshold() ?? AI_CONFIG.resourceShortageThreshold)
    ); // extracted fallback 300
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
        const closestResourceSource = gathererComponent.getClosestResourceSource(
          ResourceType.Wood,
          AI_CONFIG.gatherSearchRadius
        ); // todo hardcoded replaced 100
        if (!closestResourceSource) return;
        gathererComponent.startGatheringResources(closestResourceSource);
      });
      this.logDebugInfo("Assigned idle workers to gather resources.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  HasIdleTrainingBuilding() {
    return this.blackboard.trainingBuildings.some((building) => {
      const productionComponent = getActorComponent(building, ProductionComponent);
      return productionComponent?.isIdle;
    });
  }

  HasEnoughResourcesForWorker() {
    // Evaluate against adaptive threshold (no longer spoofing resources)
    const threshold =
      this.adaptiveThresholds?.getHasEnoughResourcesForWorkerThreshold() ??
      AI_CONFIG.hasEnoughResourcesForWorkerThreshold; // extracted fallback 100
    return this.blackboard.getTotalResources() >= threshold;
  }

  TrainWorker() {
    if (!this.HasEnoughResourcesForWorker()) return State.FAILED;
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
        return State.FAILED; // Unsupported faction
    }
    if (this.productionValidator) {
      const validation = this.productionValidator.validate(workerName);
      if (!validation.canQueue) {
        if (validation.techBlocked && validation.prereqs.length > 0) {
          this.productionValidator.schedulePrerequisites(validation.prereqs, workerName);
        }
        return State.FAILED;
      }
    }
    this.logDebugInfo("Training a new worker...");
    const trainingBuildings = this.blackboard.trainingBuildings.filter((building) => {
      const productionComponent = getActorComponent(building, ProductionComponent);
      if (!productionComponent) return false;
      return productionComponent.isIdle;
    });
    if (trainingBuildings.length === 0) return State.FAILED;
    const prodComp = getActorComponent(trainingBuildings[0]!, ProductionComponent)!;
    // Dynamic cost sourcing
    const def = pwActorDefinitions[workerName];
    const costData = def?.components?.productionCost;
    if (!costData) return State.FAILED;
    prodComp.startProduction({
      actorName: workerName,
      costData
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
      const builderComponent = getActorComponent(idleWorkers[0]!, BuilderComponent);
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
    return this.blackboard.workers.length < AI_CONFIG.needMoreWorkersThreshold; // extracted fallback 5
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
        const closestResourceSource = gathererComponent.getClosestResourceSource(
          criticalResource.type,
          AI_CONFIG.gatherSearchRadius
        ); // replaced 100
        if (!closestResourceSource) return;
        gathererComponent.startGatheringResources(closestResourceSource);
      });
      this.logDebugInfo("Reassigned workers to gather the most critical resource.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  AssignWorkersToResource() {
    let anyAssigned = false;
    this.blackboard.workers.forEach((worker) => {
      const aiController = getActorComponent(worker, PawnAiController);
      if (!aiController) return;
      if (aiController.blackboard.getCurrentOrder()) return; // currently busy
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return;
      const closestResourceSource = gathererComponent.getClosestResourceSource(
        ResourceType.Wood,
        AI_CONFIG.gatherSearchRadius
      ); // TODO resource targeting logic (replaced 100)
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
    const threshold =
      this.adaptiveThresholds?.getSufficientResourcesForUpgradeThreshold() ??
      AI_CONFIG.sufficientResourcesForUpgradeThreshold; // extracted fallback 1000
    return this.blackboard.getTotalResources() >= threshold; // legacy placeholder
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
    return this.blackboard.housingCapacity <= this.blackboard.units.length + AI_CONFIG.housingBuffer; // extracted +3 buffer
  }

  NeedMoreProduction() {
    return this.blackboard.productionBuildings.length < this.blackboard.desiredProductionBuildings;
  }

  NeedMoreDefense() {
    return this.blackboard.defensiveStructures.length < this.blackboard.desiredDefensiveStructures;
  }

  private assignBuilding(buildingType: ObjectNames): State {
    // Improved placement: radial search around baseCenter for free tile
    const baseCenter = this.blackboard.baseCenterTile;
    let location: Vector3Simple | null = null;
    const index = getSceneService(this.scene, ActorIndexSystem);
    if (baseCenter && index) {
      const maxRadius = AI_CONFIG.buildingPlacementSearchMaxRadius;
      outer: for (
        let r = AI_CONFIG.buildingPlacementSearchStartRadius;
        r <= maxRadius;
        r += AI_CONFIG.buildingPlacementSearchIncrement
      ) {
        // start 2 increment 2
        for (let dx = -r; dx <= r; dx += AI_CONFIG.buildingPlacementSearchStep) {
          // step 2
          for (let dy = -r; dy <= r; dy += AI_CONFIG.buildingPlacementSearchStep) {
            // step 2
            const tile = { x: baseCenter.x + dx, y: baseCenter.y + dy };
            if (index.isTileFree(tile)) {
              location = { x: tile.x, y: tile.y, z: 0 } as Vector3Simple;
              break outer;
            }
          }
        }
      }
    }
    if (!location) {
      // Fallback random near first worker if no free tile found
      const worker = this.blackboard.workers[0];
      if (!worker) return State.FAILED;
      const transform = getGameObjectLogicalTransform(worker);
      const rx =
        transform!.x +
        Math.floor(Math.random() * AI_CONFIG.buildingPlacementRandomOffsetRange) -
        AI_CONFIG.buildingPlacementRandomOffsetRange; // replaced *10 -10
      const ry =
        transform!.y +
        Math.floor(Math.random() * AI_CONFIG.buildingPlacementRandomOffsetRange) -
        AI_CONFIG.buildingPlacementRandomOffsetRange; // replaced *10 -10
      location = { x: rx, y: ry, z: 0 } as Vector3Simple;
    }

    const validWorkers = this.blackboard.workers.filter((worker) => {
      const aiController = getActorComponent(worker, PawnAiController);
      if (!aiController) return false;
      const builderComponent = getActorComponent(worker, BuilderComponent);
      return !!builderComponent && builderComponent.isIdle();
    });
    if (validWorkers.length === 0) return State.FAILED;

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
    return this.scoutingManager?.needToScout() ?? false;
  }

  AssignScoutUnits() {
    if (this.scoutingManager?.assignScoutUnits()) return State.SUCCEEDED;
    return State.FAILED;
  }

  IsInCombat() {
    return this.combatMicro?.isInCombat() ?? false;
  }

  LowHealthUnit(): boolean {
    return this.combatMicro?.hasLowHealthUnit() ?? false;
  }

  RetreatUnit() {
    if (this.combatMicro?.retreatLowHealthUnits()) return State.SUCCEEDED;
    return State.FAILED;
  }

  FocusFire() {
    if (this.combatMicro?.focusFire()) return State.SUCCEEDED;
    return State.FAILED;
  }

  FlankEnemy() {
    if (this.combatMicro?.flankEnemy()) return State.SUCCEEDED;
    return State.FAILED;
  }

  EnemyInRange(): boolean {
    return this.combatMicro?.enemyInRange() ?? false;
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
  //   if (actors.length < enemyPlayersUnitsCount  enemyPlayersUnitsCount === 0) {
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
    const now = performance.now();
    if (!this.cooldowns.canRun("strategyShift", now)) return State.FAILED; // cooldown gate
    if (this.blackboard.isStrategyLocked(now)) return State.FAILED; // lock gate fixed
    const hysteresis = this.hysteresisAggressive(this.blackboard.getAttackPowerRatio());
    if (!hysteresis.entered) return State.FAILED; // require sustained superiority
    this.blackboard.lockStrategy("aggressive", now, AI_CONFIG.strategyLockMs);
    this.cooldowns.markRun("strategyShift", now);
    this.blackboard.currentStrategy = "aggressive"; // legacy field maintained
    this.logDebugInfo("Switched to aggressive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToDefensiveStrategy() {
    if (this.blackboard.currentStrategy === "defensive") return State.FAILED;
    const now = performance.now();
    if (!this.cooldowns.canRun("strategyShift", now)) return State.FAILED;
    if (this.blackboard.isStrategyLocked(now)) return State.FAILED;
    this.blackboard.lockStrategy("defensive", now, AI_CONFIG.strategyLockMs);
    this.cooldowns.markRun("strategyShift", now);
    this.blackboard.currentStrategy = "defensive"; // legacy field maintained
    this.logDebugInfo("Switched to defensive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToEconomicStrategy() {
    if (this.blackboard.currentStrategy === "economic") return State.FAILED;
    const now = performance.now();
    if (!this.cooldowns.canRun("strategyShift", now)) return State.FAILED;
    if (this.blackboard.isStrategyLocked(now)) return State.FAILED;
    this.blackboard.lockStrategy("economic", now, AI_CONFIG.strategyLockMs);
    this.cooldowns.markRun("strategyShift", now);
    this.blackboard.currentStrategy = "economic"; // legacy field maintained
    this.logDebugInfo("Switched to economic strategy.");
    return State.SUCCEEDED;
  }

  // ================= MDSL Wrapper Methods (delegating to managers / helpers) =================
  // Add logistics & tech + micro wrappers not previously present.
  ShouldRebalanceHarvesters(): boolean {
    return this.logisticsManager?.shouldRebalance() ?? false;
  }
  RebalanceHarvesterAllocation(): State {
    return this.logisticsManager?.rebalanceHarvesters() ?? State.FAILED;
  }
  StockpileImbalanceDetected(): boolean {
    return this.logisticsManager?.stockpileImbalanceDetected() ?? false;
  }
  RedirectWorkersToScarceResource(): State {
    return this.logisticsManager?.redirectToScarce() ?? State.FAILED;
  }
  ShouldPursueNextTech(): boolean {
    return this.techManager?.shouldPursueNext() ?? false;
  }
  HaveIdleUpgradeBuilding(): boolean {
    return this.techManager?.haveIdleUpgradeBuilding() ?? false;
  }
  HasResourcesForNextTech(): boolean {
    return this.techManager?.hasResourcesForNext() ?? false;
  }
  StartNextTechUpgrade(): State {
    return this.techManager?.startNext() ?? State.FAILED;
  }
  ShouldReanalyzeMap(): boolean {
    if (!this.mapAnalyzer) return true;
    return this.mapAnalyzer.isStale(AI_CONFIG.mapAnalysisIntervalMs);
  }
  ShouldReplanBase(): boolean {
    return (
      this.basePlanner.getCurrentNeeds().length === 0 || this.basePlanner.isNeedsStale(AI_CONFIG.baseReplanStaleMs)
    ); // extracted 4000
  }
  ReplanBase(): State {
    try {
      this.basePlanner.planBaseIfStale(this.blackboard, AI_CONFIG.baseReplanStaleMs); // extracted 4000
      return State.SUCCEEDED;
    } catch {
      return State.FAILED;
    }
  }
  HasPlannedBuildingNeed(): boolean {
    return this.basePlanner.getCurrentNeeds().length > 0;
  }
  async EnsureReservationForNextNeed(): Promise<State> {
    const res = await this.basePlanner.ensureReservationForTopNeed(this.blackboard);
    return res ? State.SUCCEEDED : State.FAILED;
  }
  HasResourcesForReservedBuilding(): boolean {
    return this.basePlanner.hasResourcesForReservedBuilding(this.blackboard);
  }
  AttemptPlacePlannedBuilding(): State {
    const reserved = this.basePlanner.getReservedBuilding();
    if (!reserved) return State.FAILED;
    if (!this.basePlanner.hasResourcesForObjectName(reserved.objectName, this.blackboard)) return State.FAILED;
    const result = this.assignBuilding(reserved.objectName);
    this.basePlanner.clearReservedBuilding();
    return result;
  }
  HasDamagedStructures(): boolean {
    return this.repairManager?.hasDamagedStructures() ?? false;
  }
  AssignRepairWorkers(): State {
    return this.repairManager?.assignRepairWorkers() ?? State.FAILED;
  }
  AssignDefenders(): State {
    return this.AssignDefendersToEnemies();
  }
  EnemySpotted(): boolean {
    return this.blackboard.visibleEnemies.length > 0;
  }
  AnalyzeEnemyBase(): State {
    // Placeholder: reuse existing map analysis to satisfy interface. TODO refine enemy base analysis.
    return this.AnalyzeGameMap();
  }
  GatherEnemyData(): State {
    // Placeholder: simply succeed after ensuring targeting manager updated.
    this.targetingManager?.update(performance.now());
    return State.SUCCEEDED;
  }
  ShouldProduceMilitaryUnit(): boolean {
    // Simple heuristic: produce if below threshold (reuse config militaryPowerDefaultThreshold)
    return (
      this.blackboard.units.length <
      (this.adaptiveThresholds?.getMilitaryPowerThreshold?.() ?? AI_CONFIG.militaryPowerDefaultThreshold)
    );
  }
  HasResourcesForQueuedUnit(): boolean {
    // Placeholder heuristic: needs at least worker threshold * 2 total resources.
    return this.blackboard.getTotalResources() >= AI_CONFIG.hasEnoughResourcesForWorkerThreshold * 2;
  }
  QueueMilitaryUnitProduction(): State {
    // Placeholder: attempt to start production of a worker variant as stand-in for military until proper unit selection added.
    const building = this.blackboard.trainingBuildings.find((b) => {
      const prod = getActorComponent(b, ProductionComponent);
      return prod?.isIdle;
    });
    if (!building) return State.FAILED;
    const prod = getActorComponent(building, ProductionComponent);
    if (!prod) return State.FAILED;
    try {
      const candidate = ObjectNames.SkaduweeWorkerMale as ObjectNames; // placeholder
      if (this.productionValidator) {
        const validation = this.productionValidator.validate(candidate);
        if (!validation.canQueue) {
          if (validation.techBlocked && validation.prereqs.length > 0) {
            this.productionValidator.schedulePrerequisites(validation.prereqs, candidate);
          }
          return State.FAILED;
        }
      }
      const def = pwActorDefinitions[candidate];
      const costData = def?.components?.productionCost;
      if (!costData) return State.FAILED;
      prod.startProduction({
        actorName: candidate,
        costData
      });
      return State.SUCCEEDED;
    } catch {
      return State.FAILED;
    }
  }
  // ===========================================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logDebugInfo(message?: any, ...optionalParams: any[]) {
    if (!this.displayDebugInfo) return;
    console.log(message, ...optionalParams);
  }

  private onShutdown() {
    this.aiDebuggingSubscription?.unsubscribe();
  }
}
