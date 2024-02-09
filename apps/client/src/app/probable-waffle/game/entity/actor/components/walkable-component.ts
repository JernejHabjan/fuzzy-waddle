import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";

export interface WalkableDefinition {
  shrinkPathToRight?: number;
  shrinkPathToLeft?: number;
}
export class WalkableComponent {
  constructor(
    private readonly gameObject: GameObject,
    public readonly walkableDefinition: WalkableDefinition
  ) {}

  static handleWalkable(gameObject: GameObject) {
    const walkableComponent = getActorComponent(gameObject, WalkableComponent);
    if (!walkableComponent) return { shrinkX: 0, shrinkY: 0 };
    const shrinkPathToRight = walkableComponent.walkableDefinition.shrinkPathToRight ?? 0;
    const shrinkX = shrinkPathToRight / 2;

    const shrinkPathToLeft = walkableComponent.walkableDefinition.shrinkPathToLeft ?? 0;
    const shrinkY = shrinkPathToLeft / 2;
    return { shrinkX, shrinkY };
  }
}
