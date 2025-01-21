import { MapSizeInfo_old } from "../../../const/map-size.info_old";
import { SlopeDirection, TileLayerProperties } from "../types/tile-types";
import { TileWorldData_old } from "../../../managers/controllers/input/tilemap/tilemap-input.handler";
import { GameObjects, Geom } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export interface ManualTile extends TilePlacementWorldWithProperties {
  gameObjectImage: GameObjects.Image;

  // for stairs
  manualRectangleInputInterceptor: Geom.Polygon | null;
}

export interface TilePlacementWorldWithProperties {
  tileWorldData: TileWorldData_old;
  tileLayerProperties: TileLayerProperties;
}

export interface ManualTileLayer_old {
  z: number;
  tiles: ManualTile[];
}

export class ManualTilesHelper {
  constructor() {}

  static getDepth(tileXY: Vector2Simple, tileWorldXYCenter: Vector2Simple, layer: number): number {
    const layerOffset = layer * MapSizeInfo_old.info.tileHeight * 2;
    const ty = (tileXY.x + tileXY.y) * MapSizeInfo_old.info.tileHeightHalf;
    const depth = tileWorldXYCenter.y + ty + layerOffset;
    return depth;
  }

  /**
   * Slopes like stairs
   */
  private getSlopeDir(worldXY: Vector2Simple, slopeDir?: SlopeDirection): Geom.Polygon | null {
    const tileWidth = MapSizeInfo_old.info.tileWidth;
    let manualRectangleInputInterceptor: Geom.Polygon | null = null;
    switch (slopeDir) {
      case SlopeDirection.SouthEast:
        manualRectangleInputInterceptor = new Geom.Polygon([
          tileWidth / 2,
          0,
          0,
          tileWidth * 0.25,
          tileWidth / 2,
          tileWidth,
          tileWidth,
          tileWidth * 0.75
        ]);
        break;
      case SlopeDirection.SouthWest:
        manualRectangleInputInterceptor = new Geom.Polygon([
          tileWidth / 2,
          0,
          tileWidth,
          tileWidth * 0.25,
          tileWidth / 2,
          tileWidth,
          0,
          tileWidth * 0.75
        ]);
        break;
      case SlopeDirection.NorthWest:
      case SlopeDirection.NorthEast:
        throw new Error("Not implemented");
    }
    if (manualRectangleInputInterceptor !== null) {
      this.applyPositionModifierToRectangleInputInterceptor(worldXY, manualRectangleInputInterceptor);
    }
    return manualRectangleInputInterceptor;
  }

  /**
   * So click on the sloped tile is detected correctly
   */
  private applyPositionModifierToRectangleInputInterceptor(
    worldXY: Vector2Simple,
    manualRectangleInputInterceptor: Geom.Polygon
  ) {
    // displace the rectangle by world position
    for (let i = 0; i < manualRectangleInputInterceptor.points.length; i++) {
      manualRectangleInputInterceptor.points[i].x += worldXY.x;
      manualRectangleInputInterceptor.points[i].y += worldXY.y;
    }

    // displace the rectangle a bit to the left and top by center offset
    for (let i = 0; i < manualRectangleInputInterceptor.points.length; i++) {
      manualRectangleInputInterceptor.points[i].x -= MapSizeInfo_old.info.tileWidthHalf;
      manualRectangleInputInterceptor.points[i].y -= MapSizeInfo_old.info.tileHeight;
    }
  }
}
