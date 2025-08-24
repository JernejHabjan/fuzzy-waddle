import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/actor/components/id-component";
import { OwnerComponent } from "../../entity/actor/components/owner-component";
import { ResourceSourceComponent } from "../../entity/economy/resource/resource-source-component";
import { ResourceDrainComponent } from "../../entity/economy/resource/resource-drain-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../entity/combat/components/health-component";

export class ActorIndexSystem {
  // Scene event names IdComponent should emit
  static readonly RegisterActorEvent = "actor-index:register";
  static readonly UnregisterActorEvent = "actor-index:unregister";

  private readonly idActors = new Set<GameObject>();
  private readonly ownedActors = new Map<number, Set<GameObject>>();
  private readonly resourceSources = new Set<GameObject>();
  private readonly resourceDrains = new Set<GameObject>();

  constructor(private readonly scene: Phaser.Scene) {
    // Listen for IdComponent broadcasts (to be added in IdComponent init/destroy)
    scene.events.on(ActorIndexSystem.RegisterActorEvent, this.registerActor, this);
    scene.events.on(ActorIndexSystem.UnregisterActorEvent, this.unregisterActor, this);

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
      }

      if (getActorComponent(obj, ResourceSourceComponent)) {
        this.resourceSources.add(obj);
      }
      if (getActorComponent(obj, ResourceDrainComponent)) {
        this.resourceDrains.add(obj);
      }

      // Auto-unregister on destroy
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
      }

      this.resourceSources.delete(obj);
      this.resourceDrains.delete(obj);
    }
  };

  // One-time population (useful after initial actor creation)
  scanExistingActors(): void {
    this.scene.children.list.forEach((child) => this.registerActor(child as GameObject));
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

  getOwnedActors(ownerNumber?: number): GameObject[] {
    if (ownerNumber === undefined) return [];
    const set = this.ownedActors.get(ownerNumber);
    return set ? Array.from(set) : [];
  }

  getResourceSourcesFiltered(type?: ResourceType): GameObject[] {
    const list = Array.from(this.resourceSources);
    if (type === undefined) return list;
    return list.filter((go) => {
      const src = getActorComponent(go, ResourceSourceComponent);
      return !!src && src.getResourceType() === type;
    });
  }

  getResourceDrainsFiltered(ownerNumber?: number, type?: ResourceType): GameObject[] {
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

  private destroy() {
    this.scene?.events.off(ActorIndexSystem.RegisterActorEvent, this.registerActor, this);
    this.scene?.events.off(ActorIndexSystem.UnregisterActorEvent, this.unregisterActor, this);

    this.idActors.clear();
    this.ownedActors.clear();
    this.resourceSources.clear();
    this.resourceDrains.clear();
  }
}
