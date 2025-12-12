import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneComponent } from "../services/scene-component-helpers";
import { TilemapComponent } from "./tilemap.component";

export class IsoHelper {
  static isometricWorldToTileXY(
    scene: Phaser.Scene,
    worldX: number,
    worldY: number,
    snapToFloor: boolean = true,
    ceil: boolean = true
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

    if (ceil) {
      // for some reason we need to ceil the clicked tile - its not ok if se set snapToFloor to true
      clickedTileXY.x = Math.ceil(clickedTileXY.x);
      clickedTileXY.y = Math.ceil(clickedTileXY.y);
    }

    return { x: clickedTileXY.x, y: clickedTileXY.y };
  }

  static isometricTileToWorldXY(scene: Phaser.Scene, tileX: number, tileY: number): Vector2Simple | null {
    const tileMapComponent = getSceneComponent(scene, TilemapComponent);
    if (!tileMapComponent) throw new Error("TilemapComponent not found in scene");

    const worldXY = new Phaser.Math.Vector2();
    return tileMapComponent.tilemap.tileToWorldXY(tileX, tileY);
  }
}
