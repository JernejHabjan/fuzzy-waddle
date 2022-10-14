import * as Phaser from 'phaser';
import { MapSizeInfo } from '../../const/map-size.info';
import { Subject } from 'rxjs';
import { Intersection, Vector2Simple } from '../../math/intersection';
import { ManualTile, ManualTileLayer } from '../../manual-tiles/manual-tiles.helper';
import { IsoHelper } from '../../iso/iso-helper';

export interface PossibleClickCoords {
  z: number;
  tileXY: Vector2Simple;
}

export class ManualTileInputHandler {
  private scene: Phaser.Scene;
  private input: Phaser.Input.InputPlugin;

  // onTileSelected: Subject<ManualTile> = new Subject<ManualTile>();
  // onEditorTileSelected: Subject<PossibleClickCoords[]> = new Subject<PossibleClickCoords[]>();
  private readonly manualLayers: ManualTileLayer[];

  constructor(scene: Phaser.Scene, input: Phaser.Input.InputPlugin, manualLayers: ManualTileLayer[]) {
    this.scene = scene; // todo for test
    this.input = input;
    this.manualLayers = manualLayers;
  }

  /**
   * returns true if the tile was found and selected
   */
  existingTileSelected(pointer: Phaser.Input.Pointer): ManualTile | null {
    const { worldX, worldY } = pointer;

    const searchedWorldX = worldX - MapSizeInfo.info.tileWidthHalf;
    const searchedWorldY = worldY - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

    const foundTile = this.geExistingTileAtWorldXY(searchedWorldX, searchedWorldY);

    return foundTile;
  }

  /**
   * Searches through all layers if there's a tile that can be clicked at the given worldX, worldY
   * returns true if some coordinates exist and event was emitted
   */
  searchPossibleTileCoordinates(pointer: Phaser.Input.Pointer): PossibleClickCoords[] {
    const { worldX, worldY } = pointer;

    const searchedWorldX = worldX - MapSizeInfo.info.tileWidthHalf;
    const searchedWorldY = worldY - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

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

  private geExistingTileAtWorldXY(worldX: number, worldY: number): ManualTile | null {
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
          this.drawDebugPolygon(tile.manualRectangleInputInterceptor);
          this.drawDebugPoint(clickPointToTileWorldXY);

          const intersects = Intersection.intersectsWithRectangle(
            clickPointToTileWorldXY,
            tile.manualRectangleInputInterceptor
          );
          if (intersects) {
            return tile;
          }
        } else {
          if (
            tile.tileConfig.tileX - tile.clickableZ === pointerToTileXY.x &&
            tile.tileConfig.tileY - tile.clickableZ === pointerToTileXY.y
          ) {
            return tile;
          }
        }
      }
    }
    return null;
  }

  private drawDebugPolygon(polygon: Phaser.Geom.Polygon) {
    const graphics = this.scene.add.graphics({ x: 0, y: 0 });

    graphics.lineStyle(2, 0xff0000);

    graphics.beginPath();

    graphics.moveTo(polygon.points[0].x, polygon.points[0].y);

    for (let i = 1; i < polygon.points.length; i++) {
      graphics.lineTo(polygon.points[i].x, polygon.points[i].y);
    }
    graphics.closePath();
    graphics.strokePath();
    graphics.depth = 1000;
  }

  destroy() {
    // this.input.off(Phaser.Input.Events.POINTER_UP);
  }

  private drawDebugPoint(clickPoint: { x: number; y: number }) {
    const graphics = this.scene.add.graphics({ x: 0, y: 0 });

    graphics.lineStyle(2, 0x00ff00);

    graphics.beginPath();

    graphics.moveTo(clickPoint.x, clickPoint.y);

    graphics.lineTo(clickPoint.x + 1, clickPoint.y + 1);

    graphics.closePath();
    graphics.strokePath();
    graphics.depth = 1001;
  }
}
