import { getSceneInitializers, getSceneService } from "../scenes/components/scene-component-helpers";
import { NavigationService } from "../scenes/services/navigation.service";
import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { filter, first } from "rxjs";
import { GameObjects } from "phaser";
import { SelectableComponent } from "../entity/actor/components/selectable-component";
import { IdComponent } from "../entity/actor/components/id-component";
import { getActorComponent } from "./actor-component";
import { RepresentableComponent } from "../entity/actor/components/representable-component";

export function getGameObjectBounds(gameObject?: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle | null {
  if (!gameObject) return null;
  // todo const representableComponent = getActorComponent(gameObject, RepresentableComponent);
  // todo if (representableComponent) {
  // todo   return new Phaser.Geom.Rectangle(
  // todo     representableComponent.worldTransform.x,
  // todo     representableComponent.worldTransform.y,
  // todo     representableComponent.width,
  // todo     representableComponent.height
  // todo   );
  // todo }
  const boundsComponent = gameObject as unknown as Phaser.GameObjects.Components.GetBounds;
  if (boundsComponent.getBounds === undefined) return null;
  return boundsComponent.getBounds();
}

export function getGameObjectDepth(gameObject: Phaser.GameObjects.GameObject): number | null {
  const depthComponent = gameObject as unknown as Phaser.GameObjects.Components.Depth;
  if (depthComponent.depth === undefined) return null;
  return depthComponent.depth;
}

export function getGameObjectTransform(gameObject?: Phaser.GameObjects.GameObject): Vector3Simple | null {
  if (!gameObject) return null;
  // todo const representableComponent = getActorComponent(gameObject, RepresentableComponent);
  // todo if (representableComponent) {
  // todo   return {
  // todo     x: representableComponent.worldTransform.x,
  // todo     y: representableComponent.worldTransform.y,
  // todo     z: representableComponent.worldTransform.z || 0 // Default z to 0 if not defined
  // todo   } satisfies Vector3Simple;
  // todo }
  const transformComponent = gameObject as unknown as Phaser.GameObjects.Components.Transform;
  if (transformComponent.x === undefined || transformComponent.y === undefined) return null;
  return transformComponent;
}

export function getGameObjectVisibility(
  gameObject: Phaser.GameObjects.GameObject
): Phaser.GameObjects.Components.Visible | null {
  // todo adjust this so it first tries to pull representable component and get visible from that - then adjust also health component etc to use this
  const visibilityComponent = gameObject as unknown as Phaser.GameObjects.Components.Visible;
  if (visibilityComponent.visible === undefined) return null;
  return visibilityComponent;
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

export function getSelectableGameObject(
  go: GameObjects.GameObject
): (GameObjects.GameObject & { selectableComponent: SelectableComponent; idComponent: IdComponent }) | null {
  const hasComp = !!getActorComponent(go, SelectableComponent) && !!getActorComponent(go, IdComponent);
  if (hasComp) return go as any;

  const parent = go.parentContainer;
  if (!parent) return null;
  return getSelectableGameObject(parent);
}

/**
 * Registers a callback to be executed when the scene is initialized.
 *
 * @param {Phaser.Scene} scene - The Phaser scene to monitor for initialization.
 * @param {() => void} callback - The callback function to execute once the scene is initialized.
 * @param {any} scope - The scope in which to call the callback function.
 * @param {number | null} [delay=0] - The delay in milliseconds before executing the callback. If null, the callback is executed immediately. Defaults to null.
 */
export function onSceneInitialized(scene: Phaser.Scene, callback: () => void, scope: any, delay: number | null = null) {
  getSceneInitializers(scene)
    .sceneInitialized.pipe(
      filter((created) => created),
      first()
    )
    .subscribe(() => {
      const executeCallback = () => {
        if (scene.time.now === 0 || scene.scene?.isActive() || scene.data.get("justCreated")) {
          callback.call(scope);
        } else {
          console.warn("Scene is not active when onSceneInitialized callback is called.");
        }
      };
      if (delay === null) {
        executeCallback();
      } else {
        setTimeout(() => {
          executeCallback();
        }, delay);
      }
    });
}

export function onGameObjectReady(
  gameObject: Phaser.GameObjects.GameObject,
  callback: () => void,
  scope: any,
  delay: number | null = 0
) {
  return onObjectReady(gameObject, callback, scope, delay);
}

/**
 * Waits until scene and gameObject are initialized and active, then executes the callback.
 */
export function onObjectReady(
  gameObject: Phaser.GameObjects.GameObject,
  callback: () => void,
  scope: any,
  delay: number | null = 0
) {
  const executeCallback = () => {
    if (delay === null) {
      callback.call(scope);
    } else {
      setTimeout(() => {
        if (!gameObject.active) return;
        callback.call(scope);
      }, delay);
    }
  };
  getSceneInitializers(gameObject.scene)
    .sceneInitialized.pipe(
      filter((created) => created),
      first()
    )
    .subscribe(() => {
      if (gameObject.active && gameObject.scene.sys.displayList.exists(gameObject)) {
        executeCallback();
      } else {
        gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => executeCallback());
      }
    });
}
