import * as Phaser from 'phaser';
import { MapSizeInfo } from '../../const/map-size.info';

export class TilemapInputHandler {
  private input: Phaser.Input.InputPlugin;
  private tilemapLayer: Phaser.Tilemaps.TilemapLayer;
  private mapSizeInfo: MapSizeInfo;

  constructor(input: Phaser.Input.InputPlugin, tilemapLayer: Phaser.Tilemaps.TilemapLayer, mapSizeInfo: MapSizeInfo) {
    this.input = input;
    this.tilemapLayer = tilemapLayer;
    this.mapSizeInfo = mapSizeInfo;
    this.setupCursor();
  }

  private setupCursor() {
    let previousTile: Phaser.Tilemaps.Tile;
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      const { worldX, worldY } = pointer;

      const searchedWorldX = worldX - this.mapSizeInfo.tileWidth / 2;
      const searchedWorldY = worldY - this.mapSizeInfo.tileWidth / 2; // note tileWidth and not height

      const foundTile = this.tilemapLayer.getTileAtWorldXY(searchedWorldX, searchedWorldY) as Phaser.Tilemaps.Tile;

      if (previousTile) {
        previousTile.tint = 0xffffff;
      }
      if (foundTile) {
        previousTile = foundTile;
        foundTile.tint = 0xff0000;
        console.log('foundTile tile', foundTile.x, foundTile.y);
      }
    });
  }
  destroy() {
    this.input.off(Phaser.Input.Events.POINTER_UP);
  }
}
