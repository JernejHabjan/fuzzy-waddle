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
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { getActorComponent } from "../../../data/actor-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { getUnitStrength } from "../ai-utils";
import { DistanceHelper } from "../../../library/distance-helper";
import { AI_CONFIG } from "../ai-config";
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
    // noinspection JSIgnoredPromiseFromCall
    this.refreshWorldState(now);
    this.lastOwnedRefreshAt = now;
  }

  private async refreshWorldState(now: number) {
    const index = getSceneService(this.scene, ActorIndexSystem);
    if (!index) return;

    if (!this.ownedScanInitialized) {
      index.scanExistingActors();
      this.ownedScanInitialized = true;
    }

    const owned = index.getOwnedActors(this.player.playerNumber);

    this.refreshOwnedActors(owned);
    this.refreshEconomyAndSupply();
    await this.refreshEnemyState(owned, index);
  }

  // ---------------------------------------------------------------------------
  // OWNED ACTORS
  // ---------------------------------------------------------------------------

  private refreshOwnedActors(owned: GameObject[]) {
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

      const gatherer = getActorComponent(go, GathererComponent) && !isMainBuilding;
      const productionComp = getActorComponent(go, ProductionComponent);
      const attack = getActorComponent(go, AttackComponent) && !gatherer;
      const resourceDrain = getActorComponent(go, ResourceDrainComponent) && !isMainBuilding;

      if (gatherer) workers.push(go);
      if (attack) units.push(go);
      if (productionComp) production.push(go);
      if (resourceDrain) gathering.push(go);

      if (techTree?.isDefensiveBuilding(faction, actorName)) {
        defense.push(go);
      }

      if (techTree?.isHousingBuilding(faction, actorName)) {
        housing.push(go);
      }
    });

    // Primary lists
    this.blackboard.workers = workers;
    this.blackboard.units = units;
    this.blackboard.productionBuildings = production;
    this.blackboard.trainingBuildings = production;
    this.blackboard.defensiveStructures = defense;
    this.blackboard.gatheringStructures = gathering;

    // Production slice sync
    this.blackboard.production.productionBuildings = production;
    this.blackboard.production.trainingBuildings = production;
    this.blackboard.production.defensiveStructures = defense;

    // Derived values
    this.blackboard.baseSize = production.length;
    this.blackboard.militaryStrength = units.reduce((sum, u) => sum + getUnitStrength(u), 0);

    // Supply estimate (matches old logic)
    this.blackboard.production.supply.used = units.length + workers.length;
  }

  // ---------------------------------------------------------------------------
  // ECONOMY / SUPPLY
  // ---------------------------------------------------------------------------

  private refreshEconomyAndSupply() {
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

  // ---------------------------------------------------------------------------
  // ENEMIES / VISIBILITY / DEFENSE
  // ---------------------------------------------------------------------------

  private async refreshEnemyState(owned: GameObject[], index: ActorIndexSystem) {
    const enemyCandidates = await this.extractEnemyCandidates(owned, index, this.blackboard.units);

    const enemyIntel: Record<number, EnemyIntel> = {};
    let totalEnemyStrength = 0;

    for (const enemy of enemyCandidates) {
      const owner = getActorComponent(enemy, OwnerComponent)?.getOwner();
      if (owner === undefined || owner === this.player.playerNumber) continue;

      if (!enemyIntel[owner]) {
        enemyIntel[owner] = {
          strength: 0,
          unitsInCombat: 0,
          flankOpen: false
        };
      }

      const isCombatUnit = getActorComponent(enemy, AttackComponent) && !getActorComponent(enemy, GathererComponent);

      if (isCombatUnit) {
        const strength = getUnitStrength(enemy);
        enemyIntel[owner].strength += strength;
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
      console.warn("AI Blackboard: No base center tile defined for enemy proximity check.");
      this.blackboard.enemiesNearBase = [];
    }
    if (!this.scene.scene.isActive()) {
      // after long async action, scene might be destroyed
      return;
    }
    this.blackboard.enemyBase = this.blackboard.primaryTarget;
    this.blackboard.enemyFlankOpen = false;

    this.assignDefenders(baseCenter);
  }

  private async getEnemiesNearBase(enemies: GameObject[], baseCenter: { x: number; y: number; z: number }) {
    const near: GameObject[] = [];
    for (const enemy of enemies) {
      const d = await DistanceHelper.getTileDistanceBetweenGameObjectAndTileNavigation(enemy, baseCenter);
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

  // ---------------------------------------------------------------------------
  // VISIBILITY
  // ---------------------------------------------------------------------------

  private async extractEnemyCandidates(
    owned: GameObject[],
    index: ActorIndexSystem,
    units: GameObject[]
  ): Promise<GameObject[]> {
    const ownedSet = new Set(owned);
    const allActors = index.getAllIdActors();
    const baseCenter = this.blackboard.baseCenterTile;
    const visionRadius = AI_CONFIG.enemyVisionRadiusTiles;

    const candidates = allActors.filter((obj) => {
      if (ownedSet.has(obj)) return false;
      if (!getActorComponent(obj, HealthComponent)) return false;
      // noinspection RedundantIfStatementJS
      if (!getActorComponent(obj, OwnerComponent)) return false;
      return true;
    });

    // ignore visibility checks atm
    // const visibilityChecks = candidates.map(async (obj) => {
    //   if (baseCenter) {
    //     const anyObj: any = obj.body || obj;
    //     if (anyObj?.x != null) {
    //       const dx = anyObj.x - baseCenter.x;
    //       const dy = anyObj.y - baseCenter.y;
    //       if (dx * dx + dy * dy <= visionRadius * visionRadius) {
    //         return obj;
    //       }
    //     }
    //   }
    //
    //   for (const u of units) {
    //     const d = await DistanceHelper.getTileDistanceBetweenGameObjectsNavigation(u, obj);
    //     if (d !== null && d <= visionRadius) {
    //       return obj;
    //     }
    //   }
    //   return null;
    // });
    //
    // const visible = await Promise.all(visibilityChecks);
    // return visible.filter((v): v is GameObject => v !== null);

    return candidates;
  }
}
