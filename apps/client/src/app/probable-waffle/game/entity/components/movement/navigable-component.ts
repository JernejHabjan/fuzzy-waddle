import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";
import { NavigationService } from "../../../world/services/navigation.service";
import type { NavigablePath } from "./navigable-path";
import type { NavigableDefinition } from "./navigable-definition";

export class NavigableComponent {
  /**
   * The navigable path definition that indicates from which sides this object can be approached.
   */
  private navigablePath: NavigablePath = {
    top: false,
    bottom: false,
    left: false,
    right: false,
    topLeft: false,
    topRight: false,
    bottomLeft: false,
    bottomRight: false
  } satisfies NavigablePath;
  constructor(
    private readonly gameObject: GameObject,
    public readonly navigableDefinition: NavigableDefinition
  ) {}

  static handleNavigable(gameObject: GameObject) {
    const navigableComponent = getActorComponent(gameObject, NavigableComponent);
    if (!navigableComponent) return { shrinkX: 0, shrinkY: 0 };
    const shrinkPathToRight = navigableComponent.navigableDefinition.shrinkPathToRight ?? 0;
    const shrinkX = shrinkPathToRight / 2;

    const shrinkPathToLeft = navigableComponent.navigableDefinition.shrinkPathToLeft ?? 0;
    const shrinkY = shrinkPathToLeft / 2;
    return { shrinkX, shrinkY };
  }

  /**
   * Returns the height (in px) at which units should stand on this navigable object.
   * Defaults to 0 if not set.
   */
  getDestinationHeight(): number {
    return this.navigableDefinition.navigableHeight ?? 0;
  }

  allowNavigablePath(approachableFrom: Partial<NavigablePath>) {
    this.navigablePath = approachableFrom;
    this.gameObject.scene.events.emit(NavigationService.UpdateNavigationEvent);
  }

  get navigablePathDefinition(): NavigablePath {
    return this.navigablePath;
  }

  get accessibleFromAllSides(): boolean {
    return (
      (this.navigablePath.top ?? false) &&
      (this.navigablePath.bottom ?? false) &&
      (this.navigablePath.left ?? false) &&
      (this.navigablePath.right ?? false) &&
      (this.navigablePath.topLeft ?? false) &&
      (this.navigablePath.topRight ?? false) &&
      (this.navigablePath.bottomLeft ?? false) &&
      (this.navigablePath.bottomRight ?? false)
    );
  }
}
