import Phaser from "phaser";
import type { TileAnimationData } from "./tileset-animation-data";

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
export class AnimatedTile {
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
    if (tileAnimationData.length === 0) {
      throw new Error("Tile animation data is empty");
    }
    this.animationDuration = tileAnimationData[0]!.duration * tileAnimationData.length;
  }

  /**
   * Update the tile if necessary. This method should be called every frame.
   * @param {number} delta - the delta time in ms since the last frame
   */
  public update(delta: number): void {
    this.elapsedTime += delta;
    this.elapsedTime %= this.animationDuration;

    const animationFrameIndex = Math.floor(this.elapsedTime / this.tileAnimationData[0]!.duration);

    this.tile.index = this.tileAnimationData[animationFrameIndex]!.tileid + this.firstgid;
  }
}
