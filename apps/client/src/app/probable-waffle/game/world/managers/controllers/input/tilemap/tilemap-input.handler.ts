import * as Phaser from 'phaser';
import { Vector2Simple } from '../../../../../library/math/intersection';
import { TilePlacementWorldWithProperties } from '../../../../map/tile/manual-tiles/manual-tiles.helper';
import { MapSizeInfo } from '../../../../const/map-size.info';
import { IsoHelper } from '../../../../map/tile/iso-helper';
import { TileLayerProperties } from '../../../../map/tile/types/tile-types';

export interface TilePlacementData {
  tileXY: Vector2Simple;
  z: number;
}

export interface TileWorldData extends TilePlacementData {
  worldXY: Vector2Simple;
}

export class TilemapInputHandler {
  constructor(private readonly tilemapLayer: Phaser.Tilemaps.TilemapLayer) {}

  /**
   *
   * Returns true if the tile was found and selected
   */
  getTileFromTilemapOnWorldXY(worldXY: Vector2Simple): TilePlacementWorldWithProperties | null {
    const searchedWorldX = worldXY.x - MapSizeInfo.info.tileWidthHalf;
    const searchedWorldY = worldXY.y - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

    const tileXY = IsoHelper.isometricWorldToTileXY(searchedWorldX, searchedWorldY, true);

    const foundTile = this.tilemapLayer.getTileAt(tileXY.x, tileXY.y) as Phaser.Tilemaps.Tile;

    if (foundTile) {
      // foundTile.tint = 0xff0000;
      return {
        tileWorldData: {
          worldXY: { x: searchedWorldX, y: searchedWorldY },
          tileXY: { x: tileXY.x, y: tileXY.y },
          z: 0
        },
        tileLayerProperties: TilemapInputHandler.defaultTilemapLayerProperties
      };
    }
    return null;
  }

  static get defaultTilemapLayerProperties(): TileLayerProperties {
    return {
      tileIndex: 0,
      stepHeight: 0
    };
  }

  destroy() {
    // this.input.off(Phaser.Input.Events.POINTER_UP);
  }
}
