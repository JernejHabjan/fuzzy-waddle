import type { TileAnimationData } from "./tileset-animation-data";

/**
 * Tileset-specific data per tile that are typically defined in the Tiled editor, e.g. within
 * the Tileset collision editor. This is where collision objects and terrain are stored.
 */
export type TilesetTileData = { [key: number]: { animation?: TileAnimationData } };
