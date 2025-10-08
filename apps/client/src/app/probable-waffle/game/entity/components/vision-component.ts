import GameObject = Phaser.GameObjects.GameObject;
import { DistanceHelper } from "../../library/distance-helper";
import { getActorComponent } from "../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { type VisionComponentData } from "@fuzzy-waddle/api-interfaces";

export interface VisionDefinition {
  range: number;
}

export class VisionComponent {
  private visibleEnemies?: GameObject[];
  public visibilityByCurrentPlayer: boolean = false;

  constructor(
    private readonly gameObject: GameObject,
    private readonly visionDefinition: VisionDefinition
  ) {}

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
      const distanceA = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, a);
      const distanceB = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, b);
      if (distanceA === null || distanceB === null) return 0;
      return distanceA - distanceB;
    });
    return visibleEnemies[0]!;
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
