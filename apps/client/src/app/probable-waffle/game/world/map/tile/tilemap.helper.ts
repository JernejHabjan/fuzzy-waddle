import { MapDefinitions, MapSizeInfo } from "../../const/map-size.info";
import { TileCenterOptions, TileIndexProperties, TilePossibleProperties } from "./types/tile-types";
import { IsoHelper } from "./iso-helper";
import { TilePlacementData } from "../../managers/controllers/input/tilemap/tilemap-input.handler";
import { MapHelper } from "./map-helper";
import { Scene, Tilemaps } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class TilemapHelper {
  constructor(
    private readonly mapHelper: MapHelper,
    private readonly scene: Scene
  ) {}

  static get tileCenterOffset(): number {
    // todo move to IsoHelper
    return MapSizeInfo.info.tileHeightHalf;
  }

  private get nrTilesToReplace(): number {
    return 0; // return Deprecated_SceneCommunicatorService.tileEmitterNrSubject.getValue();
  }

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
    const createBlankLayer = false; // https://github.com/photonstorm/phaser/issues/6262
    let tilemap: Tilemaps.Tilemap;
    const tilemapWithLayers = (tilemap = this.scene.make.tilemap({ key: "MapDefinitions.tilemapMapName" }));
    if (createBlankLayer) {
      const mapData = new Tilemaps.MapData({
        width: MapSizeInfo.info.width,
        height: MapSizeInfo.info.height,
        tileWidth: MapSizeInfo.info.tileWidth,
        tileHeight: MapSizeInfo.info.tileHeight,
        orientation: Tilemaps.Orientation.ISOMETRIC as any as string,
        format: Tilemaps.Formats.ARRAY_2D
      });

      tilemap = new Tilemaps.Tilemap(this.scene, mapData);
    }

    const tileSetImages: Tilemaps.Tileset[] = [];
    tilemapWithLayers.tilesets.forEach((tileset: Tilemaps.Tileset) => {
      tileSetImages.push(tilemap.addTilesetImage(tileset.name, tileset.name) as Tilemaps.Tileset);
    });

    let tilemapLayer: Tilemaps.TilemapLayer;
    if (createBlankLayer) {
      tilemapLayer = tilemap.createBlankLayer("layer-blank-layer-0", tileSetImages) as Tilemaps.TilemapLayer;
      tilemapLayer.fill(1);
      // todo here mappedTilesetsToAtlasesWithProperties aren't set correctly - because different this.mapHelper.tilemapLayer is set and tilesets from it retrieved wrong
    } else {
      tilemapLayer = tilemap.createLayer(tilemap.layers[0].name, tileSetImages) as Tilemaps.TilemapLayer;
      MapSizeInfo.info.width = tilemap.width;
      MapSizeInfo.info.height = tilemap.height;
    }
    this.mapHelper.tilemapLayer = tilemapLayer;
  }

  replaceTileOnTilemap(tilePlacementData: TilePlacementData, tileIndexProperties: TileIndexProperties) {
    this.tileReplacement(tilePlacementData, tileIndexProperties);
  }

  removeTileAt(tilePlacementData: TilePlacementData) {
    this.tileReplacement(tilePlacementData, { tileIndex: -1 });
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
    neighbors.forEach((t: Tilemaps.Tile) => {
      // todo maybe use width and height here and don't loop
      this.mapHelper.tilemapLayer.replaceByIndex(t.index, tileIndexProperties.tileIndex, t.x, t.y, 1, 1);
    });
    // console.log('tilemap tile replaced');
  }
}
