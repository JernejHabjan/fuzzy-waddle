import { MapSizeInfo_old } from "../../../../const/map-size.info_old";
import { IsoHelper } from "../../../../map/tile/iso-helper";
import { TileLayerProperties } from "../../../../map/tile/types/tile-types";
import { Tilemaps } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export interface TilePlacementData_old {
  tileXY: Vector2Simple;
  z: number;
}

export interface TileWorldData_old extends TilePlacementData_old {
  worldXY: Vector2Simple;
}

export class TilemapInputHandler {
  constructor(private readonly tilemapLayer: Tilemaps.TilemapLayer) {}

  static get defaultTilemapLayerProperties(): TileLayerProperties {
    return {
      tileIndex: 0,
      stepHeight: 0
    };
  }

  /**
   *
   * Returns true if the tile was found and selected
   */
  getTileFromTilemapOnWorldXY(worldXY: Vector2Simple): any | null {
    const searchedWorldX = worldXY.x - MapSizeInfo_old.info.tileWidthHalf;
    const searchedWorldY = worldXY.y - MapSizeInfo_old.info.tileWidthHalf; // note tileWidth and not height

    const tileXY = IsoHelper.DEPRECATED_isometricWorldToTileXY(searchedWorldX, searchedWorldY, true);

    const foundTile = this.tilemapLayer.getTileAt(tileXY.x, tileXY.y) as Tilemaps.Tile;

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

  destroy() {
    // this.input.off(Phaser.Input.Events.POINTER_UP);
  }
}
