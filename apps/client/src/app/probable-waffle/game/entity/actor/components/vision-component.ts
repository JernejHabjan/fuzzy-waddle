import GameObject = Phaser.GameObjects.GameObject;
import { GameplayLibrary } from "../../../library/gameplay-library";
import Spawn from "../../../prefabs/buildings/misc/Spawn";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "./owner-component";

export interface VisionDefinition {
  range: number;
}

export class VisionComponent {
  constructor(
    private readonly gameObject: GameObject,
    private readonly visionDefinition: VisionDefinition
  ) {}

  isActorVisible(actor: GameObject): boolean {
    const distance = GameplayLibrary.getDistanceBetweenActors(this.gameObject, actor);
    if (distance === null) {
      return false;
    }
    return distance <= this.visionDefinition.range;
  }

  getVisibleHighValueResources(): GameObject[] {
    return []; // todo
  }

  getVisibleEnemies(): GameObject[] {
    const currentActorOwnerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const owner = currentActorOwnerComponent?.getOwner();
    if (!owner) return [];

    // todo this is expensive
    const tempEnemies = this.gameObject.scene.children.getChildren().filter((c) => {
      const ownerComponent = getActorComponent(c, OwnerComponent);
      const childOwner = ownerComponent?.getOwner();
      if (!childOwner) return false;
      return childOwner !== owner; // todo this is not respecting teams
    });

    // todo apply vision radius check here
    return tempEnemies as GameObject[];
  }
}
