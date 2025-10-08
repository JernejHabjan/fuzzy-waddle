import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../environments/environment";
import { drawDebugPoint } from "./debug-point";
import { NavigationService } from "../world/services/navigation.service";

export function drawDebugPath(scene: Phaser.Scene, tilemap: Phaser.Tilemaps.Tilemap, path: Vector2Simple[]) {
  if (environment.production) return;
  if (path.length === 0) return;

  // draw straight line from start to end colored red
  let graphics = scene.add.graphics();
  graphics.lineStyle(2, 0xff0000, 1);
  graphics.beginPath();

  let tileCenter = NavigationService.getTileWorldCenter(tilemap, path[0]!)!;
  drawDebugPoint(scene, tileCenter, 0x00ff00);
  graphics.moveTo(tileCenter.x, tileCenter.y);
  tileCenter = NavigationService.getTileWorldCenter(tilemap, path[path.length - 1]!)!;
  graphics.lineTo(tileCenter.x, tileCenter.y);
  graphics.strokePath();

  // draw phaser line from one point to the next
  graphics = scene.add.graphics();
  graphics.lineStyle(2, 0xffffff, 1);
  graphics.beginPath();
  tileCenter = NavigationService.getTileWorldCenter(tilemap, path[0]!)!;
  graphics.moveTo(tileCenter.x, tileCenter.y);

  const allTileWorldXYCentersWithoutFirst = path.map((path) => NavigationService.getTileWorldCenter(tilemap, path)!);
  allTileWorldXYCentersWithoutFirst.shift();

  for (let i = 0; i < path.length - 1; i++) {
    tileCenter = allTileWorldXYCentersWithoutFirst[i]!;
    graphics.lineTo(tileCenter.x, tileCenter.y);
  }
  drawDebugPoint(scene, tileCenter, 0x0000ff);

  graphics.strokePath();
}
