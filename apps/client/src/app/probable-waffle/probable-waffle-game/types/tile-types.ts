export type TileCenterOptions = { centerOfTile?: boolean; offsetInPx?: number } | null;
export enum SlopeDirection {
  NorthEast = 0,
  SouthEast = 1,
  SouthWest = 2,
  NorthWest = 3
}

export interface TilePossibleProperties {
  stepHeight?: number;
  slopeDir?: SlopeDirection;

  /**
   * determines if tile has any transparent pixels in the base height.
   * If yes, we should not remove tilemap tile when placing this tile on it
   */
  fillsRootHeight?: boolean;
}

export interface TileIndexProperties {
  // tile index in the layer
  tileIndex: number;
}

export interface TileLayerProperties extends TilePossibleProperties, TileIndexProperties {}
