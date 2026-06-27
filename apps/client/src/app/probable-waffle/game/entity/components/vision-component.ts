import GameObject = Phaser.GameObjects.GameObject;
import { DistanceHelper } from "../../library/distance-helper";
import { getActorComponent } from "../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { type VisionComponentData } from "@fuzzy-waddle/api-interfaces";
import type { VisionDefinition } from "./vision-definition";
import { IdComponent } from "./id-component";

export class VisionComponent {
  private visibleEnemies?: GameObject[];
  public visibilityByCurrentPlayer: boolean = false;
  public visionDefinition: VisionDefinition;

  constructor(
    private readonly gameObject: GameObject,
    initialVisionDefinition: VisionDefinition
  ) {
    this.visionDefinition = {
      ...initialVisionDefinition
    };
  }

  get range() {
    return this.visionDefinition.range;
  }

  isActorVisible(actor: GameObject): boolean {
    const distance = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, actor);
    if (distance === null) {
      return false;
    }
    return distance <= this.range;
  }

  getVisibleHighValueResources(): GameObject[] {
    return []; // todo
  }

  getVisibleEnemies(): GameObject[] {
    const currentActorOwnerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const owner = currentActorOwnerComponent?.getOwner();
    if (!owner) return [];

    // Use indexed enemy candidates to avoid expensive scene scans
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    const candidates = actorIndex ? actorIndex.getEnemyCandidates(this.gameObject) : [];

    const tempEnemies = candidates.filter((c) => {
      // within vision range
      return this.isActorVisible(c as GameObject);
    });

    this.visibleEnemies = tempEnemies as GameObject[];
    return this.visibleEnemies;
  }

  getClosestVisibleEnemy(): GameObject | null {
    const visibleEnemies = this.getVisibleEnemies();
    if (visibleEnemies.length === 0) return null;
    // find the closest enemy
    visibleEnemies.sort((a, b) => {
      return this.compareActorsByDistanceThenStableKey(a, b);
    });
    return visibleEnemies[0]!;
  }

  getVisibleFriendlies(): GameObject[] {
    const currentActorOwnerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const owner = currentActorOwnerComponent?.getOwner();
    if (owner === undefined) return [];

    // Use indexed owned actors to get friendlies
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    if (!actorIndex) return [];

    const ownedActors = actorIndex.getOwnedActors(owner);

    return ownedActors.filter((actor) => {
      if (actor === this.gameObject) return false; // exclude self
      return this.isActorVisible(actor);
    });
  }

  getClosestVisibleFriendly(): GameObject | null {
    const visibleFriendlies = this.getVisibleFriendlies();
    if (visibleFriendlies.length === 0) return null;
    // find the closest friendly
    visibleFriendlies.sort((a, b) => {
      return this.compareActorsByDistanceThenStableKey(a, b);
    });
    return visibleFriendlies[0]!;
  }

  private compareActorsByDistanceThenStableKey(a: GameObject, b: GameObject): number {
    const distanceA = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, a);
    const distanceB = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, b);
    const normalizedDistanceA = distanceA ?? Number.MAX_SAFE_INTEGER;
    const normalizedDistanceB = distanceB ?? Number.MAX_SAFE_INTEGER;
    if (normalizedDistanceA !== normalizedDistanceB) {
      return normalizedDistanceA - normalizedDistanceB;
    }
    // Deterministic tie-break so equal-distance target picks cannot diverge between peers.
    const idA = this.getStableActorSortKey(a);
    const idB = this.getStableActorSortKey(b);
    return idA.localeCompare(idB);
  }

  private getStableActorSortKey(actor: GameObject): string {
    return getActorComponent(actor, IdComponent)?.id ?? actor.name;
  }

  setData(data: Partial<VisionComponentData>) {
    if (data.visibilityByCurrentPlayer !== undefined) this.visibilityByCurrentPlayer = data.visibilityByCurrentPlayer;
  }

  getData(): VisionComponentData {
    return {
      visibilityByCurrentPlayer: this.visibilityByCurrentPlayer
    } satisfies VisionComponentData;
  }
}
