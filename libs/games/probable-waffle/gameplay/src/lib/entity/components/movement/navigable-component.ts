type GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../combat/components/health-component";
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
    this.gameObject.once(HealthComponent.KilledEvent, this.handleKilled, this);
  }

  static handleNavigable(gameObject: GameObject) {
    const navigableComponent = getActorComponent(gameObject, NavigableComponent);
    if (!navigableComponent) return { shrinkX: 0, shrinkY: 0 };
    // Shrink values are authored across the whole prefab footprint, so convert
    // them to per-side trimming before filtering walkable tiles.
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
    // Skip rebuilds when neighbor refreshes produce the same directional contract.
    const nextDirectionPorts = directionPorts ?? this.directionPorts;
    if (
      this.explicitNavigablePath &&
      areNavigablePathsEqual(this.navigablePath, approachableFrom) &&
      areDirectionPortsEqual(this.directionPorts, nextDirectionPorts)
    ) {
      return;
    }
    this.navigablePath = approachableFrom;
    this.explicitNavigablePath = true;
    this.directionPorts = nextDirectionPorts;
    this.gameObject.scene.events.emit(NavigationService.UpdateNavigationEvent);
  }

  /**
   * Closed directions are enforced only after a prefab explicitly sets its
   * path. Untouched navigables remain open on all sides for compatibility.
   */
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

  private handleKilled(): void {
    // Killed navigable structures stop contributing height cells immediately;
    // the graph builder also filters them out during the rebuild.
    this.gameObject.scene.events.emit(NavigationService.UpdateNavigationEvent);
  }
}

function areNavigablePathsEqual(left: Partial<NavigablePath>, right: Partial<NavigablePath>): boolean {
  return (
    (left.top === true) === (right.top === true) &&
    (left.bottom === true) === (right.bottom === true) &&
    (left.left === true) === (right.left === true) &&
    (left.right === true) === (right.right === true) &&
    (left.topLeft === true) === (right.topLeft === true) &&
    (left.topRight === true) === (right.topRight === true) &&
    (left.bottomLeft === true) === (right.bottomLeft === true) &&
    (left.bottomRight === true) === (right.bottomRight === true)
  );
}

/**
 * Compares per-direction height ports so navigable updates can avoid emitting a
 * graph rebuild when nothing semantically changed.
 */
function areDirectionPortsEqual(
  left: Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>>,
  right: Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>>
): boolean {
  // noinspection JSSuspiciousNameCombination
  return (
    areDirectionPortDefinitionsEqual(left.top, right.top) &&
    areDirectionPortDefinitionsEqual(left.bottom, right.bottom) &&
    areDirectionPortDefinitionsEqual(left.left, right.left) &&
    areDirectionPortDefinitionsEqual(left.right, right.right) &&
    areDirectionPortDefinitionsEqual(left.topLeft, right.topLeft) &&
    areDirectionPortDefinitionsEqual(left.topRight, right.topRight) &&
    areDirectionPortDefinitionsEqual(left.bottomLeft, right.bottomLeft) &&
    areDirectionPortDefinitionsEqual(left.bottomRight, right.bottomRight)
  );
}

/**
 * Treats missing directional ports distinctly from defined ports so closed or
 * fallback sides are not mistaken for exact height matches.
 */
function areDirectionPortDefinitionsEqual(
  left?: HeightDirectionPortDefinition,
  right?: HeightDirectionPortDefinition
): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.enterHeight === right.enterHeight && left.exitHeight === right.exitHeight;
}
