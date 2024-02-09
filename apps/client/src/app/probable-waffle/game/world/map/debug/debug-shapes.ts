import { Geom, Scene } from "phaser";

export class DebugShapes {
  static drawDebugPolygon(scene: Scene, polygon: Geom.Polygon) {
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
