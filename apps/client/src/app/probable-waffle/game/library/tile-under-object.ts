import Phaser from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectBounds } from "../data/game-object-helper";
import { environment } from "../../../../environments/environment";
import { drawDebugPoint } from "../debug/debug-point";
import { getActorComponent } from "../data/actor-component";
import { ColliderComponent } from "../entity/actor/components/collider-component";

export function getTileIndexesUnderObject(
  tilemap: Phaser.Tilemaps.Tilemap,
  gameObject: Phaser.GameObjects.GameObject
): Vector2Simple[] {
  const DEBUG = false;

  const bounds = getGameObjectBounds(gameObject);
  if (!bounds) return [];

  const reduction = getActorComponent(gameObject, ColliderComponent)?.colliderDefinition?.colliderFactorReduction ?? 0;

  const origin = {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height - bounds.width / 4 + (bounds.width / 8) * reduction
  };

  if (DEBUG) drawDebugPoint(gameObject.scene, origin, 0x00ff00);

  const tileUnderOrigin = tilemap.getTileAtWorldXY(origin.x, origin.y + 32)!;
  if (DEBUG && tileUnderOrigin && !environment.production) {
    tileUnderOrigin.tint = 0x00ff00;
  }
  const nrOfTiles = (reduction ? bounds.width * reduction : bounds.width) / tilemap.tileWidth;
  const onEachSide = Math.floor(nrOfTiles / 2);

  const tileIndexes1: Vector2Simple[] = [];
  for (let i = -onEachSide; i <= onEachSide; i++) {
    for (let j = -onEachSide; j <= onEachSide; j++) {
      if (tileUnderOrigin) {
        tileIndexes1.push({ x: tileUnderOrigin.x + i, y: tileUnderOrigin.y + j });
      }
    }
  }
  return tileIndexes1;
}
