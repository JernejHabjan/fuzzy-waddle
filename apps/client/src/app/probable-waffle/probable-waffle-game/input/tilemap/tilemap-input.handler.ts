import * as Phaser from 'phaser';
import { MapSizeInfo } from '../../const/map-size.info';
import { Subject } from 'rxjs';

export class TilemapInputHandler {
  private input: Phaser.Input.InputPlugin;
  private tilemapLayer: Phaser.Tilemaps.TilemapLayer;

  onTileSelected: Subject<Phaser.Tilemaps.Tile> = new Subject<Phaser.Tilemaps.Tile>();

  constructor(input: Phaser.Input.InputPlugin, tilemapLayer: Phaser.Tilemaps.TilemapLayer) {
    this.input = input;
    this.tilemapLayer = tilemapLayer;
    this.setupCursor();
  }

  private setupCursor() {
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      const { worldX, worldY } = pointer;

      const searchedWorldX = worldX - MapSizeInfo.info.tileWidthHalf;
      const searchedWorldY = worldY - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

      const foundTile = this.tilemapLayer.getTileAtWorldXY(searchedWorldX, searchedWorldY) as Phaser.Tilemaps.Tile;

      //if (previousTile) {
      //  previousTile.tint = 0xffffff;
      //}
      if (foundTile) {
        //foundTile.tint = 0xff0000;
        //console.log('foundTile tile', foundTile.x, foundTile.y);
        this.onTileSelected.next(foundTile);
      }
    });
  }
  destroy() {
    this.input.off(Phaser.Input.Events.POINTER_UP);
  }
}
