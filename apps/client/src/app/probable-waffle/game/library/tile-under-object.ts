import Phaser from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectBounds, getGameObjectTransform } from "../data/game-object-helper";
import { environment } from "../../../../environments/environment";
import { drawDebugPoint } from "../debug/debug-point";
import { getActorComponent } from "../data/actor-component";
import { ColliderComponent } from "../entity/actor/components/collider-component";

export function getTileCoordsUnderObject(
  tilemap: Phaser.Tilemaps.Tilemap,
  gameObject: Phaser.GameObjects.GameObject
): Vector2Simple[] {
  const DEBUG = false;

  const bounds = getGameObjectBounds(gameObject);
  if (!bounds) return [];
  const transform = getGameObjectTransform(gameObject);
  if (!transform) return [];

  const reduction = getActorComponent(gameObject, ColliderComponent)?.colliderDefinition?.colliderFactorReduction ?? 0;

  const origin = {
    x: bounds.left + bounds.width / 2,
    y: transform.y
  };

  if (DEBUG) drawDebugPoint(gameObject.scene, origin, 0x0000ff);

  const tileUnderOrigin = tilemap.getTileAtWorldXY(origin.x, origin.y + 32)!;
  if (DEBUG && tileUnderOrigin && !environment.production) {
    tileUnderOrigin.tint = 0x0000ff;
  }
  const nrOfTiles = (reduction ? bounds.width * reduction : bounds.width) / tilemap.tileWidth;
  const onEachSide = Math.floor(nrOfTiles / 2);

  const tileIndexes1: Vector2Simple[] = [];
  for (let i = -onEachSide; i <= onEachSide; i++) {
    for (let j = -onEachSide; j <= onEachSide; j++) {
      if (tileUnderOrigin) {
        tileIndexes1.push({ x: tileUnderOrigin.x + i, y: tileUnderOrigin.y + j });
        if (DEBUG && !environment.production) {
          const tile = tilemap.getTileAt(tileUnderOrigin.x + i, tileUnderOrigin.y + j);
          if (tile) {
            tile.tint = 0x0000ff;
          }
        }
      }
    }
  }
  return tileIndexes1;
}

export function getCenterTileCoordUnderObject(
  tilemap: Phaser.Tilemaps.Tilemap,
  gameObject: Phaser.GameObjects.GameObject
): Vector2Simple | undefined {
  const coords = getTileCoordsUnderObject(tilemap, gameObject);
  if (coords.length === 0) return;

  if (coords.length === 0) return; // No tiles found

  // Calculate average x and y coordinates
  let totalX = 0;
  let totalY = 0;
  for (const coord of coords) {
    totalX += coord.x;
    totalY += coord.y;
  }

  const middleX = Math.floor(totalX / coords.length);
  const middleY = Math.floor(totalY / coords.length);

  return { x: middleX, y: middleY };
}
