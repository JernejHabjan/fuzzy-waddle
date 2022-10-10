import * as Phaser from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';
import { SlopeDirection, TileLayerConfig } from '../types/tile-types';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';

export interface ManualTile {
  gameObjectImage: Phaser.GameObjects.Image;
  // layer depth (starting with 0)
  z: number;
  // layer depth + 1
  clickableZ: number;
  depth: number;
  tileConfig: TileLayerConfig;

  // atlas index
  index: number; // todo

  // for stairs
  manualRectangleInputInterceptor: Phaser.Geom.Polygon | null;
}

export interface ManualTileLayer {
  z: number;
  tiles: ManualTile[];
}

export class ManualTilesHelper {
  private scene: Phaser.Scene; // todo should not be used like this

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Generated layer is not of type tilemap layer, but individual tiles
   */
  addItemsToLayer(layers: ManualTileLayer[], tileLayerConfig: TileLayerConfig[], layer: number): void {
    const tileCenter = TilemapHelper.getTileCenter(MapSizeInfo.info.tileWidthHalf, MapSizeInfo.info.tileWidthHalf, {
      offset: layer * MapSizeInfo.info.tileHeight
    });

    for (let y = 0; y < MapSizeInfo.info.height; y++) {
      for (let x = 0; x < MapSizeInfo.info.width; x++) {
        const tileConfig = tileLayerConfig.find((r) => r.x === x && r.y === y);
        if (!tileConfig) {
          continue;
        }

        this.placeTileOnLayer(
          (layers.find((l) => l.z === layer) as ManualTileLayer).tiles,
          layer,
          tileConfig,
          tileCenter
        );
      }
    }
  }

  placeTileOnLayer(
    manualTilesLayer: ManualTile[],
    layer: number,
    tileConfig: TileLayerConfig,
    tileCenter: Vector2Simple
  ): void {
    const tx = (tileConfig.x - tileConfig.y) * MapSizeInfo.info.tileWidthHalf;
    const ty = (tileConfig.x + tileConfig.y) * MapSizeInfo.info.tileHeightHalf;

    const worldX = tileCenter.x + tx;
    const worldY = tileCenter.y + ty;

    const tile = this.scene.add.image(worldX, worldY, tileConfig.texture, tileConfig.frame);

    const layerOffset = layer * MapSizeInfo.info.tileHeight;
    tile.depth = tileCenter.y + ty + layerOffset * MapSizeInfo.info.tileHeight;

    manualTilesLayer.push({
      gameObjectImage: tile,
      z: layer,
      tileConfig,
      clickableZ: layer + 1,
      depth: tile.depth,
      index: 0, // todo
      manualRectangleInputInterceptor: this.getSlopeDir({ x: worldX, y: worldY }, tileConfig.slopeDir)
    });
  }

  drawLayerLines(layer: number): Phaser.GameObjects.Group {
    const layerOffset = layer * MapSizeInfo.info.tileHeight;
    const tileWidth = MapSizeInfo.info.tileWidth;
    const tileHeight = MapSizeInfo.info.tileHeight;

    const tileWidthHalf = tileWidth / 2;
    const tileHeightHalf = tileHeight / 2;

    const mapWidth = MapSizeInfo.info.width;
    const mapHeight = MapSizeInfo.info.height;

    // not offsetting, because we're placing block tiles there
    const tileCenter = TilemapHelper.getTileCenter(MapSizeInfo.info.tileWidthHalf, MapSizeInfo.info.tileWidthHalf, {
      offset: layerOffset
    });

    const linesGroup = this.scene.add.group();

    this.drawGridLines(linesGroup, -1, mapWidth, mapHeight, tileWidthHalf, tileHeightHalf, tileCenter);
    this.drawGridLines(linesGroup, 1, mapHeight, mapWidth, tileWidthHalf, tileHeightHalf, tileCenter);
    return linesGroup;
  }

  /**
   * TODO
   * Fix line drawing so z index will work on correct plane.
   * This means we'll have to draw short lines and set their z index correctly (same way as in {@link placeTileOnLayer})
   */
  private drawGridLines(
    group: Phaser.GameObjects.Group,
    axisModifier: 1 | -1,
    firstAxis: number,
    secondAxis: number,
    tileWidthHalf: number,
    tileHeightHalf: number,
    tileCenter: Vector2Simple
  ): void {
    for (let y = 0; y < firstAxis + 1; y++) {
      const txStart = -1 * axisModifier * y * tileWidthHalf;
      const tyStart = y * tileHeightHalf;
      const txEnd = axisModifier * (secondAxis - y) * tileWidthHalf;
      const tyEnd = (secondAxis + y) * tileHeightHalf;

      const worldXStart = tileCenter.x + txStart;
      const worldYStart = tileCenter.y + tyStart;
      const worldXEnd = tileCenter.x + txEnd;
      const worldYEnd = tileCenter.y + tyEnd;

      const graphics = this.scene.add.graphics();
      graphics.lineStyle(1, 0x00ff00, 1);
      graphics.lineBetween(worldXStart, worldYStart, worldXEnd, worldYEnd);
      group.add(graphics);
    }
  }

  /**
   * Slopes like stairs
   */
  private getSlopeDir(worldXY: Vector2Simple, slopeDir?: SlopeDirection): Phaser.Geom.Polygon | null {
    const tileWidth = MapSizeInfo.info.tileWidth;
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
      this.applyPositionModifierToRectangleInputInterceptor(worldXY, manualRectangleInputInterceptor);
    }
    return manualRectangleInputInterceptor;
  }

  /**
   * So click on the sloped tile is detected correctly
   */
  private applyPositionModifierToRectangleInputInterceptor(
    worldXY: Vector2Simple,
    manualRectangleInputInterceptor: Phaser.Geom.Polygon
  ) {
    // displace the rectangle by world position
    for (let i = 0; i < manualRectangleInputInterceptor.points.length; i++) {
      manualRectangleInputInterceptor.points[i].x += worldXY.x;
      manualRectangleInputInterceptor.points[i].y += worldXY.y;
    }

    // displace the rectangle a bit to the left and top by center offset
    for (let i = 0; i < manualRectangleInputInterceptor.points.length; i++) {
      manualRectangleInputInterceptor.points[i].x -= MapSizeInfo.info.tileWidthHalf;
      manualRectangleInputInterceptor.points[i].y -= MapSizeInfo.info.tileWidthHalf;
    }
  }
}
