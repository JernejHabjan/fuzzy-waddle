import Phaser from "phaser";

/**
 * Tileset-specific data per tile that are typically defined in the Tiled editor, e.g. within
 * the Tileset collision editor. This is where collision objects and terrain are stored.
 */
type TilesetTileData = { [key: number]: { animation?: TileAnimationData } };

/**
 * Tile animation data created by Tiled program for animated tile. This can be
 * found in {@link TilesetTileData}.
 */
type TileAnimationData = Array<{ duration: number; tileid: number }>;

/**
 * Tile with animation.
 * @class
 * @classdesc
 * As of Phaser 3.23.0, animated tile is not supported. This is a simple implementation
 * of animating {@link Phaser.Tilemaps.Tile} and probably does not cover all
 * the edge cases. Assume the duration of animation is uniform for simplicity.
 *
 * Attribution: https://codesandbox.io/p/sandbox/tilemapscene-znjlr?file=%2Fscenes%2FTilemapScene.ts%3A153%2C55-153%2C72
 */
class AnimatedTile {
  // reference to the tilemap tile to animate
  private tile: Phaser.Tilemaps.Tile;

  // the data needed for animating the tile
  private tileAnimationData: TileAnimationData;

  // the starting index of the first tile index the tileset of the tile contains
  private readonly firstgid: number;

  // the elapsed time that loops between 0 and max animation duration
  private elapsedTime: number;

  // the length of animation in ms
  private readonly animationDuration: number;

  /**
   * @param {Phaser.Tilemaps.Tile} tile - the tile to animate
   * @param {TileAnimationData} tileAnimationData  - the animation data
   * @param {number} firstgid - the starting index of the first tile index the tileset of the tile contains
   */
  constructor(tile: Phaser.Tilemaps.Tile, tileAnimationData: TileAnimationData, firstgid: number) {
    this.tile = tile;
    this.tileAnimationData = tileAnimationData;
    this.firstgid = firstgid;
    this.elapsedTime = 0;
    // assuming the duration is uniform across all frames
    this.animationDuration = tileAnimationData[0].duration * tileAnimationData.length;
  }

  /**
   * Update the tile if necessary. This method should be called every frame.
   * @param {number} delta - the delta time in ms since the last frame
   */
  public update(delta: number): void {
    this.elapsedTime += delta;
    this.elapsedTime %= this.animationDuration;

    const animationFrameIndex = Math.floor(this.elapsedTime / this.tileAnimationData[0].duration);

    this.tile.index = this.tileAnimationData[animationFrameIndex].tileid + this.firstgid;
  }
}

export class AnimatedTilemap {
  private readonly animatedTiles: AnimatedTile[];

  constructor(
    private readonly tilemap: Phaser.Tilemaps.Tilemap,
    private readonly tileset: Phaser.Tilemaps.Tileset
  ) {
    this.animatedTiles = this.initAnimatedTiles();
  }

  initAnimatedTiles = () => {
    const animatedTiles: AnimatedTile[] = [];
    const tileData = this.tileset.tileData as TilesetTileData;
    for (const tileId in tileData) {
      this.tilemap.layers.forEach((layer) => {
        if (layer.tilemapLayer.type === "StaticTilemapLayer") return;
        layer.data.forEach((tileRow) =>
          tileRow.forEach((tile) => {
            // Typically `firstgid` is 1, which means tileId starts from 1.
            // TileId in Tiled starts from 0.
            if (tile.index - this.tileset.firstgid === parseInt(tileId, 10)) {
              if (!tileData[tileId].animation) return;
              animatedTiles.push(new AnimatedTile(tile, tileData[tileId].animation!, this.tileset.firstgid));
            }
          })
        );
      });
    }
    return animatedTiles;
  };

  update = (delta: number) => this.animatedTiles.forEach((tile) => tile.update(delta));
}
