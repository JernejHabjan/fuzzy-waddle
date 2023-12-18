import { MapDefinitions, MapSizeInfo, TileDefinitions } from "../../../const/map-size.info";
import { SlopeDirection, TileIndexProperties, TileLayerProperties } from "../types/tile-types";
import { TilemapHelper } from "../tilemap.helper";
import { TilemapToAtlasMap } from "../../../scenes/grassland.scene";
import { TilePlacementData, TileWorldData } from "../../../managers/controllers/input/tilemap/tilemap-input.handler";
import { PossibleClickCoords } from "../../../managers/controllers/input/manual-tiles/manual-tile-input.handler";
import { MapHelper } from "../map-helper";
import { GameObjects, Geom, Scene } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export interface ManualTile extends TilePlacementWorldWithProperties {
  gameObjectImage: GameObjects.Image;

  // for stairs
  manualRectangleInputInterceptor: Geom.Polygon | null;
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
  constructor(
    private readonly mapHelper: MapHelper,
    private readonly scene: Scene,
    private readonly tilemapHelper: TilemapHelper
  ) {}

  static getDepth(tileXY: Vector2Simple, tileWorldXYCenter: Vector2Simple, layer: number): number {
    const layerOffset = layer * MapSizeInfo.info.tileHeight * 2;
    const ty = (tileXY.x + tileXY.y) * MapSizeInfo.info.tileHeightHalf;
    const depth = tileWorldXYCenter.y + ty + layerOffset;
    return depth;
  }

  createEmptyManualLayers() {
    const layers: ManualTileLayer[] = [];
    for (let i = 0; i <= MapDefinitions.nrLayers; i++) {
      layers.push({
        z: i,
        tiles: []
      });
    }
    this.mapHelper.manualLayers = layers;
  }

  placeTileOnManualLayer(
    tilemapToAtlasMap: TilemapToAtlasMap[],
    tilePlacementData: TilePlacementData,
    tileIndexProperties: TileIndexProperties
  ): void {
    const manualTilesLayer = (this.mapHelper.manualLayers.find((l) => l.z === tilePlacementData.z) as ManualTileLayer)
      .tiles;

    if (tileIndexProperties.tileIndex === TileDefinitions.tileRemoveIndex) {
      this.removeManualTileAt(manualTilesLayer, tilePlacementData);
      return;
    }

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
    const tileProperties = atlasMap.tileProperties;

    if (atlasMap.atlasName !== null && atlasMap.imageName !== null) {
      if (tilePlacementData.z === 0 && tileProperties?.fillsRootHeight) {
        // make a hole in tilemap, as the tile is blocking the tilemap tile, and it's not visible anyway - OPTIMIZATION
        this.tilemapHelper.removeTileAt(tilePlacementData);
        // console.log('Removed tile because of optimization');
      }

      const tile = this.scene.add.image(
        worldCenterXY.x,
        worldCenterXY.y,
        atlasMap.atlasName + MapDefinitions.atlasSuffix,
        `${atlasMap.imageName}.${atlasMap.imageSuffix}`
      );

      tile.depth = ManualTilesHelper.getDepth(tilePlacementData.tileXY, worldCenterXY, tilePlacementData.z);

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
      // console.log('placed manual tile');
    }
  }

  tryPlaceTileOnLayer(possibleCoords: PossibleClickCoords, tileToBeReplaced: number | null, layer: number): void {
    if (tileToBeReplaced === null) return;
    const tiles = (this.mapHelper.manualLayers.find((l) => l.z === layer) as ManualTileLayer).tiles;

    this.replaceManualTilesOnLayer(
      tiles,
      {
        tileXY: possibleCoords.tileXY,
        z: layer
      },
      {
        tileIndex: tileToBeReplaced
      }
    );
  }

  private removeManualTileAt(manualTilesLayer: ManualTile[], tilePlacementData: TilePlacementData): void {
    // find it by tilePlacementData in manualTilesLayer and remove it

    const tile = manualTilesLayer.find(
      (t) =>
        t.tileWorldData.tileXY.x === tilePlacementData.tileXY.x &&
        t.tileWorldData.tileXY.y === tilePlacementData.tileXY.y &&
        t.tileWorldData.z === tilePlacementData.z
    );
    if (tile) {
      tile.gameObjectImage.destroy();
      // if(tile.manualRectangleInputInterceptor){
      //   tile.manualRectangleInputInterceptor.destroy();
      // }
      manualTilesLayer.splice(manualTilesLayer.indexOf(tile), 1);
    }
  }

  /**
   * Slopes like stairs
   */
  private getSlopeDir(worldXY: Vector2Simple, slopeDir?: SlopeDirection): Geom.Polygon | null {
    const tileWidth = MapSizeInfo.info.tileWidth;
    let manualRectangleInputInterceptor: Geom.Polygon | null = null;
    switch (slopeDir) {
      case SlopeDirection.SouthEast:
        manualRectangleInputInterceptor = new Geom.Polygon([
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
        manualRectangleInputInterceptor = new Geom.Polygon([
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
        throw new Error("Not implemented");
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
    manualRectangleInputInterceptor: Geom.Polygon
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

  /**
   * called by editor. Ensures to destroy tiles before creating new one
   */
  private replaceManualTilesOnLayer(
    manualTilesLayer: ManualTile[],
    tilePlacementData: TilePlacementData,
    tileIndexProperties: TileIndexProperties
  ) {
    const existingTileOnLayer = manualTilesLayer.find(
      (tile) =>
        tile.tileWorldData.tileXY.x === tilePlacementData.tileXY.x &&
        tile.tileWorldData.tileXY.y === tilePlacementData.tileXY.y &&
        tile.tileWorldData.z === tilePlacementData.z
    );
    if (existingTileOnLayer) {
      manualTilesLayer.splice(manualTilesLayer.indexOf(existingTileOnLayer), 1);
      existingTileOnLayer.gameObjectImage.destroy();
    }

    this.placeTileOnManualLayer(
      this.mapHelper.mappedTilesetsToAtlasesWithProperties,
      tilePlacementData,
      tileIndexProperties
    );
  }
}
