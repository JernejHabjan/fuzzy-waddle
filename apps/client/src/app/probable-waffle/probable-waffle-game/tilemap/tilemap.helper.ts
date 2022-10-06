import * as Phaser from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';
import { TileCenterOptions, TileLayerConfig } from '../types/tile-types';

export class TilemapHelper {
  private scene: Phaser.Scene; // todo should not be used like this

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  static getTileCenter(
    x: number,
    y: number,
    mapSizeInfo: MapSizeInfo,
    tileCenterOptions: TileCenterOptions = null
  ): Phaser.Math.Vector2 {
    const centerX = x;
    const centerY =
      y +
      (tileCenterOptions?.offset
        ? -tileCenterOptions.offset
        : tileCenterOptions?.centerSprite
        ? mapSizeInfo.tileHeight / 2
        : 0);
    return new Phaser.Math.Vector2(centerX, centerY);
  }

  static getTileCenterByTilemapTileXY(
    x: number,
    y: number,
    tilemapLayer: Phaser.Tilemaps.TilemapLayer,
    mapSizeInfo: MapSizeInfo,
    tileCenterOptions: TileCenterOptions = null
  ): Phaser.Math.Vector2 | null {
    const currentTile = tilemapLayer.getTileAt(x, y);
    if (!currentTile) {
      return null;
    }
    return this.getTileCenter(currentTile.getCenterX(), currentTile.getCenterY(), mapSizeInfo, tileCenterOptions);
  }

  placeSpriteOnTilemapTile(tile: Phaser.Tilemaps.Tile, mapSizeInfo: MapSizeInfo): Phaser.GameObjects.Sprite {
    const tileCenter = TilemapHelper.getTileCenter(tile.getCenterX(), tile.getCenterY(), mapSizeInfo, {
      centerSprite: true
    });

    // create object
    const sprite = this.scene.add.sprite(tileCenter.x, tileCenter.y, 'atlas', 'blue_ball');
    // todo set object depth!
    sprite.setInteractive();
    // todo temp
    sprite.setScale(1, 1);
    return sprite;
  }

  createLayer(mapSizeInfo: MapSizeInfo, tileLayerConfig: TileLayerConfig[], layer: number) {
    const layerOffset = layer * mapSizeInfo.tileHeight;
    const tileWidth = mapSizeInfo.tileWidth;
    const tileHeight = mapSizeInfo.tileHeight;

    const tileWidthHalf = tileWidth / 2;
    const tileHeightHalf = tileHeight / 2;

    const mapWidth = mapSizeInfo.width;
    const mapHeight = mapSizeInfo.height;

    // not offsetting, because we're placing block tiles there
    const tileCenter = TilemapHelper.getTileCenter(mapSizeInfo.tileWidth / 2, mapSizeInfo.tileWidth / 2, mapSizeInfo, {
      offset: layerOffset
    });

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const layerConfig = tileLayerConfig.find((r) => r.x === x && r.y === y);
        if (!layerConfig) {
          continue;
        }

        const tx = (x - y) * tileWidthHalf;
        const ty = (x + y) * tileHeightHalf;

        const tile = this.scene.add.image(tileCenter.x + tx, tileCenter.y + ty, layerConfig.texture, layerConfig.frame);

        tile.depth = tileCenter.y + ty + layerOffset;
      }
    }
  }
}
