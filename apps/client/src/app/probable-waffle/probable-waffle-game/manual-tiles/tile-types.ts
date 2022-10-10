import { FrameWithMeta } from '../gui/editor-drawer/atlas-loader.service';

export class TileTypes {
  static getWalkableHeight0(frameWithMeta: FrameWithMeta): boolean {
    return frameWithMeta.tileProperties.stepHeight === 0;
  }

  static getWalkableWater(frameWithMeta: FrameWithMeta): boolean {
    return frameWithMeta.tileProperties.stepHeight === -16;
  }

  static getWalkableHeightBlock(frameWithMeta: FrameWithMeta): boolean {
    return (
      frameWithMeta.tileProperties.stepHeight !== undefined &&
      frameWithMeta.tileProperties.stepHeight !== null &&
      frameWithMeta.tileProperties.stepHeight > 0 &&
      frameWithMeta.tileProperties.slopeDir === undefined
    );
  }

  static getWalkableSlopes(frameWithMeta: FrameWithMeta): boolean {
    return frameWithMeta.tileProperties.slopeDir !== undefined;
  }

  static getOtherTiles(frameWithMeta: FrameWithMeta): boolean {
    return (
      !TileTypes.getWalkableHeight0(frameWithMeta) &&
      !TileTypes.getWalkableWater(frameWithMeta) &&
      !TileTypes.getWalkableHeightBlock(frameWithMeta) &&
      !TileTypes.getWalkableSlopes(frameWithMeta)
    );
  }
}
