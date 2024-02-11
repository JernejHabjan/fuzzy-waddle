import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../scenes/components/scene-component-helpers";
import { NavigationService } from "../../scenes/services/navigation.service";
import { throttle } from "../../library/throttle";
import { DepthHelper } from "../../world/map/depth.helper";
import { getActorSystem } from "../../data/actor-system";
import { getGameObjectCurrentTile, getGameObjectTileInNavigableRadius } from "../../data/game-object-helper";
import Tween = Phaser.Tweens.Tween;

export interface PathMoveConfig {
  usePathfinding?: boolean;
  duration?: number;
  onUpdateThrottle?: number;
  onComplete?: () => void;
  onPathUpdate?: (newTileXY: Vector2Simple) => void;
  onUpdateThrottled?: () => void;
  onUpdate?: () => void;
  onStop?: () => void;
}

export class MovementSystem {
  private _navigationService?: NavigationService;
  private _currentTween?: Tween;
  private readonly DEBUG = false;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {}

  private get navigationService(): NavigationService | undefined {
    this._navigationService = this._navigationService ?? getSceneService(this.gameObject.scene, NavigationService);
    return this._navigationService;
  }

  async moveToLocation(vec3: Vector3Simple, pathMoveConfig?: PathMoveConfig): Promise<boolean> {
    if (pathMoveConfig?.usePathfinding === false) {
      return this.moveDirectlyToLocation(vec3, pathMoveConfig).then(() => true);
    }

    if (!this.navigationService) return false;

    const path = await this.navigationService.getPath(this.gameObject, vec3);
    if (!path) return false;

    if (this.DEBUG) console.log(`Moving to tile ${vec3.x}, ${vec3.y}`);

    if (this.DEBUG) this.navigationService.drawDebugPath(path);

    try {
      if (!path.length) return false;
      // Remove the first tile, as it's the current tile
      path.shift();
      await this.moveAlongPath(path, pathMoveConfig);
    } catch (e) {
      // console.error("Error moving along path", e);
      return false;
    }

    return true;
  }

  private async moveAlongPath(path: Vector2Simple[], config?: PathMoveConfig): Promise<void> {
    if (!path.length) return Promise.resolve();
    const nextTile = path.shift();
    if (!nextTile) return Promise.reject("No next tile to move to");
    const tileWorldXY = this.navigationService?.getTileWorldCenter(nextTile);
    if (!tileWorldXY) return Promise.reject("No tile world xy to move to");
    this.cancelMovement();
    config?.onPathUpdate?.(nextTile);
    const throttledTweenUpdate = config?.onUpdateThrottled
      ? throttle(config.onUpdateThrottled, config.onUpdateThrottle ?? 360)
      : undefined;

    return new Promise<void>((resolve, reject) => {
      this._currentTween = this.gameObject.scene.tweens.add({
        targets: this.gameObject,
        x: tileWorldXY.x,
        y: tileWorldXY.y,
        duration: config?.duration ?? 1000,
        onComplete: async () => {
          try {
            await this.moveAlongPath(path, config);
            config?.onComplete?.();
            resolve();
          } catch (e) {
            // console.error("Error moving along path", e);
            reject(e);
          }
        },
        onStop: () => {
          reject("Movement stopped");
          config?.onStop?.();
        },
        onUpdate: () => {
          this.throttledTweenUpdate();
          throttledTweenUpdate?.();
          config?.onUpdate?.();
        }
      });
    });
  }

  private tweenUpdate = () => {
    DepthHelper.setActorDepth(this.gameObject);
  };

  private throttledTweenUpdate = throttle(this.tweenUpdate, 360);

  cancelMovement() {
    this._currentTween?.stop();
  }

  private moveDirectlyToLocation(vec3: Vector3Simple, pathMoveConfig: PathMoveConfig): Promise<void> {
    // don't use pathfinding
    // use worldXY to move directly to location
    this.cancelMovement();
    const throttledTweenUpdate = pathMoveConfig?.onUpdateThrottled
      ? throttle(pathMoveConfig.onUpdateThrottled, pathMoveConfig.onUpdateThrottle ?? 360)
      : undefined;

    return new Promise<void>((resolve, reject) => {
      this._currentTween = this.gameObject.scene.tweens.add({
        targets: this.gameObject,
        x: vec3.x,
        y: vec3.y,
        duration: pathMoveConfig?.duration ?? 1000,
        onComplete: async () => {
          pathMoveConfig?.onComplete?.();
          resolve();
        },
        onStop: () => {
          pathMoveConfig?.onStop?.();
          reject("Movement stopped");
        },
        onUpdate: () => {
          this.throttledTweenUpdate();
          throttledTweenUpdate?.();
          pathMoveConfig?.onUpdate?.();
        }
      });
    });
  }
}

export async function moveGameObjectToRandomTileInNavigableRadius(
  gameObject: Phaser.GameObjects.GameObject,
  radius: number,
  pathMoveConfig?: PathMoveConfig
): Promise<void> {
  const movementSystem = getActorSystem<MovementSystem>(gameObject, MovementSystem);
  if (!movementSystem) return Promise.reject("No movement system found");
  const newTile = await getGameObjectTileInNavigableRadius(gameObject, radius);
  if (!newTile) {
    return Promise.reject("No new tile found");
  }
  await movementSystem.moveToLocation(
    {
      x: newTile.x,
      y: newTile.y,
      z: 0
    } satisfies Vector3Simple,
    pathMoveConfig
  );
}

export function getGameObjectDirection(
  gameObject: Phaser.GameObjects.GameObject,
  newTile: Vector2Simple
): "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest" | undefined {
  const currentTile = getGameObjectCurrentTile(gameObject);
  if (!currentTile) return;

  const navigationService = getSceneService(gameObject.scene, NavigationService);
  if (!navigationService) return;

  const currentTileWorldXY = navigationService.getTileWorldCenter(currentTile);
  const newTileWorldXY = navigationService.getTileWorldCenter(newTile);
  if (!newTileWorldXY) return;
  if (!currentTileWorldXY) return;

  // here we're comparing world coordinates to determine the direction. Iso tile coordinates produce different results
  const directionX = newTileWorldXY.x - currentTileWorldXY.x;
  const directionY = newTileWorldXY.y - currentTileWorldXY.y;

  return getDirectionFromDirectionVector(directionX, directionY);
}

export function getDirectionFromDirectionVector(
  directionX: number,
  directionY: number
): "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest" | undefined {
  if (directionX === 0 && directionY === 0) return "south"; // default to south if no direction

  const absX = Math.abs(directionX);
  const absY = Math.abs(directionY);

  if (absX > absY) {
    if (directionX > 0) {
      return "east";
    } else {
      return "west";
    }
  } else if (absX < absY) {
    if (directionY > 0) {
      return "south";
    } else {
      return "north";
    }
  } else {
    // absX === absY (diagonal)
    if (directionX > 0 && directionY > 0) {
      return "southeast";
    } else if (directionX < 0 && directionY > 0) {
      return "southwest";
    } else if (directionX > 0 && directionY < 0) {
      return "northeast";
    } else {
      return "northwest";
    }
  }
}
