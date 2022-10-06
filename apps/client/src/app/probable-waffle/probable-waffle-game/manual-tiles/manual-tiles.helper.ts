import * as Phaser from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';
import { TileLayerConfig } from '../types/tile-types';
import { TilemapHelper } from '../tilemap/tilemap.helper';

export interface ManualTile {
  gameObjectImage: Phaser.GameObjects.Image;
  x: number;
  y: number;
  z: number;
  texture: string;
  frame: string;
  depth: number;
}

export class ManualTilesHelper {
  private scene: Phaser.Scene; // todo should not be used like this

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Generated layer is not of type tilemap layer, but individual tiles
   */
  createLayer(mapSizeInfo: MapSizeInfo, tileLayerConfig: TileLayerConfig[], layer: number): ManualTile[] {
    const manualTilesLayer: ManualTile[] = [];
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

        manualTilesLayer.push({
          gameObjectImage: tile,
          x: tile.x,
          y: tile.y,
          z: layer,
          texture: layerConfig.texture,
          frame: layerConfig.frame,
          depth: tile.depth
        });
      }
    }
    return manualTilesLayer;
  }
}
