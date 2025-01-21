import { MapSizeInfo_old } from "../../../../const/map-size.info_old";
import { Intersection } from "../../../../../library/math/intersection";
import { ManualTile, ManualTileLayer_old } from "../../../../map/tile/manual-tiles/manual-tiles.helper";
import { IsoHelper } from "../../../../map/tile/iso-helper";
import { Scene } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export interface PossibleClickCoords {
  z: number;
  tileXY: Vector2Simple;
}

export class ManualTileInputHandler_old {
  constructor(
    private readonly scene: Scene,
    private readonly manualLayers: ManualTileLayer_old[]
  ) {}

  /**
   * returns true if the tile was found and selected
   */
  getManualTileOnWorldXY(worldXY: Vector2Simple): ManualTile | null {
    const searchedWorldX = worldXY.x - MapSizeInfo_old.info.tileWidthHalf;
    const searchedWorldY = worldXY.y - MapSizeInfo_old.info.tileWidthHalf; // note tileWidth and not height

    const foundTile = this.geExistingManualTileAtWorldXY(searchedWorldX, searchedWorldY);

    return foundTile;
  }

  /**
   * Searches through all layers if there's a tile that can be clicked at the given worldX, worldY
   * returns true if some coordinates exist and event was emitted
   */
  searchPossibleTileCoordinatesOnManualLayers_old(worldXY: Vector2Simple): PossibleClickCoords[] {
    const searchedWorldX = worldXY.x - MapSizeInfo_old.info.tileWidthHalf;
    const searchedWorldY = worldXY.y - MapSizeInfo_old.info.tileWidthHalf; // note tileWidth and not height

    const pointerToTileXY = IsoHelper.DEPRECATED_isometricWorldToTileXY(searchedWorldX, searchedWorldY, true);

    const possibleCoords: PossibleClickCoords[] = [];
    for (const manualLayer of this.manualLayers) {
      const tileX = pointerToTileXY.x + manualLayer.z;
      const tileY = pointerToTileXY.y + manualLayer.z;
      if (
        -manualLayer.z <= pointerToTileXY.x &&
        pointerToTileXY.x < MapSizeInfo_old.info.width - manualLayer.z &&
        -manualLayer.z <= pointerToTileXY.y &&
        pointerToTileXY.y < MapSizeInfo_old.info.height - manualLayer.z
      ) {
        possibleCoords.push({
          z: manualLayer.z,
          tileXY: { x: tileX, y: tileY }
        });
      }
    }
    // this.onEditorTileSelected.next(possibleCoords);
    return possibleCoords;
  }

  destroy() {
    // this.input.off(Phaser.Input.Events.POINTER_UP);
  }

  private geExistingManualTileAtWorldXY(worldX: number, worldY: number): ManualTile | null {
    const pointerToTileXY = IsoHelper.DEPRECATED_isometricWorldToTileXY(worldX, worldY, true);
    const clickPointToTileWorldXY = {
      x: worldX + MapSizeInfo_old.info.tileWidthHalf,
      y: worldY + MapSizeInfo_old.info.tileWidthHalf
    };

    // search in all layers, starting from the last
    for (let i = this.manualLayers.length - 1; i >= 0; i--) {
      const tiles = this.manualLayers[i].tiles;
      // search in the layer if tile x,y match the worldX, worldY
      for (let j = 0; j < tiles.length; j++) {
        const tile = tiles[j];

        if (tile.manualRectangleInputInterceptor) {
          // DebugShapes.drawDebugPolygon(this.scene,tile.manualRectangleInputInterceptor);
          // DebugShapes.drawDebugPoint(this.scene,clickPointToTileWorldXY);

          const intersects = Intersection.intersectsWithRectangle(
            clickPointToTileWorldXY,
            tile.manualRectangleInputInterceptor
          );
          if (intersects) {
            return tile;
          }
        } else {
          const offsetBecauseOfHeight = 1;
          if (
            tile.tileWorldData.tileXY.x - (tile.tileWorldData.z + offsetBecauseOfHeight) === pointerToTileXY.x &&
            tile.tileWorldData.tileXY.y - (tile.tileWorldData.z + offsetBecauseOfHeight) === pointerToTileXY.y
          ) {
            return tile;
          }
        }
      }
    }
    return null;
  }
}
