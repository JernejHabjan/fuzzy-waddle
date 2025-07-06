import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";

export interface WalkablePath {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  topLeft?: boolean;
  topRight?: boolean;
  bottomLeft?: boolean;
  bottomRight?: boolean;
}
export interface WalkableDefinition {
  shrinkPathToRight?: number;
  shrinkPathToLeft?: number;
  /**
   * The height (in px) at which units should stand when on this object (e.g., stairs, wall, watchtower).
   * For stairs, this could be the middle height; for a watchtower, the platform height, etc.
   */
  walkableHeight?: number;
}

export class WalkableComponent {
  private walkablePath: WalkablePath = {
    top: true,
    bottom: true,
    left: true,
    right: true,
    topLeft: true,
    topRight: true,
    bottomLeft: true,
    bottomRight: true
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
  }

  get walkablePathDefinition(): WalkablePath {
    return this.walkablePath;
  }

  get accessibleFromAllSides(): boolean {
    return (
      (this.walkablePath.top &&
        this.walkablePath.bottom &&
        this.walkablePath.left &&
        this.walkablePath.right &&
        this.walkablePath.topLeft &&
        this.walkablePath.topRight &&
        this.walkablePath.bottomLeft &&
        this.walkablePath.bottomRight) ??
      true
    );
  }
}
