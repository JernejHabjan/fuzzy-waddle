import * as Phaser from 'phaser';
import { MapSizeInfo } from '../../const/map-size.info';
import { IsoHelper } from '../../iso/iso-helper';
import { Vector2Simple } from '../../math/intersection';

export interface TilePlacementData {
  tileXY: Vector2Simple;
  index: number;
  z: number;
}

export interface TileWorldData extends TilePlacementData {
  worldXY: Vector2Simple;
}

export class TilemapInputHandler {
  private input: Phaser.Input.InputPlugin;
  private tilemapLayer: Phaser.Tilemaps.TilemapLayer;

  // onTileSelected: Subject<TileSelectedData> = new Subject<TileSelectedData>();

  constructor(input: Phaser.Input.InputPlugin, tilemapLayer: Phaser.Tilemaps.TilemapLayer) {
    this.input = input;
    this.tilemapLayer = tilemapLayer;
  }

  /**
   *
   * Returns true if the tile was found and selected
   */
  getTileFromTilemapOnWorldXY(worldXY:Vector2Simple): TileWorldData | null {
    const searchedWorldX = worldXY.x - MapSizeInfo.info.tileWidthHalf;
    const searchedWorldY = worldXY.y - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

    const tileXY = IsoHelper.isometricWorldToTileXY(searchedWorldX, searchedWorldY, true);

    // todo replace this with static FN from LayerHelper
    const foundTile = this.tilemapLayer.getTileAt(tileXY.x, tileXY.y) as Phaser.Tilemaps.Tile;

    //if (previousTile) {
    //  previousTile.tint = 0xffffff;
    //}
    if (foundTile) {
      // foundTile.tint = 0xff0000;
      //console.log('foundTile tile', foundTile.x, foundTile.y);
      return {
        worldXY: { x: searchedWorldX, y: searchedWorldY },
        tileXY: { x: tileXY.x, y: tileXY.y },
        z: 0,
        index: foundTile.index
      };
    }
    return null;
  }
  destroy() {
    // this.input.off(Phaser.Input.Events.POINTER_UP);
  }
}
