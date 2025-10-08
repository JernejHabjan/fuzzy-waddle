import Phaser from "phaser";
import type { TilesetTileData } from "./tileset-tile-data";
import { AnimatedTile } from "./animated-tile";

export class AnimatedTilemap {
  private readonly animatedTiles: AnimatedTile[];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap,
    private readonly tilesets: Phaser.Tilemaps.Tileset[]
  ) {
    this.animatedTiles = this.initAnimatedTiles();
    this.scene.events.on("update", this.update);
    this.scene.events.on("shutdown", this.destroy);
  }

  private initAnimatedTiles = () => {
    const animatedTiles: AnimatedTile[] = [];
    const tileset = this.relevantTileset;
    const tileData = tileset.tileData as TilesetTileData;
    for (const tileId in tileData) {
      this.tilemap.layers.forEach((layer) => {
        if (layer.tilemapLayer.type === "StaticTilemapLayer") return;
        layer.data.forEach((tileRow) =>
          tileRow.forEach((tile) => {
            // Typically `firstgid` is 1, which means tileId starts from 1.
            // TileId in Tiled starts from 0.
            if (tile.index - tileset.firstgid === parseInt(tileId, 10)) {
              if (!tileData[tileId]!.animation) return;
              animatedTiles.push(new AnimatedTile(tile, tileData[tileId]!.animation!, tileset.firstgid));
            }
          })
        );
      });
    }
    return animatedTiles;
  };

  private get relevantTileset() {
    if (this.tilesets.length === 0) {
      throw new Error("Tilemap has no tilesets");
    }
    return this.tilesets[0]!;
  }

  private update = (_: number, delta: number) => this.animatedTiles.forEach((tile) => tile.update(delta));
  private destroy = () => this.scene?.events.off("update", this.update);
}
