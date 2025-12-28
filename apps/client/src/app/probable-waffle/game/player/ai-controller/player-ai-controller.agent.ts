import { State } from "mistreevous";
import { type IPlayerControllerAgent } from "./player-ai-controller.agent.interface";
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
import { AI_CONFIG } from "./ai-config";
import { RepairManager } from "./ai-behavior/repair-manager";
import { LogisticsManager } from "./ai-behavior/logistics-manager";
import { TechProgressManager } from "./ai-behavior/tech-progress-manager";
import { AdaptiveThresholdManager } from "./ai-behavior/adaptive-threshold-manager";
import { CombatMicroManager } from "./ai-behavior/combat-micro-manager";
import { ScoutingManager } from "./ai-behavior/scouting-manager";
import { TargetingManager } from "./ai-behavior/targeting-manager";
import { SupplyPlanner } from "./ai-behavior/supply-planner";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { ResourceDrainComponent } from "../../entity/components/resource/resource-drain-component";
import { EconomyManager } from "./ai-behavior/economy-manager";
import { WorldStateSnapshotManager } from "./ai-behavior/world-state-snapshot-manager";
import GameObject = Phaser.GameObjects.GameObject;
import { type EnemyIntel, PlayerAiBlackboard } from "./player-ai-blackboard";

export class PlayerAiControllerAgent implements IPlayerControllerAgent {
  private displayDebugInfo = false;
  private aiDebuggingSubscription?: Subscription;
  private mapAnalyzer?: MapAnalyzer;
  public basePlanner: BasePlanner;
  private cooldowns = new CooldownManager();
  private hysteresisAggressive = makeHysteresisTracker({
    enter: AI_CONFIG.hysteresisAggressiveEnter,
    exit: AI_CONFIG.hysteresisAggressiveExit
  });
  private forceMaintenance: ForceMaintenanceManager;
  private repairManager: RepairManager;
  private logisticsManager: LogisticsManager;
  private techManager: TechProgressManager;
  public adaptiveThresholds: AdaptiveThresholdManager;
  private economyManager: EconomyManager;
  private worldStateSnapshotManager: WorldStateSnapshotManager;

  private combatMicro: CombatMicroManager;
  private scoutingManager: ScoutingManager;
  private targetingManager: TargetingManager;
  private productionValidator: ProductionValidator;

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
    const supplyPlanner = new SupplyPlanner(this.blackboard);
    this.productionValidator = new ProductionValidator(this.scene, this.player, this.blackboard);
    this.logisticsManager = new LogisticsManager(this.blackboard, this.logDebugInfo.bind(this));
    this.basePlanner = new BasePlanner(
      this.mapAnalyzer,
      this.player.factionType,
      supplyPlanner,
      this.productionValidator,
      this.logisticsManager
    );
    this.adaptiveThresholds = new AdaptiveThresholdManager(this.blackboard, this.basePlanner);
    this.cooldowns.configure("strategyShift", AI_CONFIG.strategyShiftIntervalMs);
    this.cooldowns.configure("analyzeMap", AI_CONFIG.mapAnalysisIntervalMs);
    this.cooldowns.configure("attackTrigger", AI_CONFIG.attackTriggerIntervalMs);
    this.cooldowns.configure("adaptiveThresholds", 500); // as per request
    this.forceMaintenance = new ForceMaintenanceManager(
      this.scene,
      this.player,
      this.blackboard,
      this.logDebugInfo.bind(this),
      this.productionValidator,
      this.adaptiveThresholds
    );
    this.repairManager = new RepairManager(
      this.scene,
      this.player.playerNumber!,
      this.blackboard,
      this.logDebugInfo.bind(this)
    );
    this.logisticsManager = new LogisticsManager(this.blackboard, this.logDebugInfo.bind(this));
    this.techManager = new TechProgressManager(this.blackboard, this.logDebugInfo.bind(this));
    this.economyManager = new EconomyManager(this.blackboard);
    this.worldStateSnapshotManager = new WorldStateSnapshotManager(this.scene, this.player, this.blackboard);
    this.combatMicro = new CombatMicroManager(this.scene, this.blackboard, this.logDebugInfo.bind(this));
    this.scoutingManager = new ScoutingManager(this.scene, this.blackboard, this.logDebugInfo.bind(this));
    this.targetingManager = new TargetingManager(this.blackboard);
  }

  /** Pre-tick lifecycle hook called by controller before behaviour tree step. */
  async preTick(now: number): Promise<void> {
    await this.updateManagers(now);
  }

  private async updateManagers(now: number): Promise<void> {
    this.worldStateSnapshotManager.update(now);
    this.economyManager.update(now);
    // Update scouting vision sampling
    this.scoutingManager.updateVisionSampling(now);
    // Update primary target cache
    this.targetingManager.update(now);
    this.processPrerequisiteQueue(now);
    if (this.cooldowns.canRun("adaptiveThresholds", now)) {
      this.adaptiveThresholds.update();
      this.cooldowns.markRun("adaptiveThresholds", now);
    }
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
          const validation = this.productionValidator.validate(next.objectName as ObjectNames);
          if (validation && !validation.canQueue) {
            // If still blocked (e.g., nested prereqs) schedule them (avoid infinite loop by checking difference)
            if (validation.techBlocked && validation.prereqs.length > 0) {
              this.productionValidator.schedulePrerequisites(validation.prereqs, next.objectName as ObjectNames);
            }
            // Handle building prerequisites
            if (
              validation.buildingPrereqBlocked &&
              validation.missingBuildings &&
              validation.missingBuildings.length > 0
            ) {
              this.productionValidator.schedulePrerequisites(
                validation.missingBuildings,
                next.objectName as ObjectNames
              );
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
  private async refreshOwnedActors(now: number) {
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
    const defense: GameObject[] = [];
    const housing: GameObject[] = [];
    const gathering: GameObject[] = [];

    // Get tech tree service for actor classification
    const techTree = getSceneService(this.scene, TechTreeService);

    owned.forEach((go) => {
      const gatherer =
        getActorComponent(go, GathererComponent) &&
        pwActorDefinitions[go.name as ObjectNames].meta?.isMainBuilding !== true;
      const prod = getActorComponent(go, ProductionComponent);
      const attack =
        getActorComponent(go, AttackComponent) &&
        pwActorDefinitions[go.name as ObjectNames].meta?.isMainBuilding !== true;
      const resourceDrain =
        getActorComponent(go, ResourceDrainComponent) &&
        pwActorDefinitions[go.name as ObjectNames].meta?.isMainBuilding !== true;

      const actorName = go.name as ObjectNames;

      if (gatherer) workers.push(go);
      if (prod) production.push(go);
      if (attack && !gatherer) units.push(go);

      const faction = this.player.factionType!;
      // Identify defensive structures using tech tree: has attack + production component
      if (techTree?.isDefensiveBuilding(faction, actorName)) {
        defense.push(go);
      }

      // Identify housing buildings using tech tree: has housing component
      if (techTree?.isHousingBuilding(faction, actorName)) {
        housing.push(go);
      }

      if (resourceDrain) gathering.push(go);
    });

    // Update resources and housing from player state (world source of truth)
    this.blackboard.resources = this.player.getResources();
    this.blackboard.production.supply.max = this.player.playerState.data.housing.maxHousing;
    this.blackboard.production.supply.used = this.player.playerState.data.housing.currentHousing;

    // Update primary actor lists
    this.blackboard.workers = workers;
    this.blackboard.productionBuildings = production;
    this.blackboard.trainingBuildings = production;
    this.blackboard.units = units;
    this.blackboard.defensiveStructures = defense;
    this.blackboard.gatheringStructures = gathering;

    // todo: replace with a more sophisticated military strength calculation (e.g. based on unit cost or dps)
    this.blackboard.militaryStrength = units.length;

    // Calculate housing capacity from housing buildings using tech tree definitions
    // Estimate base size as total building count (production + defense + housing)
    this.blackboard.baseSize = production.length;

    // Supply estimate
    this.blackboard.production.supply.used = units.length + workers.length;
    let queued = 0;
    production.forEach((b) => {
      const prod = getActorComponent(b, ProductionComponent);
      if (prod) queued += prod.itemsFromAllQueues.length;
    });
    this.blackboard.production.supply.pendingFromQueued = queued;

    // Sync production slice with updated values
    this.blackboard.production.defensiveStructures = defense;
    this.blackboard.production.trainingBuildings = production;
    this.blackboard.production.productionBuildings = production;

    const enemyCandidates = await this.extractEnemyCandidates(owned, index, units);

    const enemyIntel: Record<number, EnemyIntel> = {};
    let totalEnemyStrength = 0;

    for (const enemy of enemyCandidates) {
      const owner = getActorComponent(enemy, OwnerComponent)?.getOwner();
      if (owner === undefined || owner === this.player.playerNumber) continue;

      if (!enemyIntel[owner]) {
        enemyIntel[owner] = { strength: 0, unitsInCombat: 0, flankOpen: false };
      }

      const isCombatUnit = getActorComponent(enemy, AttackComponent) && !getActorComponent(enemy, GathererComponent);
      if (isCombatUnit) {
        const strength = this.getUnitStrength(enemy);
        enemyIntel[owner]!.strength += strength;
        totalEnemyStrength += strength;
      }
    }

    this.blackboard.enemyIntel = enemyIntel;

    // Update blackboard enemy-related fields
    this.blackboard.visibleEnemies = enemyCandidates;
    // todo: replace with a more sophisticated enemy military strength calculation
    this.blackboard.enemyMilitaryStrength = totalEnemyStrength;
    const baseCenter = this.blackboard.baseCenterTile;
    if (baseCenter) {
      this.blackboard.enemiesNearBase = await this.getEnemiesNearBase(enemyCandidates, baseCenter);
    } else {
      this.blackboard.enemiesNearBase = enemyCandidates.slice(0, AI_CONFIG.fallbackVisibleEnemyLimit);
    }

    // todo: implement proper enemy base detection
    this.blackboard.enemyBase = this.blackboard.primaryTarget;
    // todo: implement proper enemy flank detection
    this.blackboard.enemyFlankOpen = false;

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

  private getUnitStrength(unit: GameObject): number {
    const definition = pwActorDefinitions[unit.name as ObjectNames];
    if (!definition) return 1; // default strength

    const cost = definition.components?.productionCost?.resources;
    const totalCost = cost ? Object.values(cost).reduce((a, b) => a + b, 0) : 0;

    const health = getActorComponent(unit, HealthComponent)?.healthDefinition.maxHealth ?? 0;

    const attack = getActorComponent(unit, AttackComponent);
    const attackData = attack?.getAttacks()[0]; // simplified: using first attack
    const dps = attackData ? attackData.damage / (attackData.cooldown / 1000) : 0;

    // Simple weighting. Can be adjusted.
    return totalCost + health + dps * 10;
  }

  private async getEnemiesNearBase(enemyCandidates: GameObject[], baseCenter: Vector3Simple) {
    const distancePromises = enemyCandidates.map((enemy) =>
      DistanceHelper.getTileDistanceBetweenGameObjectAndTileNavigation(enemy, baseCenter).then(
        (distance) => [enemy, distance] as [GameObject, number | null]
      )
    );

    const enemiesWithDistances = await Promise.all(distancePromises);

    const near: GameObject[] = [];
    for (const [enemy, distance] of enemiesWithDistances) {
      if (distance !== null && distance <= AI_CONFIG.enemyNearBaseRadiusTiles) {
        near.push(enemy);
      }
    }
    return near;
  }

  private async extractEnemyCandidates(owned: GameObject[], index: ActorIndexSystem, units: GameObject[]) {
    // Derive enemy visibility & defense assignment
    const ownedSet = new Set(owned);
    const allActors = index.getAllIdActors();
    const baseCenter = this.blackboard.baseCenterTile;
    const visionRadius = AI_CONFIG.enemyVisionRadiusTiles;

    const potentialEnemies = allActors.filter((obj) => {
      if (ownedSet.has(obj)) return false;
      const health = getActorComponent(obj, HealthComponent);
      if (!health) return false;
      const ownerComponent = getActorComponent(obj, OwnerComponent);
      return !!ownerComponent;
    });

    const visibilityChecks = potentialEnemies.map(async (obj) => {
      // Basic visibility heuristic: distance to any unit or base center < visionRadius
      if (baseCenter) {
        const anyObj: any = obj.body || obj;
        if (anyObj?.x != null) {
          const dx = anyObj.x - baseCenter.x;
          const dy = anyObj.y - baseCenter.y;
          if (dx * dx + dy * dy <= visionRadius * visionRadius) return obj;
        }
      }

      for (const u of units) {
        const d = await DistanceHelper.getTileDistanceBetweenGameObjectsNavigation(u, obj);
        if (d !== null && d <= visionRadius) {
          return obj;
        }
      }
      return null;
    });

    const visibleEnemies = await Promise.all(visibilityChecks);
    return visibleEnemies.filter((e): e is GameObject => e !== null);
  }

  // needed only when passing this agent to BehaviourTree constructor
  [propertyName: string]: unknown;

  async AnalyzeGameMap(): Promise<State> {
    // Cooldown gating: avoid excessive map analyses.
    const now = performance.now();
    if (!this.cooldowns.canRun("analyzeMap", now)) return State.FAILED;
    try {
      if (!this.mapAnalyzer) this.mapAnalyzer = new MapAnalyzer(this.scene, this.player.playerNumber!);
      const result = await this.mapAnalyzer.analyzeIfStale(AI_CONFIG.mapAnalysisIntervalMs);
      this.blackboard.mapAnalysis = result;
      this.blackboard.baseCenterTile = result.baseCenterTile ?? null;
      this.blackboard.suggestedBuildTiles = result.candidateBuildSpots ?? [];
      await this.basePlanner.updateFromAnalysis(result);
      this.cooldowns.markRun("analyzeMap", now);
      this.blackboard.cooldowns.analyzeMap = now; // mirror timestamp for other systems
      return State.SUCCEEDED;
    } catch {
      return State.FAILED;
    }
  }

  HasIdleProductionBuilding() {
    return this.blackboard.productionBuildings.some((building) => {
      const productionComponent = getActorComponent(building, ProductionComponent);
      return productionComponent?.isIdle;
    });
  }

  IsBaseUnderAttack() {
    return this.blackboard.enemiesNearBase.length > 0;
  }

  IsBaseUnderHeavyAttack() {
    return this.blackboard.enemiesNearBase.length > this.adaptiveThresholds.getBaseHeavyAttackThreshold();
  }

  HasEnoughMilitaryPower() {
    // Unit discovery manager keeps units list current; no temp reassignment
    return this.blackboard.units.length >= this.adaptiveThresholds.getMilitaryPowerThreshold();
  }

  HasSurplusResources() {
    return this.blackboard.getTotalResources() > this.adaptiveThresholds.getResourceSurplusThreshold();
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
    this.targetingManager.update(now);
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
    return this.blackboard.getTotalResources() < this.adaptiveThresholds.getNeedMoreResourcesThreshold();
  }

  HasSufficientResources() {
    return this.blackboard.getTotalResources() >= this.adaptiveThresholds.getHasSufficientResourcesThreshold();
  }

  ResourceShortage() {
    return this.blackboard.getTotalResources() < this.adaptiveThresholds.getResourceGatheringThreshold();
  }

  async AssignWorkersToGather(): Promise<State> {
    const idleWorkers = this.blackboard.workers.filter((worker) => {
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) return false;
      return !gathererComponent.isGathering;
    });
    if (idleWorkers.length > 0) {
      const criticalResource = this.logisticsManager.getMostConstrainedResource() ?? ResourceType.Wood;
      for (const worker of idleWorkers) {
        const gathererComponent = getActorComponent(worker, GathererComponent);
        if (!gathererComponent) continue;
        const closestResourceSource = await gathererComponent.getClosestResourceSource(
          criticalResource,
          AI_CONFIG.gatherSearchRadius
        ); // todo hardcoded replaced 100
        if (!closestResourceSource) continue;
        gathererComponent.startGatheringResources(closestResourceSource);
      }
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
    const threshold = this.adaptiveThresholds.getHasEnoughResourcesForWorkerThreshold();
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
      for (const worker of workers) {
        const gathererComponent = getActorComponent(worker, GathererComponent);
        if (!gathererComponent) continue;
        const closestResourceSource = await gathererComponent.getClosestResourceSource(
          criticalResource,
          AI_CONFIG.gatherSearchRadius
        ); // replaced 100
        if (!closestResourceSource) continue;
        gathererComponent.startGatheringResources(closestResourceSource);
      }
      this.logDebugInfo("Reassigned workers to gather the most critical resource.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  async AssignWorkersToResource(): Promise<State> {
    let anyAssigned = false;
    for (const worker of this.blackboard.workers) {
      const aiController = getActorComponent(worker, PawnAiController);
      if (!aiController) {
        continue;
      }
      if (aiController.blackboard.getCurrentOrder()) {
        continue; // currently busy
      }
      const gathererComponent = getActorComponent(worker, GathererComponent);
      if (!gathererComponent) continue;
      const closestResourceSource = await gathererComponent.getClosestResourceSource(
        ResourceType.Wood,
        AI_CONFIG.gatherSearchRadius
      ); // TODO resource targeting logic (replaced 100)
      if (!closestResourceSource) continue;
      const newOrder = new OrderData(OrderType.Gather, { targetGameObject: closestResourceSource });
      aiController.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
      aiController.blackboard.setCurrentOrder(newOrder);
      anyAssigned = true;
    }
    if (anyAssigned) {
      this.logDebugInfo("Assigned workers to gather the closest resource.");
      return State.SUCCEEDED;
    }
    return State.FAILED;
  }

  SufficientResourcesForUpgrade() {
    const threshold = this.adaptiveThresholds.getSufficientResourcesForUpgradeThreshold();
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

  private assignBuilding(buildingType: ObjectNames, preferredLocationTileXY?: Vector3Simple): State {
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
          Math.floor(Math.random() * AI_CONFIG.buildingPlacementRandomOffsetRange) -
          AI_CONFIG.buildingPlacementRandomOffsetRange;
        const ry =
          transform!.y +
          Math.floor(Math.random() * AI_CONFIG.buildingPlacementRandomOffsetRange) -
          AI_CONFIG.buildingPlacementRandomOffsetRange;
        tileLocationXYZ = { x: rx, y: ry, z: 0 } as Vector3Simple;
      }
    }

    const validWorkers = this.blackboard.workers.filter((worker) => {
      const aiController = getActorComponent(worker, PawnAiController);
      if (!aiController) return false;
      const builderComponent = getActorComponent(worker, BuilderComponent);
      return !!builderComponent && builderComponent.isIdle();
    });
    if (validWorkers.length === 0) {
      // Release consumed plan if no workers available
      if (planConsumed) this.basePlanner.releasePlanAt(planConsumed.tile);
      return State.FAILED;
    }

    const worldXYZ = IsoHelper.isometricTileToWorldXY(this.scene, tileLocationXYZ.x, tileLocationXYZ.y);
    if (!worldXYZ) {
      if (planConsumed) this.basePlanner.releasePlanAt(planConsumed.tile);
      return State.FAILED;
    }
    const building = BuildingCursor.spawnBuildingForPlayer(
      this.scene,
      buildingType,
      { x: worldXYZ.x, y: worldXYZ.y, z: 0 },
      this.player.playerNumber
    );

    validWorkers.forEach((w) => {
      const aiController = getActorComponent(w, PawnAiController);
      const newOrder = new OrderData(OrderType.Build, { targetGameObject: building });
      aiController!.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
      aiController!.blackboard.setCurrentOrder(newOrder);
    });
    // Mark reservation usage & release any lingering plan reservation reference
    this.basePlanner.markTileUsed({ x: tileLocationXYZ.x, y: tileLocationXYZ.y });
    this.basePlanner.releasePlanAt({ x: tileLocationXYZ.x, y: tileLocationXYZ.y });
    this.logDebugInfo("Assigned workers to build a new building (planned-aware).");
    return State.SUCCEEDED;
  }

  NeedToScout() {
    return this.scoutingManager.needToScout();
  }

  AssignScoutUnits() {
    if (this.scoutingManager.assignScoutUnits()) return State.SUCCEEDED;
    return State.FAILED;
  }

  IsInCombat() {
    return this.combatMicro.isInCombat();
  }

  LowHealthUnit(): boolean {
    return this.combatMicro.hasLowHealthUnit();
  }

  RetreatUnit() {
    if (this.combatMicro.retreatLowHealthUnits()) return State.SUCCEEDED;
    return State.FAILED;
  }

  FocusFire() {
    if (this.combatMicro.focusFire()) return State.SUCCEEDED;
    return State.FAILED;
  }

  FlankEnemy() {
    if (this.combatMicro.flankEnemy()) return State.SUCCEEDED;
    return State.FAILED;
  }

  EnemyInRange(): boolean {
    return this.combatMicro.enemyInRange() ?? false;
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
    return this.logisticsManager.shouldRebalance();
  }
  async RebalanceHarvesterAllocation(): Promise<State> {
    return this.logisticsManager.rebalanceHarvesters();
  }
  StockpileImbalanceDetected(): boolean {
    return this.logisticsManager.stockpileImbalanceDetected();
  }
  async RedirectWorkersToScarceResource(): Promise<State> {
    return this.logisticsManager.redirectToScarce();
  }
  ShouldPursueNextTech(): boolean {
    return this.techManager.shouldPursueNext();
  }
  HaveIdleUpgradeBuilding(): boolean {
    return this.techManager.haveIdleUpgradeBuilding();
  }
  HasResourcesForNextTech(): boolean {
    return this.techManager.hasResourcesForNext();
  }
  StartNextTechUpgrade(): State {
    return this.techManager.startNext();
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
      this.basePlanner.planBaseIfStale(this.blackboard, AI_CONFIG.baseReplanStaleMs, this.adaptiveThresholds); // extracted 4000
      // Debug: show how many plan reservations currently tracked
      const planCount = this.basePlanner.getPlannedBuildings().length;
      this.logDebugInfo("ReplanBase executed. Active plan reservations:", planCount);
      return State.SUCCEEDED;
    } catch {
      return State.FAILED;
    }
  }
  HasPlannedBuildingNeed(): boolean {
    const needs = this.basePlanner.getCurrentNeeds();
    if (needs.length > 0) {
      const nextType = needs[0]!.type;
      if (nextType) this.logDebugInfo("Next needed building type:", nextType);
      return true;
    }
    return false;
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
    // Pass reserved tile directly so placement prefers planning reservation
    const result = this.assignBuilding(reserved.objectName, {
      x: reserved.tile.x,
      y: reserved.tile.y,
      z: 0
    } as Vector3Simple);
    this.basePlanner.clearReservedBuilding();
    return result;
  }
  HasDamagedStructures(): boolean {
    return this.repairManager.hasDamagedStructures();
  }
  AssignRepairWorkers(): State {
    return this.repairManager.assignRepairWorkers();
  }
  AssignDefenders(): State {
    return this.AssignDefendersToEnemies();
  }
  EnemySpotted(): boolean {
    return this.blackboard.visibleEnemies.length > 0;
  }
  async AnalyzeEnemyBase(): Promise<State> {
    return await this.AnalyzeGameMap();
  }
  GatherEnemyData(): State {
    // Placeholder: simply succeed after ensuring targeting manager updated.
    this.targetingManager.update(performance.now());
    return State.SUCCEEDED;
  }
  ShouldProduceMilitaryUnit(): boolean {
    return this.forceMaintenance.shouldProduceMilitaryUnit();
  }
  HasResourcesForQueuedUnit(): boolean {
    return this.forceMaintenance.hasResourcesForQueuedUnit();
  }
  HasSupplyCapacity(): boolean {
    return !this.forceMaintenance.isSupplyCapped();
  }
  QueueMilitaryUnitProduction(): State {
    return this.forceMaintenance.queueMilitaryUnitProduction();
  }

  public getTelemetrySnapshot() {
    // a bit of a hack to get telemetry... but it works for now
    const bb = this.blackboard as any;
    if (!bb.diagnostics.telemetry) {
      bb.diagnostics.telemetry = {
        spans: {},
        counters: {}
      };
    }
    return bb.diagnostics.telemetry;
  }

  // ================= Surrender Logic =================
  ShouldOfferSurrender(): boolean {
    // Don't offer surrender if already offered or rejected
    if (this.blackboard.wantsToSurrender || this.blackboard.surrenderRejected) return false;

    // Check if AI is in a losing position
    const totalUnits = this.blackboard.units.length + this.blackboard.workers.length;
    const totalBuildings = this.blackboard.productionBuildings.length;
    const resources = this.blackboard.getTotalResources();

    // Surrender conditions:
    // 1. Very low unit count (< 3 units)
    // 2. Low building count (< 2 buildings)
    // 3. Enemy has significant military advantage (3x or more, or AI has no military)
    // 4. Very low resources (< 100 total)
    const veryLowUnits = totalUnits < 3;
    const fewBuildings = totalBuildings < 2;
    const enemyAdvantage =
      (this.blackboard.militaryStrength === 0 && this.blackboard.enemyMilitaryStrength > 0) ||
      (this.blackboard.militaryStrength > 0 &&
        this.blackboard.enemyMilitaryStrength > this.blackboard.militaryStrength * 3);
    const lowResources = resources < 100;

    // AI should surrender if it meets multiple losing conditions
    const losingConditionsMet = [veryLowUnits, fewBuildings, enemyAdvantage, lowResources].filter(Boolean).length >= 2;

    return losingConditionsMet;
  }

  OfferSurrender(): State {
    const now = performance.now();
    this.blackboard.wantsToSurrender = true;
    this.blackboard.surrenderOfferedAt = now;
    this.logDebugInfo("AI player offering surrender");
    return State.SUCCEEDED;
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
