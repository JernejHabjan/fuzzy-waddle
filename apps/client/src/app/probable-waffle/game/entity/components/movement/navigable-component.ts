import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";
import { NavigationService } from "../../../world/services/navigation.service";
import type { NavigablePath } from "./navigable-path";
import type { HeightDirectionPortDefinition, NavigableDefinition } from "./navigable-definition";

const ALL_DIRECTIONS_OPEN: Required<NavigablePath> = {
  top: true,
  bottom: true,
  left: true,
  right: true,
  topLeft: true,
  topRight: true,
  bottomLeft: true,
  bottomRight: true
};

export class NavigableComponent {
  /**
   * The navigable path definition that indicates from which sides this object can be approached.
   */
  private navigablePath: NavigablePath = ALL_DIRECTIONS_OPEN;
  private explicitNavigablePath = false;
  private directionPorts: Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>> = {};
  constructor(
    private readonly gameObject: GameObject,
    public readonly navigableDefinition: NavigableDefinition
  ) {
    this.directionPorts = navigableDefinition.directionPorts ?? {};
  }

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

  allowNavigablePath(
    approachableFrom: Partial<NavigablePath>,
    directionPorts?: Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>>
  ) {
    this.navigablePath = approachableFrom;
    this.explicitNavigablePath = true;
    if (directionPorts) this.directionPorts = directionPorts;
    this.gameObject.scene.events.emit(NavigationService.UpdateNavigationEvent);
  }

  get navigablePathDefinition(): NavigablePath {
    return this.navigablePath;
  }

  isDirectionOpen(direction: keyof NavigablePath): boolean {
    return !this.explicitNavigablePath || this.navigablePath[direction] === true;
  }

  /**
   * Returns the exact height gate for a side of this surface. Movement from one
   * tile to another is valid only when the source side's exitHeight equals the
   * target side's enterHeight.
   */
  getDirectionPort(direction: keyof NavigablePath): HeightDirectionPortDefinition | undefined {
    if (!this.isDirectionOpen(direction)) return undefined;
    const fallbackPort = {
      enterHeight: this.navigableDefinition.enterHeight ?? this.navigableDefinition.acceptMinimumHeight ?? 0,
      exitHeight: this.navigableDefinition.exitHeight ?? 0
    };
    return this.directionPorts[direction] ?? fallbackPort;
  }

  get accessibleFromAllSides(): boolean {
    if (!this.explicitNavigablePath) return true;
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
