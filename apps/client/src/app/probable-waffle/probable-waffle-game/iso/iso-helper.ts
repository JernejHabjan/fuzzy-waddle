import { MapSizeInfo } from '../const/map-size.info';
import { Vector2Simple } from '../math/intersection';

export class IsoHelper {
  static isometricWorldToTileXY(worldX: number, worldY: number, snapToFloor: boolean): Vector2Simple {
    const tileWidthHalf = MapSizeInfo.info.tileWidthHalf;
    const tileHeightHalf = MapSizeInfo.info.tileHeightHalf;

    const x = snapToFloor
      ? Math.floor((worldX / tileWidthHalf + worldY / tileHeightHalf) / 2)
      : (worldX / tileWidthHalf + worldY / tileHeightHalf) / 2;
    const y = snapToFloor
      ? Math.floor((worldY / tileHeightHalf - worldX / tileWidthHalf) / 2)
      : (worldY / tileHeightHalf - worldX / tileWidthHalf) / 2;

    return { x, y };
  }

  static isometricTileToWorldXY(tileX: number, tileY: number): Vector2Simple {
    const x = (tileX - tileY) * MapSizeInfo.info.tileWidthHalf;
    const y = (tileX + tileY) * MapSizeInfo.info.tileHeightHalf;

    return { x, y };
  }

  static getLeft(tileX: number, tileY: number): number {
    const point = IsoHelper.isometricTileToWorldXY(tileX, tileY);
    return point.x;
  }

  static getRight(tileX: number, tileY: number): number {
    return IsoHelper.getLeft(tileX, tileY) + MapSizeInfo.info.tileWidth;
  }

  static getTop(tileX: number, tileY: number): number {
    const point = IsoHelper.isometricTileToWorldXY(tileX, tileY);
    return point.y;
  }

  static getBottom(tileX: number, tileY: number): number {
    return IsoHelper.getTop(tileX, tileY) + MapSizeInfo.info.tileHeight *2;
  }

  static getCenterX(tileX: number, tileY: number): number {
    return (IsoHelper.getLeft(tileX, tileY) + IsoHelper.getRight(tileX, tileY)) / 2;
  }
  static getCenterY(tileX: number, tileY: number): number {
    return (IsoHelper.getTop(tileX, tileY) + IsoHelper.getBottom(tileX, tileY)) / 2;
  }
}
