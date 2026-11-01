import type Phaser from "phaser";
import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { ObjectNames, ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { ResourceDrainComponent } from "../../../entity/components/resource/resource-drain-component";
import { getActorComponent } from "../../../data/actor-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getUnitStrength } from "../decision/ai-utils";
import { AI_CONFIG } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/ai-config";
import { getResearchedLevelForActor } from "../../../data/actor-level-utils";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";

type GameObject = Phaser.GameObjects.GameObject;

/** Refreshes owned compatibility data. Enemy knowledge belongs exclusively to the fair observation pipeline. */
export class WorldStateSnapshotManager {
  private lastOwnedRefreshAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly blackboard: PlayerAiBlackboard
  ) {}

  /** Pure planning needs current owned resources/supply, without waiting for legacy enemy routes. */
  updateOwned(now: number): void {
    if (now - this.lastOwnedRefreshAt < AI_CONFIG.ownedRefreshIntervalMs) return;
    this.refreshOwnedState();
    this.lastOwnedRefreshAt = now;
  }

  private refreshOwnedState() {
    const index = getSceneService(this.scene, ActorIndexSystem);
    if (!index) return;

    const owned = index
      .getOwnedActors(this.player.playerNumber)
      .filter(hasStableAiActorId)
      .sort(compareAiActorsByStableId);

    this.refreshOwnedActors(owned);
    this.refreshEconomyAndSupply();
    return { owned, index };
  }

  // ---------------------------------------------------------------------------
  // OWNED ACTORS
  // ---------------------------------------------------------------------------

  /**
   * Rebuilds AI-owned actor slices and their derived strength/supply totals from the
   * indexed world. Main buildings are deliberately excluded from worker/gathering roles,
   * avoiding distorted economy decisions while keeping production/defence classification
   * aligned with the definition and tech-tree authorities.
   */
  private refreshOwnedActors(owned: GameObject[]) {
    const workers: GameObject[] = [];
    const units: GameObject[] = [];
    const production: GameObject[] = [];
    const defense: GameObject[] = [];
    const housing: GameObject[] = [];
    const gathering: GameObject[] = [];

    const techTree = getSceneService(this.scene, TechTreeService);

    owned.forEach((go) => {
      const actorName = go.name as ObjectNames;
      const definition = getPwActorDefinition(actorName, getResearchedLevelForActor(go));
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

      if (techTree?.isDefensiveBuilding(actorName)) {
        defense.push(go);
      }

      if (techTree?.isHousingBuilding(actorName)) {
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
}

/**
 * Orders indexed AI actors by the stable ID required by command and replay contracts.
 * Snapshot inputs come from {@link ActorIndexSystem}, so a missing ID indicates a broken
 * indexing invariant rather than a candidate that may be ordered by runtime insertion.
 */
export function compareAiActorsByStableId(left: GameObject, right: GameObject): number {
  const leftId = getActorComponent(left, IdComponent)?.id;
  const rightId = getActorComponent(right, IdComponent)?.id;
  if (!leftId || !rightId) {
    throw new Error("AI actor ordering requires indexed actors with stable IDs");
  }
  if (leftId === rightId) return 0;
  return leftId < rightId ? -1 : 1;
}

/** Excludes stale/transitional index entries without allowing them to halt an AI decision boundary. */
export function hasStableAiActorId(actor: GameObject): boolean {
  return Boolean(getActorComponent(actor, IdComponent)?.id);
}
