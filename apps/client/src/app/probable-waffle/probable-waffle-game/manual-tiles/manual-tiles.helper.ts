import * as Phaser from 'phaser';
import { MapDefinitions, MapSizeInfo } from '../const/map-size.info';
import { SlopeDirection, TileLayerConfig } from '../types/tile-types';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';
import { TilemapToAtlasMap } from '../scenes/grassland.scene';

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

  static getDepth(tileXY: Vector2Simple, tileCenter: Vector2Simple, layer: number): number {
    const layerOffset = layer * MapSizeInfo.info.tileHeight;
    const ty = (tileXY.x + tileXY.y) * MapSizeInfo.info.tileHeightHalf;
    const depth = tileCenter.y + ty + layerOffset * MapSizeInfo.info.tileHeight;
    return depth;
  }

  /**
   * Generated layer is not of type tilemap layer, but individual tiles
   */
  addItemsToLayer(
    layers: ManualTileLayer[],
    tilemapToAtlasMap: TilemapToAtlasMap[],
    tileLayerConfig: TileLayerConfig[],
    layer: number
  ): void {
    const tileCenter = TilemapHelper.getTileCenter(MapSizeInfo.info.tileWidthHalf, MapSizeInfo.info.tileWidthHalf, {
      offset: layer * MapSizeInfo.info.tileHeight
    });

    for (let y = 0; y < MapSizeInfo.info.height; y++) {
      for (let x = 0; x < MapSizeInfo.info.width; x++) {
        const tileConfig = tileLayerConfig.find((r) => r.tileX === x && r.tileY === y);
        if (!tileConfig) {
          continue;
        }

        const tilesOnCorrectLayer = (layers.find((l) => l.z === layer) as ManualTileLayer).tiles;
        this.placeTileOnLayer(tilesOnCorrectLayer, tilemapToAtlasMap, layer, tileConfig, tileCenter);
      }
    }
  }

  placeTileOnLayer(
    manualTilesLayer: ManualTile[],
    tilemapToAtlasMap: TilemapToAtlasMap[],
    layer: number,
    tileConfig: TileLayerConfig,
    tileCenter: Vector2Simple
  ): void {
    const tx = (tileConfig.tileX - tileConfig.tileY) * MapSizeInfo.info.tileWidthHalf;
    const ty = (tileConfig.tileX + tileConfig.tileY) * MapSizeInfo.info.tileHeightHalf;

    const worldX = tileCenter.x + tx;
    const worldY = tileCenter.y + ty;

    const atlasMap = tilemapToAtlasMap[tileConfig.tileIndex];

    if (atlasMap.atlasName !== null && atlasMap.imageName !== null) {
      const tile = this.scene.add.image(
        worldX,
        worldY,
        atlasMap.atlasName + MapDefinitions.atlasSuffix,
        `${atlasMap.imageName}.${atlasMap.imageSuffix}`
      );

      tile.depth = ManualTilesHelper.getDepth({ x: tileConfig.tileX, y: tileConfig.tileY }, tileCenter, layer);

      manualTilesLayer.push({
        gameObjectImage: tile,
        z: layer,
        tileConfig,
        clickableZ: layer + 1,
        depth: tile.depth,
        index: tileConfig.tileIndex,
        manualRectangleInputInterceptor: this.getSlopeDir({ x: worldX, y: worldY }, tileConfig.slopeDir)
      });
    }
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

    this.drawGridLines(linesGroup, -1, mapWidth, mapHeight, tileWidthHalf, tileHeightHalf, tileCenter, layer);
    this.drawGridLines(linesGroup, 1, mapHeight, mapWidth, tileWidthHalf, tileHeightHalf, tileCenter, layer);
    return linesGroup;
  }

  /**
   * Working drawing so z index works on correct plane.
   * This means have to draw short lines and set their z index correctly (same way as in {@link placeTileOnLayer})
   */
  private drawGridLines(
    group: Phaser.GameObjects.Group,
    axisModifier: 1 | -1,
    firstAxis: number,
    secondAxis: number,
    tileWidthHalf: number,
    tileHeightHalf: number,
    tileCenter: Vector2Simple,
    layer: number
  ): void {
    const color = new Phaser.Display.Color();

    for (let y = 0; y < firstAxis + 1; y++) {
      // draw line secondAxis times
      for (let x = 1; x < secondAxis + 1; x++) {
        const txStart = -1 * axisModifier * (x - y - 1) * tileWidthHalf;
        const tyStart = (x + y - 1) * tileHeightHalf;

        const txEnd = -1 * axisModifier * (x - y) * tileWidthHalf;
        const tyEnd = (x + y) * tileHeightHalf;

        const worldXStart = tileCenter.x + txStart;
        const worldYStart = tileCenter.y + tyStart;
        const worldXEnd = tileCenter.x + txEnd;
        const worldYEnd = tileCenter.y + tyEnd;

        const graphics = this.scene.add.graphics();
        color.random(50);
        graphics.lineStyle(1, color.color, 1);
        graphics.lineBetween(worldXStart, worldYStart, worldXEnd, worldYEnd);

        graphics.depth = ManualTilesHelper.getDepth({ x: x - 1, y: y - 1 }, tileCenter, layer);

        group.add(graphics);
      }
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
