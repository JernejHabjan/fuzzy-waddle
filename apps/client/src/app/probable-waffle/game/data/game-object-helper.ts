import { getSceneInitializers, getSceneService } from "../scenes/components/scene-component-helpers";
import { NavigationService } from "../scenes/services/navigation.service";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { filter, first } from "rxjs";
import SkaduweeOwl from "../prefabs/units/skaduwee/SkaduweeOwl";

export function getGameObjectBounds(gameObject: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle | null {
  const boundsComponent = gameObject as unknown as Phaser.GameObjects.Components.GetBounds;
  if (boundsComponent.getBounds === undefined) return null;
  return boundsComponent.getBounds();
}

export function getGameObjectDepth(gameObject: Phaser.GameObjects.GameObject): number | null {
  const depthComponent = gameObject as unknown as Phaser.GameObjects.Components.Depth;
  if (depthComponent.depth === undefined) return null;
  return depthComponent.depth;
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

export function getGameObjectCurrentTile(gameObject: Phaser.GameObjects.GameObject): Vector2Simple | undefined {
  const navigationService = getSceneService(gameObject.scene, NavigationService);
  if (!navigationService) return;

  return navigationService.getCenterTileCoordUnderObject(gameObject);
}

export function onScenePostCreate(scene: Phaser.Scene, callback: () => void, scope: any) {
  getSceneInitializers(scene)
    .postCreate.pipe(
      filter((created) => created),
      first()
    )
    .subscribe(() => callback.call(scope));
}
