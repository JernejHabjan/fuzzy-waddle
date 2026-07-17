import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { environment } from "@fuzzy-waddle/environments/environment";

export function drawDebugPoint(scene: Phaser.Scene, point: Vector2Simple, color: number = 0xff0000) {
  if (environment.production) return;
  const graphics = scene.add.graphics();
  graphics.fillStyle(color, 1);
  graphics.fillPoint(point.x, point.y, 5);
  graphics.depth = 100000;
  return graphics;
}
