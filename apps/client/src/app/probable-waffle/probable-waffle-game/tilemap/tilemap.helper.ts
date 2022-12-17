import * as Phaser from 'phaser';
import { MapDefinitions, MapSizeInfo } from '../const/map-size.info';
import { TileCenterOptions, TileIndexProperties, TilePossibleProperties } from '../types/tile-types';
import { Vector2Simple } from '../math/intersection';
import { IsoHelper } from '../iso/iso-helper';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { SceneCommunicatorService } from '../event-emitters/scene-communicator.service';
import Tileset = Phaser.Tilemaps.Tileset;
import { MapHelper } from '../map/map-helper';
import Tile = Phaser.Tilemaps.Tile;

export class TilemapHelper {
  constructor(private readonly mapHelper: MapHelper, private readonly scene: Phaser.Scene) {}

  static adjustTileWorldWithVerticalOffset(
    // todo move to IsoHelper
    tileXY: Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple {
    if (tileCenterOptions?.offsetInPx) {
      return { x: tileXY.x, y: tileXY.y - tileCenterOptions.offsetInPx };
    }
    if (tileCenterOptions?.centerOfTile) {
      return { x: tileXY.x, y: tileXY.y + TilemapHelper.tileCenterOffset };
    }
    return tileXY;
  }

  static get tileCenterOffset(): number {
    // todo move to IsoHelper
    return MapSizeInfo.info.tileHeightHalf;
  }

  static getTileWorldCenterByTilemapTileXY(
    // todo move to IsoHelper
    tileXY: Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple {
    return this.adjustTileWorldWithVerticalOffset(IsoHelper.getWorldCenterXY(tileXY), tileCenterOptions);
  }

  tileShouldBePlacedOnTilemap(tileToBeReplaced: number | null, layer: number): boolean {
    if (!tileToBeReplaced) return false;
    if (layer !== 0) return false;

    const atlasMap = this.mapHelper.mappedTilesetsToAtlasesWithProperties[tileToBeReplaced];
    if (!atlasMap.tileProperties) return false;
    const tileProperties = atlasMap.tileProperties as TilePossibleProperties;
    return tileProperties.stepHeight === 0;
  }

  createTilemap() {
    const createBlankLayer = true; // https://github.com/photonstorm/phaser/issues/6262
    let tilemap: Phaser.Tilemaps.Tilemap;
    const tilemapWithLayers = (tilemap = this.scene.make.tilemap({ key: MapDefinitions.tilemapMapName }));
    if (createBlankLayer) {
      const mapData = new Phaser.Tilemaps.MapData({
        width: MapSizeInfo.info.width,
        height: MapSizeInfo.info.height,
        tileWidth: MapSizeInfo.info.tileWidth,
        tileHeight: MapSizeInfo.info.tileHeight,
        orientation: Phaser.Tilemaps.Orientation.ISOMETRIC as any as string,
        format: Phaser.Tilemaps.Formats.ARRAY_2D
      });

      tilemap = new Phaser.Tilemaps.Tilemap(this.scene, mapData);
    }

    const tileSetImages: Phaser.Tilemaps.Tileset[] = [];
    tilemapWithLayers.tilesets.forEach((tileset: Tileset) => {
      tileSetImages.push(tilemap.addTilesetImage(tileset.name, tileset.name) as Phaser.Tilemaps.Tileset);
    });

    let tilemapLayer: Phaser.Tilemaps.TilemapLayer;
    if (createBlankLayer) {
      tilemapLayer = tilemap.createBlankLayer('layer-blank-layer-0', tileSetImages) as Phaser.Tilemaps.TilemapLayer;
      tilemapLayer.fill(1);
      // todo here mappedTilesetsToAtlasesWithProperties aren't set correctly - because different this.mapHelper.tilemapLayer is set and tilesets from it retrieved wrong
    } else {
      tilemapLayer = tilemap.createLayer(tilemap.layers[0].name, tileSetImages) as Phaser.Tilemaps.TilemapLayer;
      MapSizeInfo.info.width = tilemap.width;
      MapSizeInfo.info.height = tilemap.height;
    }
    this.mapHelper.tilemapLayer = tilemapLayer;
  }

  replaceTileOnTilemap(tilePlacementData: TilePlacementData, tileIndexProperties: TileIndexProperties) {
    this.tileReplacement(tilePlacementData, tileIndexProperties);
  }

  private get nrTilesToReplace(): number {
    return SceneCommunicatorService.tileEmitterNrSubject.getValue();
  }

  private tileReplacement(tilePlacementData: TilePlacementData, tileIndexProperties: TileIndexProperties) {
    const tilesToReplace = this.nrTilesToReplace;
    // get neighbors of tile
    const from = Math.floor(tilesToReplace / 2);
    const neighbors = this.mapHelper.tilemapLayer.getTilesWithin(
      tilePlacementData.tileXY.x - from,
      tilePlacementData.tileXY.y - from,
      tilesToReplace,
      tilesToReplace
    );
    neighbors.forEach((t: Tile) => {
      // todo maybe use width and height here and don't loop
      this.mapHelper.tilemapLayer.replaceByIndex(t.index, tileIndexProperties.tileIndex, t.x, t.y, 1, 1);
    });
    // console.log('tilemap tile replaced');
  }

  removeTileAt(tilePlacementData: TilePlacementData) {
    this.tileReplacement(tilePlacementData, { tileIndex: -1 });
  }
}
