import { MapSizeInfo } from '../const/map-size.info';
import { Vector2Simple } from '../math/intersection';

export class IsoHelper {
  static isometricWorldToTileXY(
    worldX: number,
    worldY: number,
    snapToFloor: boolean,
  ): Vector2Simple {
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
}
