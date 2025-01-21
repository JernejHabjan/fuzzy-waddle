import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { MapSizeInfo_old } from "../../const/map-size.info_old";

export class IsoHelper {
  /**
   * @deprecated USE RATHER Phaser.Tilemaps.Components.IsometricWorldToTileXY
   */
  static DEPRECATED_isometricWorldToTileXY(worldX: number, worldY: number, snapToFloor: boolean): Vector2Simple {
    const tileWidthHalf = MapSizeInfo_old.info.tileWidthHalf;
    const tileHeightHalf = MapSizeInfo_old.info.tileHeightHalf;

    const x = snapToFloor
      ? Math.floor((worldX / tileWidthHalf + worldY / tileHeightHalf) / 2)
      : (worldX / tileWidthHalf + worldY / tileHeightHalf) / 2;
    const y = snapToFloor
      ? Math.floor((worldY / tileHeightHalf - worldX / tileWidthHalf) / 2)
      : (worldY / tileHeightHalf - worldX / tileWidthHalf) / 2;

    return { x, y };
  }

  static isometricTileToWorldXY(tileXY: Vector2Simple): Vector2Simple {
    const x = (tileXY.x - tileXY.y) * MapSizeInfo_old.info.tileWidthHalf;
    const y = (tileXY.x + tileXY.y) * MapSizeInfo_old.info.tileHeightHalf;

    return { x, y };
  }

  static getWorldLeft(tileXY: Vector2Simple): number {
    const point = IsoHelper.isometricTileToWorldXY(tileXY);
    return point.x;
  }

  static getWorldRight(tileXY: Vector2Simple): number {
    return IsoHelper.getWorldLeft(tileXY) + MapSizeInfo_old.info.tileWidth;
  }

  static getWorldTop(tileXY: Vector2Simple): number {
    const point = IsoHelper.isometricTileToWorldXY(tileXY);
    return point.y;
  }

  static getWorldBottom(tileXY: Vector2Simple): number {
    return IsoHelper.getWorldTop(tileXY) + MapSizeInfo_old.info.tileHeight * 2;
  }

  static getWorldCenterX(tileXY: Vector2Simple): number {
    return (IsoHelper.getWorldLeft(tileXY) + IsoHelper.getWorldRight(tileXY)) / 2;
  }

  static getWorldCenterY(tileXY: Vector2Simple): number {
    return (IsoHelper.getWorldTop(tileXY) + IsoHelper.getWorldBottom(tileXY)) / 2;
  }

  static getWorldCenterXY(tileXY: Vector2Simple): Vector2Simple {
    return {
      x: IsoHelper.getWorldCenterX(tileXY),
      y: IsoHelper.getWorldCenterY(tileXY)
    };
  }
}
