export type TileCenterOptions = { centerSprite?: boolean; offset?: number } | null;
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

// export interface TileLayerProperties extends TilePossibleProperties{
//   // tile index in the layer
//   // todo  ? tileIndex: number;
// }
