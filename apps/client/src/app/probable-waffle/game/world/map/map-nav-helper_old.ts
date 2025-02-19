import { TilemapInputHandler } from "../managers/controllers/input/tilemap/tilemap-input.handler";
import { ManualTileInputHandler_old } from "../managers/controllers/input/manual-tiles/manual-tile-input.handler_old";
import { TileLayerProperties } from "./tile/types/tile-types";
import { GameObjectsHelper } from "./game-objects-helper";
import { Tilemaps } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class MapNavHelper_old {
  constructor(
    private readonly mapHelper: any,
    private readonly gameObjectsHelper: GameObjectsHelper,
    private readonly tilemapInputHandler: TilemapInputHandler,
    private readonly manualTileInputHandler: ManualTileInputHandler_old
  ) {}

  /**
   * flattens all layers into one array
   */
  get getFlattenedGrid(): any[][] {
    const tilemapPlacementWithProperties = this.getTilemapLayerTilePlacementWithProperties();
    const manualPlacementWithProperties = this.getManualLayerTilePlacementWithProperties();

    const allPlacements = tilemapPlacementWithProperties;
    // replace allPlacements from manualPlacementWithProperties with same tileXY
    manualPlacementWithProperties.forEach((layer) => {
      layer.forEach((placement) => {
        const tileXY = placement.tileWorldData.tileXY;
        allPlacements[tileXY.y][tileXY.x] = placement;
      });
    });

    return allPlacements;
  }

  /**
   * todo this needs to be removed later as we should be manually updating arrays of static objects
   */
  getTilemapLayerTilePlacementWithProperties(): any[][] {
    return this.mapHelper.tilemapLayer.layer.data.map((row: Tilemaps.Tile[]) =>
      row.map(
        (tile) =>
          ({
            tileWorldData: {
              worldXY: { x: tile.pixelX, y: tile.pixelY }, // todo check if this is correct
              tileXY: { x: tile.x, y: tile.y },
              z: 0
            },
            tileLayerProperties: Object.assign(TilemapInputHandler.defaultTilemapLayerProperties, {
              tileIndex: tile.index
            } satisfies Partial<TileLayerProperties>)
          }) satisfies any
      )
    );
  }

  /**
   * todo this needs to be removed later as we should be manually updating arrays of static objects
   */
  getManualLayerTilePlacementWithProperties(): any[][] {
    return (this.mapHelper as any).manualLayers.map((layer) =>
      layer.tiles.map((tile) => ({
        tileWorldData: tile.tileWorldData,
        tileLayerProperties: tile.tileLayerProperties
      }))
    );
  }

  /**
   * gets the first tile from top-down layer that is navigable. Used when clicking by cursor
   */
  getNavigableTile(worldXY: Vector2Simple): any | null {
    // todo maybe compare this staticObjects.find same way as cursor is doing. because atlas bounds might not be the same as object bounds - diff "collision" box
    const existingBuildingSelected = this.gameObjectsHelper.staticObjects.find((s) =>
      s.spriteInstance.getBounds().contains(worldXY.x, worldXY.y)
    );
    if (existingBuildingSelected) {
      // return {
      //   tileWorldData: {
      //     tileXY: existingBuildingSelected.tileXY,
      //     layer: existingBuildingSelected.layer
      //   },
      //   tileLayerProperties: existingBuildingSelected.tileLayerProperties
      // };
      // todo
    }

    const existingManualTileSelected = this.manualTileInputHandler.getManualTileOnWorldXY(worldXY);
    if (existingManualTileSelected) {
      return {
        tileWorldData: existingManualTileSelected.tileWorldData,
        tileLayerProperties: existingManualTileSelected.tileLayerProperties
      };
    }
    const tileOnTilemap = this.tilemapInputHandler.getTileFromTilemapOnWorldXY(worldXY);
    return tileOnTilemap;
  }
}
