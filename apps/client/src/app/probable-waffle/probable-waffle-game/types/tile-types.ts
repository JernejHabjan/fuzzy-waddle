export type TileCenterOptions = { centerSprite?: boolean; offset?: number } | null;
export enum SlopeDirection {
  NorthEast = 0,
  SouthEast = 1,
  SouthWest = 2,
  NorthWest = 3
}
export type TileLayerConfig = {
  // tile index in the layer
  tileIndex: number;
  tileX: number;
  tileY: number;
  slopeDir?: SlopeDirection; // todo this needs to be extracted directly from atlas map
};

export interface TilePossibleProperties {
  stepHeight?: number;
  slopeDir?: SlopeDirection;
}
