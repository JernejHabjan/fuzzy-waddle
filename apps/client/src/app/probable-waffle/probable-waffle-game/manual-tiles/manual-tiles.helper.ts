import * as Phaser from 'phaser';
import { MapDefinitions, MapSizeInfo } from '../const/map-size.info';
import { SlopeDirection, TileIndexProperties, TileLayerProperties } from '../types/tile-types';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';
import { TilemapToAtlasMap } from '../scenes/grassland.scene';
import { TilePlacementData, TileWorldData } from '../input/tilemap/tilemap-input.handler';

export interface ManualTile extends TilePlacementWorldWithProperties {
  gameObjectImage: Phaser.GameObjects.Image;

  // for stairs
  manualRectangleInputInterceptor: Phaser.Geom.Polygon | null;
}

export interface TilePlacementWorldWithProperties {
  tileWorldData: TileWorldData;
  tileLayerProperties: TileLayerProperties;
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

  static getDepth(tileXY: Vector2Simple, tileWorldXYCenter: Vector2Simple, layer: number): number {
    const layerOffset = layer * MapSizeInfo.info.tileHeight;
    const ty = (tileXY.x + tileXY.y) * MapSizeInfo.info.tileHeightHalf;
    const depth = tileWorldXYCenter.y + ty + layerOffset * MapSizeInfo.info.tileHeight;
    return depth;
  }

  placeTilesOnLayer(
    layers: ManualTileLayer[],
    tilemapToAtlasMap: TilemapToAtlasMap[],
    data: { tilePlacementData: TilePlacementData; tileIndexProperties: TileIndexProperties }[]
  ): void {
    data.forEach((d) => {
      this.placeTileOnLayer(layers, tilemapToAtlasMap, d.tilePlacementData, d.tileIndexProperties);
    });
  }
  placeTileOnLayer(
    layers: ManualTileLayer[],
    tilemapToAtlasMap: TilemapToAtlasMap[],
    tilePlacementData: TilePlacementData,
    tileIndexProperties: TileIndexProperties
  ): void {
    const manualTilesLayer = (layers.find((l) => l.z === tilePlacementData.z) as ManualTileLayer).tiles;

    // TODO REPLACE THIS WITH TilemapHelper.getTileWorldCenterByTilemapTileXY(tileXY,... ???
    const tx = (tilePlacementData.tileXY.x - tilePlacementData.tileXY.y) * MapSizeInfo.info.tileWidthHalf;
    const ty = (tilePlacementData.tileXY.x + tilePlacementData.tileXY.y) * MapSizeInfo.info.tileHeightHalf;

    const byLayerOffsetInPx = tilePlacementData.z * MapSizeInfo.info.tileHeight;
    const tileWorldCenter = TilemapHelper.adjustTileWorldWithVerticalOffset(
      { x: MapSizeInfo.info.tileWidthHalf, y: MapSizeInfo.info.tileWidthHalf },
      {
        offsetInPx: byLayerOffsetInPx
      }
    );
    const worldCenterXY: Vector2Simple = { x: tileWorldCenter.x + tx, y: tileWorldCenter.y + ty };

    const atlasMap = tilemapToAtlasMap[tileIndexProperties.tileIndex];

    if (atlasMap.atlasName !== null && atlasMap.imageName !== null) {
      const tile = this.scene.add.image(
        worldCenterXY.x,
        worldCenterXY.y,
        atlasMap.atlasName + MapDefinitions.atlasSuffix,
        `${atlasMap.imageName}.${atlasMap.imageSuffix}`
      );

      tile.depth = ManualTilesHelper.getDepth(tilePlacementData.tileXY, worldCenterXY, tilePlacementData.z);

      const tileProperties = atlasMap.tileProperties;

      manualTilesLayer.push({
        gameObjectImage: tile,
        tileWorldData: {
          tileXY: tilePlacementData.tileXY,
          worldXY: worldCenterXY,
          z: tilePlacementData.z
        },
        tileLayerProperties: {
          tileIndex: tileIndexProperties.tileIndex,
          slopeDir: tileProperties?.slopeDir,
          stepHeight: tileProperties?.stepHeight
        },
        manualRectangleInputInterceptor: this.getSlopeDir(worldCenterXY, tileProperties?.slopeDir)
      });
      console.log('placed manual tile');
    }
  }

  drawLayerLines(layer: number): Phaser.GameObjects.Group {
    const byLayerOffset = layer * MapSizeInfo.info.tileHeight;
    const tileWidth = MapSizeInfo.info.tileWidth;
    const tileHeight = MapSizeInfo.info.tileHeight;

    const tileWidthHalf = tileWidth / 2;
    const tileHeightHalf = tileHeight / 2;

    const mapWidth = MapSizeInfo.info.width;
    const mapHeight = MapSizeInfo.info.height;

    // not offsetting, because we're placing block tiles there
    const tileCenterOffset = TilemapHelper.adjustTileWorldWithVerticalOffset(
      { x: MapSizeInfo.info.tileWidthHalf, y: MapSizeInfo.info.tileHeight },
      {
        offsetInPx: byLayerOffset
      }
    );

    const linesGroup = this.scene.add.group();

    this.drawLayerGridLines(
      linesGroup,
      -1,
      mapWidth,
      mapHeight,
      tileWidthHalf,
      tileHeightHalf,
      tileCenterOffset,
      layer
    );
    this.drawLayerGridLines(linesGroup, 1, mapHeight, mapWidth, tileWidthHalf, tileHeightHalf, tileCenterOffset, layer);
    return linesGroup;
  }

  /**
   * Working drawing so z index works on correct plane.
   * This means have to draw short lines and set their z index correctly (same way as in {@link placeTileOnLayer})
   */
  private drawLayerGridLines(
    group: Phaser.GameObjects.Group,
    axisModifier: 1 | -1,
    firstAxis: number,
    secondAxis: number,
    tileWidthHalf: number,
    tileHeightHalf: number,
    tileCenterOffset: Vector2Simple,
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

        const worldStart: Vector2Simple = { x: tileCenterOffset.x + txStart, y: tileCenterOffset.y + tyStart };
        const worldEnd: Vector2Simple = { x: tileCenterOffset.x + txEnd, y: tileCenterOffset.y + tyEnd };

        const graphics = this.scene.add.graphics();
        color.random(50);
        graphics.lineStyle(1, color.color, 1);
        graphics.lineBetween(worldStart.x, worldStart.y, worldEnd.x, worldEnd.y);

        // minus 1 because we're starting for loops from top of the layer (+1 tile width and height)
        graphics.depth = ManualTilesHelper.getDepth({ x: x - 1, y: y - 1 }, tileCenterOffset, layer);

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
      case SlopeDirection.SouthWest:
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
      case SlopeDirection.SouthEast:
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
      manualRectangleInputInterceptor.points[i].y -= MapSizeInfo.info.tileHeight;
    }
  }
}
