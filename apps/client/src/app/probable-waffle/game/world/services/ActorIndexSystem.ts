import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/components/id-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { ResourceDrainComponent } from "../../entity/components/resource/resource-drain-component";
import { ObjectNames, type PlayerNumber, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import { getSceneComponent, getSceneService } from "./scene-component-helpers";
import { TilemapComponent } from "../tilemap/tilemap.component";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";
import { getCanonicalActorNameCached } from "../../data/tech-tree/canonical-actor-name";

export class ActorIndexSystem {
  private readonly idActors = new Set<GameObject>();
  private readonly ownedActors = new Map<PlayerNumber, Set<GameObject>>();
  private readonly resourceSources = new Set<GameObject>();
  private readonly resourceDrains = new Set<GameObject>();
  // Track count of each actor type per player for tech unlock management
  // Uses canonical names to group variants (e.g., TivaraWorkerMale counts as TivaraWorker)
  private readonly actorTypeCounts = new Map<PlayerNumber, Map<ObjectNames, number>>();

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  // Explicit registration (safe to call multiple times)
  registerActor = (obj?: GameObject) => {
    if (!obj || !obj.scene) return;

    // Only index actors that have IdComponent
    const id = getActorComponent(obj, IdComponent);
    if (!id) return;

    if (!this.idActors.has(obj)) {
      this.idActors.add(obj);

      const ownerComp = getActorComponent(obj, OwnerComponent);
      const owner = ownerComp?.getOwner();
      if (owner !== undefined) {
        let set = this.ownedActors.get(owner);
        if (!set) {
          set = new Set<GameObject>();
          this.ownedActors.set(owner, set);
        }
        set.add(obj);

        // Track actor type count and update tech tree unlocks
        const actorName = obj.name as ObjectNames;
        if (actorName) {
          // Use canonical name to group variants (e.g., TivaraWorkerMale -> TivaraWorker)
          const canonicalName = getCanonicalActorNameCached(actorName);
          this.incrementActorTypeCount(owner, canonicalName);

          // Register unlock in tech tree service
          const techTreeService = getSceneService(this.scene, TechTreeService);
          if (techTreeService) {
            techTreeService.registerActorUnlock(owner, canonicalName);
          }
        }
      }

      if (getActorComponent(obj, ResourceSourceComponent)) {
        this.resourceSources.add(obj);
      }
      if (getActorComponent(obj, ResourceDrainComponent)) {
        this.resourceDrains.add(obj);
      }

      // Auto-unregister on destroy
      obj.once(HealthComponent.KilledEvent, () => this.unregisterActor(obj));
      obj.once(Phaser.GameObjects.Events.DESTROY, () => this.unregisterActor(obj));
    }
  };

  unregisterActor = (obj?: GameObject) => {
    if (!obj) return;

    if (this.idActors.delete(obj)) {
      // remove from owned map
      const ownerComp = getActorComponent(obj, OwnerComponent);
      const owner = ownerComp?.getOwner();
      if (owner !== undefined) {
        const set = this.ownedActors.get(owner);
        set?.delete(obj);
        if (set && set.size === 0) this.ownedActors.delete(owner);

        // Track actor type count and update tech tree unlocks
        const actorName = obj.name as ObjectNames;
        if (actorName) {
          // Use canonical name to group variants (e.g., TivaraWorkerMale -> TivaraWorker)
          const canonicalName = getCanonicalActorNameCached(actorName);
          const remainingCount = this.decrementActorTypeCount(owner, canonicalName);

          // Unregister unlock if this was the last instance
          const techTreeService = getSceneService(this.scene, TechTreeService);
          if (techTreeService) {
            techTreeService.unregisterActorUnlock(owner, canonicalName, remainingCount);
          }
        }
      }

      this.resourceSources.delete(obj);
      this.resourceDrains.delete(obj);
    }
  };

  /**
   * Increment the count of a specific actor type for a player.
   */
  private incrementActorTypeCount(playerNumber: PlayerNumber, actorName: ObjectNames): number {
    let playerCounts = this.actorTypeCounts.get(playerNumber);
    if (!playerCounts) {
      playerCounts = new Map<ObjectNames, number>();
      this.actorTypeCounts.set(playerNumber, playerCounts);
    }

    const currentCount = playerCounts.get(actorName) || 0;
    const newCount = currentCount + 1;
    playerCounts.set(actorName, newCount);
    return newCount;
  }

  /**
   * Decrement the count of a specific actor type for a player.
   * Returns the remaining count.
   */
  private decrementActorTypeCount(playerNumber: PlayerNumber, actorName: ObjectNames): number {
    const playerCounts = this.actorTypeCounts.get(playerNumber);
    if (!playerCounts) return 0;

    const currentCount = playerCounts.get(actorName) || 0;
    const newCount = Math.max(0, currentCount - 1);

    if (newCount === 0) {
      playerCounts.delete(actorName);
    } else {
      playerCounts.set(actorName, newCount);
    }

    return newCount;
  }

  /**
   * Get the count of a specific actor type for a player.
   * Uses canonical names (e.g., TivaraWorkerMale is counted as TivaraWorker).
   */
  getActorTypeCount(playerNumber: PlayerNumber, actorName: ObjectNames): number {
    const playerCounts = this.actorTypeCounts.get(playerNumber);
    return playerCounts?.get(actorName) || 0;
  }

  // One-time population (useful after initial actor creation)
  scanExistingActors(): void {
    this.scene.children.list.forEach((child) => this.registerActor(child as GameObject));

    // After scanning, initialize tech tree unlocks for all players
    const techTreeService = getSceneService(this.scene, TechTreeService);
    if (techTreeService) {
      this.ownedActors.forEach((actors, playerNumber) => {
        techTreeService.initializePlayerUnlocks(playerNumber, Array.from(actors));
      });
    }
  }

  getAllIdActors(): GameObject[] {
    return Array.from(this.idActors);
  }

  getActorById(id: string): GameObject | null {
    for (const obj of this.idActors) {
      const idComp = getActorComponent(obj, IdComponent);
      if (idComp?.id === id) {
        return obj;
      }
    }
    return null;
  }

  getActorsByIds(ids: string[]): GameObject[] {
    const result: GameObject[] = [];
    const idSet = new Set(ids);
    for (const obj of this.idActors) {
      const idComp = getActorComponent(obj, IdComponent);
      if (idComp && idSet.has(idComp.id)) {
        result.push(obj);
        idSet.delete(idComp.id);
        if (idSet.size === 0) break; // all found
      }
    }
    return result;
  }

  getOwnedActors(ownerNumber?: PlayerNumber): GameObject[] {
    if (ownerNumber === undefined) return [];
    const set = this.ownedActors.get(ownerNumber);
    return set ? Array.from(set) : [];
  }

  getOwnedActorsByPlayers(): Map<PlayerNumber, Set<GameObject>> {
    return this.ownedActors;
  }

  getResourceSourcesFiltered(type?: ResourceType): GameObject[] {
    const list = Array.from(this.resourceSources);
    if (type === undefined) return list;
    return list.filter((go) => {
      const src = getActorComponent(go, ResourceSourceComponent);
      return !!src && src.getResourceType() === type;
    });
  }

  getResourceDrainsFiltered(ownerNumber?: PlayerNumber, type?: ResourceType): GameObject[] {
    let drains = Array.from(this.resourceDrains);
    if (ownerNumber !== undefined) {
      drains = drains.filter((go) => getActorComponent(go, OwnerComponent)?.getOwner() === ownerNumber);
    }
    if (type !== undefined) {
      drains = drains.filter((go) => {
        const drain = getActorComponent(go, ResourceDrainComponent);
        return !!drain && drain.getResourceTypes().includes(type);
      });
    }
    return drains;
  }

  // Candidates that are units/buildings (not resources), not dead, and not same team as reference
  getEnemyCandidates(reference: GameObject): GameObject[] {
    const refOwnerComp = getActorComponent(reference, OwnerComponent);
    if (!refOwnerComp) return [];

    const result: GameObject[] = [];
    this.idActors.forEach((obj) => {
      if (obj === reference) return;

      // Skip resources
      if (getActorComponent(obj, ResourceSourceComponent)) return;

      // Must have owner to be an enemy
      const ownerComp = getActorComponent(obj, OwnerComponent);
      if (!ownerComp) return;

      // Skip destroyed/dead
      const health = getActorComponent(obj, HealthComponent);
      if (health && health.killed) return;

      // Skip same team
      if (ownerComp.isSameTeamAsGameObject(reference)) return;

      result.push(obj);
    });
    return result;
  }

  getActorsAtTile(tile: { x: number; y: number }): GameObject[] {
    const tileMapComponent = getSceneComponent(this.scene, TilemapComponent);
    if (!tileMapComponent) return [];

    const result: GameObject[] = [];
    this.idActors.forEach((obj) => {
      const objTile = getTileCoordsUnderObject(tileMapComponent.tilemap, obj);
      if (objTile.some((t) => t.x === tile.x && t.y === tile.y)) {
        result.push(obj);
      }
    });
    return result;
  }

  isTileFree(tile: { x: number; y: number }): boolean {
    return this.getActorsAtTile(tile).length === 0;
  }

  private destroy() {
    this.idActors.clear();
    this.ownedActors.clear();
    this.resourceSources.clear();
    this.resourceDrains.clear();
  }
}
