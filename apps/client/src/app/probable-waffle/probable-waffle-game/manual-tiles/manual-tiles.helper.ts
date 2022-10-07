import * as Phaser from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';
import { SlopeDirection, TileLayerConfig } from '../types/tile-types';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';

export interface ManualTile {
  gameObjectImage: Phaser.GameObjects.Image;
  // tile index in the layer
  x: number;
  // tile index in the layer
  y: number;
  // layer depth (starting with 0)
  z: number;
  // layer depth + 1
  clickableZ: number;
  texture: string;
  frame: string;
  depth: number;

  // for stairs
  manualRectangleInputInterceptor: Phaser.Geom.Polygon | null;
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
        const tileConfig = tileLayerConfig.find((r) => r.x === x && r.y === y);
        if (!tileConfig) {
          continue;
        }

        const tx = (x - y) * tileWidthHalf;
        const ty = (x + y) * tileHeightHalf;

        const worldX = tileCenter.x + tx;
        const worldY = tileCenter.y + ty;

        const tile = this.scene.add.image(worldX, worldY, tileConfig.texture, tileConfig.frame);

        tile.depth = tileCenter.y + ty + layerOffset;

        manualTilesLayer.push({
          gameObjectImage: tile,
          x,
          y,
          z: layer,
          clickableZ: layer + 1,
          texture: tileConfig.texture,
          frame: tileConfig.frame,
          depth: tile.depth,
          manualRectangleInputInterceptor: this.getSlopeDir({ x: worldX, y: worldY }, mapSizeInfo, tileConfig.slopeDir)
        });
      }
    }
    this.drawLayerLines(mapSizeInfo, tileLayerConfig, layer); // todo remove from here
    return manualTilesLayer;
  }

  drawLayerLines(mapSizeInfo: MapSizeInfo, tileLayerConfig: TileLayerConfig[], layer: number): void {
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
      const txStart = (0 - y) * tileWidthHalf;
      const tyStart = (0 + y) * tileHeightHalf;
      const txEnd = (mapWidth - 1 - y) * tileWidthHalf;
      const tyEnd = (mapWidth - 1 + y) * tileHeightHalf;
      const graphics = this.scene.add.graphics();

      const worldXStart = tileCenter.x + txStart;
      const worldYStart = tileCenter.y + tyStart;
      const worldXEnd = tileCenter.x + txEnd;
      const worldYEnd = tileCenter.y + tyEnd;
      graphics.lineStyle(1, 0x00ff00, 1);

      graphics.lineBetween(worldXStart, worldYStart, worldXEnd, worldYEnd);
    }
  }

  /**
   * Slopes like stairs
   */
  private getSlopeDir(
    worldXY: Vector2Simple,
    mapSizeInfo: MapSizeInfo,
    slopeDir?: SlopeDirection
  ): Phaser.Geom.Polygon | null {
    const tileWidth = mapSizeInfo.tileWidth;
    let manualRectangleInputInterceptor: Phaser.Geom.Polygon | null = null;
    switch (slopeDir) {
      case SlopeDirection.SouthEast:
        manualRectangleInputInterceptor = new Phaser.Geom.Polygon([
          tileWidth / 2,
          0,
          0,
          tileWidth * 0.25,
          tileWidth / 2,
          tileWidth,
          tileWidth,
          tileWidth * 0.75
        ]);
        break;
      case SlopeDirection.SouthWest:
        manualRectangleInputInterceptor = new Phaser.Geom.Polygon([
          tileWidth / 2,
          0,
          tileWidth,
          tileWidth * 0.25,
          tileWidth / 2,
          tileWidth,
          0,
          tileWidth * 0.75
        ]);
        break;
      case SlopeDirection.NorthWest:
      case SlopeDirection.NorthEast:
        throw new Error('Not implemented');
    }
    if (manualRectangleInputInterceptor !== null) {
      this.applyPositionModifierToRectangleInputInterceptor(worldXY, manualRectangleInputInterceptor, mapSizeInfo);
    }
    return manualRectangleInputInterceptor;
  }

  /**
   * So click on the sloped tile is detected correctly
   */
  private applyPositionModifierToRectangleInputInterceptor(
    worldXY: Vector2Simple,
    manualRectangleInputInterceptor: Phaser.Geom.Polygon,
    mapSizeInfo: MapSizeInfo
  ) {
    // displace the rectangle by world position
    for (let i = 0; i < manualRectangleInputInterceptor.points.length; i++) {
      manualRectangleInputInterceptor.points[i].x += worldXY.x;
      manualRectangleInputInterceptor.points[i].y += worldXY.y;
    }

    // displace the rectangle a bit to the left and top by center offset
    for (let i = 0; i < manualRectangleInputInterceptor.points.length; i++) {
      manualRectangleInputInterceptor.points[i].x -= mapSizeInfo.tileWidth / 2;
      manualRectangleInputInterceptor.points[i].y -= mapSizeInfo.tileWidth / 2;
    }
  }
}
