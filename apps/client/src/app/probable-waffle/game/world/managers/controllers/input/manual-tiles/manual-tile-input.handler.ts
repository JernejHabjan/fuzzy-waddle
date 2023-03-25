import { MapSizeInfo } from '../../../../const/map-size.info';
import { Intersection, Vector2Simple } from '../../../../../library/math/intersection';
import { ManualTile, ManualTileLayer } from '../../../../map/tile/manual-tiles/manual-tiles.helper';
import { IsoHelper } from '../../../../map/tile/iso-helper';
import { Scene } from 'phaser';

export interface PossibleClickCoords {
  z: number;
  tileXY: Vector2Simple;
}

export class ManualTileInputHandler {
  constructor(private readonly scene: Scene, private readonly manualLayers: ManualTileLayer[]) {}

  /**
   * returns true if the tile was found and selected
   */
  getManualTileOnWorldXY(worldXY: Vector2Simple): ManualTile | null {
    const searchedWorldX = worldXY.x - MapSizeInfo.info.tileWidthHalf;
    const searchedWorldY = worldXY.y - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

    const foundTile = this.geExistingManualTileAtWorldXY(searchedWorldX, searchedWorldY);

    return foundTile;
  }

  /**
   * Searches through all layers if there's a tile that can be clicked at the given worldX, worldY
   * returns true if some coordinates exist and event was emitted
   */
  searchPossibleTileCoordinatesOnManualLayers(worldXY: Vector2Simple): PossibleClickCoords[] {
    const searchedWorldX = worldXY.x - MapSizeInfo.info.tileWidthHalf;
    const searchedWorldY = worldXY.y - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

    const pointerToTileXY = IsoHelper.isometricWorldToTileXY(searchedWorldX, searchedWorldY, true);

    const possibleCoords: PossibleClickCoords[] = [];
    for (const manualLayer of this.manualLayers) {
      const tileX = pointerToTileXY.x + manualLayer.z;
      const tileY = pointerToTileXY.y + manualLayer.z;
      if (
        -manualLayer.z <= pointerToTileXY.x &&
        pointerToTileXY.x < MapSizeInfo.info.width - manualLayer.z &&
        -manualLayer.z <= pointerToTileXY.y &&
        pointerToTileXY.y < MapSizeInfo.info.height - manualLayer.z
      ) {
        possibleCoords.push({
          z: manualLayer.z,
          tileXY: { x: tileX, y: tileY }
        });
      }
    }
    // this.onEditorTileSelected.next(possibleCoords); // todo later remove this event emitter
    return possibleCoords;
  }

  destroy() {
    // this.input.off(Phaser.Input.Events.POINTER_UP);
  }

  private geExistingManualTileAtWorldXY(worldX: number, worldY: number): ManualTile | null {
    const pointerToTileXY = IsoHelper.isometricWorldToTileXY(worldX, worldY, true);
    const clickPointToTileWorldXY = {
      x: worldX + MapSizeInfo.info.tileWidthHalf,
      y: worldY + MapSizeInfo.info.tileWidthHalf
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
          const offsetBecauseOfHeight = 1; // todo clickable height
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
