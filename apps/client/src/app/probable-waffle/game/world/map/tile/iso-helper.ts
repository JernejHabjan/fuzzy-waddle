import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneComponent } from "../../../scenes/components/scene-component-helpers";
import { TilemapComponent } from "../../../scenes/components/tilemap.component";

export class IsoHelper {
  static isometricWorldToTileXY(
    scene: Phaser.Scene,
    worldX: number,
    worldY: number,
    snapToFloor: boolean = true
  ): Vector2Simple {
    const tileMapComponent = getSceneComponent(scene, TilemapComponent);
    if (!tileMapComponent) throw new Error("TilemapComponent not found in scene");

    const clickedTileXY = new Phaser.Math.Vector2();
    Phaser.Tilemaps.Components.IsometricWorldToTileXY(
      worldX,
      worldY,
      snapToFloor,
      clickedTileXY,
      scene.cameras.main,
      tileMapComponent.tilemap.layer
    );
    return { x: clickedTileXY.x, y: clickedTileXY.y };
  }
}
