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
    const tilemap = this.scene.add.tilemap(MapDefinitions.tilemapMapName);

    const tileSetImages: Phaser.Tilemaps.Tileset[] = [];
    tilemap.tilesets.forEach((tileset: Tileset) => {
      tileSetImages.push(tilemap.addTilesetImage(tileset.name, tileset.name) as Phaser.Tilemaps.Tileset);
    });

    // const tilemapLayer = map.createBlankLayer('layer 2', tileSetImages, 0, 0, 100, 100) as Phaser.Tilemaps.TilemapLayer;
    const tilemapLayer = (this.mapHelper.tilemapLayer = tilemap.createLayer(
      tilemap.layers[0].name,
      tileSetImages
    ) as Phaser.Tilemaps.TilemapLayer);
    MapSizeInfo.info = new MapSizeInfo(
      tilemapLayer.width / tilemap.tileWidth,
      tilemapLayer.height / tilemap.tileHeight,
      tilemap.tileWidth,
      tilemap.tileHeight
    );
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
