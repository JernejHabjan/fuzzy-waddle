import GameObject = Phaser.GameObjects.GameObject;
import { GameplayLibrary } from "../../../library/gameplay-library";

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
}
