import * as Phaser from 'phaser';
import { MapSizeInfo } from '../../const/map-size.info';
import { Subject } from 'rxjs';
import { ManualTile } from '../../manual-tiles/manual-tiles.helper';

export class ManualTileInputHandler {
  private input: Phaser.Input.InputPlugin;
  private tilemapLayer: Phaser.Tilemaps.TilemapLayer;
  private mapSizeInfo: MapSizeInfo;

  onTileSelected: Subject<ManualTile> = new Subject<ManualTile>();
  private manualLayers: ManualTile[][];

  constructor(
    input: Phaser.Input.InputPlugin,
    tilemapLayer: Phaser.Tilemaps.TilemapLayer,
    manualLayers: ManualTile[][],
    mapSizeInfo: MapSizeInfo
  ) {
    this.input = input;
    this.tilemapLayer = tilemapLayer;
    this.manualLayers = manualLayers;
    this.mapSizeInfo = mapSizeInfo;
    this.setupCursor();
  }

  private setupCursor() {
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      const { worldX, worldY } = pointer;

      const searchedWorldX = worldX - this.mapSizeInfo.tileWidth / 2;
      const searchedWorldY = worldY - this.mapSizeInfo.tileWidth / 2; // note tileWidth and not height

      const foundTile = this.getTileAtWorldXY(searchedWorldX, searchedWorldY);

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

  private getTileAtWorldXY(worldX: number, worldY: number): ManualTile | null {
    const pointerToTileXY = this.tilemapLayer.worldToTileXY(worldX, worldY, true);

    // search in all layers, starting from the last
    for (let i = this.manualLayers.length - 1; i >= 0; i--) {
      const layer = this.manualLayers[i];
      // search in the layer if tile x,y match the worldX, worldY
      for (let j = 0; j < layer.length; j++) {
        const tile = layer[j];

        if (tile.x - tile.clickableZ === pointerToTileXY.x && tile.y - tile.clickableZ === pointerToTileXY.y) {
          return tile;
        }
      }
    }
    return null;
  }

  destroy() {
    this.input.off(Phaser.Input.Events.POINTER_UP);
  }
}
