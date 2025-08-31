import Phaser from "phaser";
import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectBounds, getGameObjectLogicalTransform } from "../data/game-object-helper";
import { environment } from "../../../../environments/environment";
import { drawDebugPoint } from "../debug/debug-point";
import { getActorComponent } from "../data/actor-component";
import { ColliderComponent } from "../entity/components/movement/collider-component";

export function getTileCoordsUnderObject(
  tilemap: Phaser.Tilemaps.Tilemap,
  gameObject: Phaser.GameObjects.GameObject
): Vector2Simple[] {
  const DEBUG = false;

  const bounds = getGameObjectBounds(gameObject);
  if (!bounds) return [];
  // pulling logical transform from the game object, so we know on which tile he is standing (z axis invariant)
  const logicalTransform = getGameObjectLogicalTransform(gameObject);
  if (!logicalTransform) return [];

  const reduction = getActorComponent(gameObject, ColliderComponent)?.colliderDefinition?.colliderFactorReduction ?? 0;

  const origin = {
    x: bounds.left + bounds.width / 2,
    y: logicalTransform.y
  };

  if (DEBUG) drawDebugPoint(gameObject.scene, origin, 0x0000ff);

  const logicalTileUnderOrigin = tilemap.getTileAtWorldXY(origin.x, origin.y + 32)!;
  if (DEBUG && logicalTileUnderOrigin && !environment.production) {
    logicalTileUnderOrigin.tint = 0x0000ff;
  }
  const nrOfTiles = (reduction ? bounds.width * reduction : bounds.width) / tilemap.tileWidth;
  const onEachSide = Math.floor(nrOfTiles / 2);

  const tileIndexes1: Vector2Simple[] = [];
  for (let i = -onEachSide; i <= onEachSide; i++) {
    for (let j = -onEachSide; j <= onEachSide; j++) {
      if (logicalTileUnderOrigin) {
        tileIndexes1.push({ x: logicalTileUnderOrigin.x + i, y: logicalTileUnderOrigin.y + j });
        if (DEBUG && !environment.production) {
          const tile = tilemap.getTileAt(logicalTileUnderOrigin.x + i, logicalTileUnderOrigin.y + j);
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
