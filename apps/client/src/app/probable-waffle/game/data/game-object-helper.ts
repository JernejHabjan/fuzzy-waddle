import { getSceneInitializers, getSceneService } from "../scenes/components/scene-component-helpers";
import { NavigationService } from "../scenes/services/navigation.service";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { filter, first } from "rxjs";

export function getGameObjectBounds(gameObject?: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle | null {
  if (!gameObject) return null;
  const boundsComponent = gameObject as unknown as Phaser.GameObjects.Components.GetBounds;
  if (boundsComponent.getBounds === undefined) return null;
  return boundsComponent.getBounds();
}

export function getGameObjectDepth(gameObject: Phaser.GameObjects.GameObject): number | null {
  const depthComponent = gameObject as unknown as Phaser.GameObjects.Components.Depth;
  if (depthComponent.depth === undefined) return null;
  return depthComponent.depth;
}

export function getGameObjectTransform(
  gameObject?: Phaser.GameObjects.GameObject
): Phaser.GameObjects.Components.Transform | null {
  if (!gameObject) return null;
  const transformComponent = gameObject as unknown as Phaser.GameObjects.Components.Transform;
  if (transformComponent.x === undefined || transformComponent.y === undefined) return null;
  return transformComponent;
}

export async function getGameObjectTileInNavigableRadius(
  gameObject: Phaser.GameObjects.GameObject,
  radius: number
): Promise<Vector2Simple | undefined> {
  const navigationService = getSceneService(gameObject.scene, NavigationService);
  if (!navigationService) throw new Error("NavigationService not found");

  const currentTile = getGameObjectCurrentTile(gameObject);
  if (!currentTile) return;
  return await navigationService.randomTileInNavigableRadius(currentTile, radius);
}

export async function getClosestWalkableTileBetweenGameObjectsInRadius(
  gameObject: Phaser.GameObjects.GameObject,
  destinationGameObject: Phaser.GameObjects.GameObject,
  radius: number
): Promise<Vector2Simple | undefined> {
  const navigationService = getSceneService(gameObject.scene, NavigationService);
  if (!navigationService) throw new Error("NavigationService not found");
  return navigationService.closestWalkableTileBetweenGameObjectsInRadius(gameObject, destinationGameObject, radius);
}

export function getGameObjectTileInRadius(
  gameObject: Phaser.GameObjects.GameObject,
  radius: number
): Vector2Simple | undefined {
  const navigationService = getSceneService(gameObject.scene, NavigationService);
  if (!navigationService) throw new Error("NavigationService not found");

  const currentTile = getGameObjectCurrentTile(gameObject);
  if (!currentTile) return;
  return navigationService.randomTileInRadius(currentTile, radius);
}

export function getGameObjectCurrentTile(gameObject: Phaser.GameObjects.GameObject): Vector2Simple | undefined {
  const navigationService = getSceneService(gameObject.scene, NavigationService);
  if (!navigationService) return;

  return navigationService.getCenterTileCoordUnderObject(gameObject);
}

/**
 * Registers a callback to be executed when the scene is initialized.
 *
 * @param {Phaser.Scene} scene - The Phaser scene to monitor for initialization.
 * @param {() => void} callback - The callback function to execute once the scene is initialized.
 * @param {any} scope - The scope in which to call the callback function.
 * @param {number | null} [delay=0] - The delay in milliseconds before executing the callback. If null, the callback is executed immediately. Defaults to 0, so scene callback is async broadcast after all components register completely on main thread.
 */
export function onSceneInitialized(scene: Phaser.Scene, callback: () => void, scope: any, delay: number | null = 0) {
  getSceneInitializers(scene)
    .sceneInitialized.pipe(
      filter((created) => created),
      first()
    )
    .subscribe(() => {
      if (delay === null) {
        callback.call(scope);
      } else {
        setTimeout(() => callback.call(scope), delay);
      }
    });
}
