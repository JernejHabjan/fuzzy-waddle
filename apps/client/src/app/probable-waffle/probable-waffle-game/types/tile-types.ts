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
}

export interface TileIndexProperties {
  // tile index in the layer
  tileIndex: number;
}

export interface TileLayerProperties extends TilePossibleProperties, TileIndexProperties {}
