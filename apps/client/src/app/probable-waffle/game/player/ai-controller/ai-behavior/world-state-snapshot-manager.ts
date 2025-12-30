import { type EnemyIntel, PlayerAiBlackboard } from "../player-ai-blackboard";
import { ObjectNames, ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { ResourceDrainComponent } from "../../../entity/components/resource/resource-drain-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { getUnitStrength } from "../ai-utils";
import { DistanceHelper } from "../../../library/distance-helper";
import { AI_CONFIG } from "../ai-config";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import GameObject = Phaser.GameObjects.GameObject;

export class WorldStateSnapshotManager {
  private ownedScanInitialized = false;
  private lastOwnedRefreshAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly blackboard: PlayerAiBlackboard
  ) {}

  update(now: number) {
    if (now - this.lastOwnedRefreshAt < AI_CONFIG.ownedRefreshIntervalMs) return;
    this.refreshOwnedActors(now);
    this.lastOwnedRefreshAt = now;
  }

  private refreshOwnedActors(now: number) {
    const index = getSceneService(this.scene, ActorIndexSystem);
    if (!index) return;
    if (!this.ownedScanInitialized) {
      index.scanExistingActors();
      this.ownedScanInitialized = true;
    }

    const owned = index.getOwnedActors(this.player.playerNumber);
    this.updateBlackboardActors(owned);
    this.updateBlackboardEconomy();
    this.updateEnemyIntel(owned, index);
  }

  private updateBlackboardActors(owned: GameObject[]) {
    const workers: GameObject[] = [];
    const units: GameObject[] = [];
    const production: GameObject[] = [];
    const defense: GameObject[] = [];
    const housing: GameObject[] = [];
    const gathering: GameObject[] = [];

    const techTree = getSceneService(this.scene, TechTreeService);
    const faction = this.player.factionType!;

    owned.forEach((go) => {
      const actorName = go.name as ObjectNames;
      const definition = pwActorDefinitions[actorName];
      if (!definition) return;

      const isMainBuilding = definition.meta?.isMainBuilding === true;

      if (!isMainBuilding) {
        if (getActorComponent(go, GathererComponent)) workers.push(go);
        if (getActorComponent(go, AttackComponent) && !getActorComponent(go, GathererComponent)) units.push(go);
        if (techTree?.isDefensiveBuilding(faction, actorName)) defense.push(go);
      }

      if (getActorComponent(go, ProductionComponent)) production.push(go);
      if (techTree?.isHousingBuilding(faction, actorName)) housing.push(go);
      if (getActorComponent(go, ResourceDrainComponent)) gathering.push(go);
    });

    this.blackboard.workers = workers;
    this.blackboard.units = units;
    this.blackboard.productionBuildings = production;
    this.blackboard.trainingBuildings = production;
    this.blackboard.defensiveStructures = defense;
    this.blackboard.gatheringStructures = gathering;
    this.blackboard.baseSize = production.length;
  }

  private updateBlackboardEconomy() {
    this.blackboard.economy.resources = this.player.getResources();
    this.blackboard.production.supply.max = this.player.playerState.data.housing.maxHousing;
    this.blackboard.production.supply.used = this.player.playerState.data.housing.currentHousing;

    let queued = 0;
    this.blackboard.productionBuildings.forEach((b) => {
      const prod = getActorComponent(b, ProductionComponent);
      if (prod) queued += prod.itemsFromAllQueues.length;
    });
    this.blackboard.production.supply.pendingFromQueued = queued;
  }

  private async updateEnemyIntel(owned: GameObject[], index: ActorIndexSystem) {
    const enemyCandidates = await this.extractEnemyCandidates(owned, index);
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
        const strength = getUnitStrength(enemy);
        enemyIntel[owner]!.strength += strength;
        totalEnemyStrength += strength;
      }
    }

    this.blackboard.enemyIntel = enemyIntel;
    this.blackboard.visibleEnemies = enemyCandidates;
    this.blackboard.enemyMilitaryStrength = totalEnemyStrength;

    const baseCenter = this.blackboard.baseCenterTile;
    if (baseCenter) {
      this.blackboard.enemiesNearBase = await this.getEnemiesNearBase(enemyCandidates, baseCenter);
    } else {
      this.blackboard.enemiesNearBase = enemyCandidates.slice(0, AI_CONFIG.fallbackVisibleEnemyLimit);
    }

    // Enemy base detection: use primary target from targeting manager
    this.blackboard.enemyBase = this.blackboard.primaryTarget;

    // Enemy flank detection: simplified heuristic
    this.blackboard.enemyFlankOpen = false;

    // Assign defenders: subset of units near base center
    this.assignDefenders(baseCenter);
  }

  private async getEnemiesNearBase(enemyCandidates: GameObject[], baseCenter: { x: number; y: number; z: number }) {
    const near: GameObject[] = [];
    for (const enemy of enemyCandidates) {
      const d = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(enemy, baseCenter);
      if (d !== null && d <= AI_CONFIG.enemyNearBaseRadiusTiles) {
        near.push(enemy);
      }
    }
    return near;
  }

  private assignDefenders(baseCenter: { x: number; y: number; z: number } | null) {
    const defenders: GameObject[] = [];
    if (baseCenter) {
      this.blackboard.units.forEach((u) => {
        const d = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(u, baseCenter);
        if (d !== null && d <= AI_CONFIG.defenderAssignmentRadiusTiles) {
          defenders.push(u);
        }
      });
    }
    if (defenders.length === 0) {
      defenders.push(...this.blackboard.units.slice(0, AI_CONFIG.defenderFallbackMaxCount));
    }
    this.blackboard.defendingUnits = defenders;
  }

  private async extractEnemyCandidates(owned: GameObject[], index: ActorIndexSystem): Promise<GameObject[]> {
    // This logic can be further optimized
    const allActors = index.getAllIdActors();
    const ownedSet = new Set(owned);
    return allActors.filter(
      (obj) =>
        !ownedSet.has(obj) &&
        getActorComponent(obj, OwnerComponent) &&
        getActorComponent(obj, HealthComponent) &&
        !getActorComponent(obj, HealthComponent)!.killed
    );
  }
}
