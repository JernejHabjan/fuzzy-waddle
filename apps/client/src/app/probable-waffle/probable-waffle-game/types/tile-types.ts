export type TileCenterOptions = { centerSprite?: boolean; offset?: number } | null;
export enum SlopeDirection {
  NorthEast = 0,
  SouthEast = 1,
  SouthWest = 2,
  NorthWest = 3
}
export type TileLayerConfig = {
  texture: string;
  frame: string;
  // tile index in the layer (starting with 0)
  x: number;
  y: number;
  slopeDir?: SlopeDirection;
};
