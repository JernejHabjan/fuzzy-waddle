import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";
import { NavigationService } from "../../../world/services/navigation.service";
import type { WalkablePath } from "./walkable-path";
import type { WalkableDefinition } from "./walkable-definition";

export class WalkableComponent {
  /**
   * The walkable path definition that indicates from which sides this object can be approached.
   */
  private walkablePath: WalkablePath = {
    top: false,
    bottom: false,
    left: false,
    right: false,
    topLeft: false,
    topRight: false,
    bottomLeft: false,
    bottomRight: false
  } satisfies WalkablePath;
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

  /**
   * Returns the height (in px) at which units should stand on this walkable object.
   * Defaults to 0 if not set.
   */
  getDestinationHeight(): number {
    return this.walkableDefinition.walkableHeight ?? 0;
  }

  allowWalkablePath(approachableFrom: Partial<WalkablePath>) {
    this.walkablePath = approachableFrom;
    this.gameObject.scene.events.emit(NavigationService.UpdateNavigationEvent);
  }

  get walkablePathDefinition(): WalkablePath {
    return this.walkablePath;
  }

  get accessibleFromAllSides(): boolean {
    return (
      (this.walkablePath.top ?? false) &&
      (this.walkablePath.bottom ?? false) &&
      (this.walkablePath.left ?? false) &&
      (this.walkablePath.right ?? false) &&
      (this.walkablePath.topLeft ?? false) &&
      (this.walkablePath.topRight ?? false) &&
      (this.walkablePath.bottomLeft ?? false) &&
      (this.walkablePath.bottomRight ?? false)
    );
  }
}
