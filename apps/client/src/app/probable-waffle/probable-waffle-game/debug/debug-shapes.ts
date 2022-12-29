import { Vector2Simple } from '../math/intersection';
import * as Phaser from 'phaser';
import { Scene } from 'phaser';

export class DebugShapes {
  static drawDebugPoint(scene: Scene, clickPoint: Vector2Simple) {
    const graphics = scene.add.graphics({ x: 0, y: 0 });

    graphics.lineStyle(2, 0x00ff00);

    graphics.beginPath();

    graphics.moveTo(clickPoint.x, clickPoint.y);

    graphics.lineTo(clickPoint.x + 1, clickPoint.y + 1);

    graphics.closePath();
    graphics.strokePath();
    graphics.depth = 1001;
  }

  static drawDebugPolygon(scene: Scene, polygon: Phaser.Geom.Polygon) {
    const graphics = scene.add.graphics({ x: 0, y: 0 });

    graphics.lineStyle(2, 0xff0000);

    graphics.beginPath();

    graphics.moveTo(polygon.points[0].x, polygon.points[0].y);

    for (let i = 1; i < polygon.points.length; i++) {
      graphics.lineTo(polygon.points[i].x, polygon.points[i].y);
    }
    graphics.closePath();
    graphics.strokePath();
    graphics.depth = 10000;
  }
}
