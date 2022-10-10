export type TileCenterOptions = { centerSprite?: boolean; offset?: number } | null;
export enum SlopeDirection {
  NorthEast = 0,
  SouthEast = 1,
  SouthWest = 2,
  NorthWest = 3
}
export type TileLayerConfig = {
  tileIndex: number;
  // tile index in the layer (starting with 0)
  x: number;
  y: number;
  slopeDir?: SlopeDirection; // todo this needs to be extracted directly from atlas map
};

export interface TilePossibleProperties {
  stepHeight?: number;
  slopeDir?: SlopeDirection;
}
