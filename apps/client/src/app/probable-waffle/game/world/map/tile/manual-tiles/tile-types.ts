import { TileFrame } from "../../../../../gui/game-interface/editor-drawer/atlas-loader.service";
import { TileDefinitions } from "../../../const/map-size.info";

export class TileTypes {
  static getWalkableHeight0(frameWithMeta: TileFrame): boolean {
    return frameWithMeta.tileProperties.stepHeight === 0;
  }

  static getWalkableWater(frameWithMeta: TileFrame): boolean {
    return frameWithMeta.tileProperties.stepHeight === TileDefinitions.waterHeight;
  }

  static getWalkableHeightBlock(frameWithMeta: TileFrame): boolean {
    return (
      frameWithMeta.tileProperties.stepHeight !== undefined &&
      frameWithMeta.tileProperties.stepHeight !== null &&
      frameWithMeta.tileProperties.stepHeight > 0 &&
      frameWithMeta.tileProperties.slopeDir === undefined
    );
  }

  static getWalkableSlopes(frameWithMeta: TileFrame): boolean {
    return frameWithMeta.tileProperties.slopeDir !== undefined;
  }

  static getOtherTiles(frameWithMeta: TileFrame): boolean {
    return (
      !TileTypes.getWalkableHeight0(frameWithMeta) &&
      !TileTypes.getWalkableWater(frameWithMeta) &&
      !TileTypes.getWalkableHeightBlock(frameWithMeta) &&
      !TileTypes.getWalkableSlopes(frameWithMeta)
    );
  }
}
