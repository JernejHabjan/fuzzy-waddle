import * as Phaser from 'phaser';
import { MapSizeInfo } from '../../const/map-size.info';
import { Subject } from 'rxjs';
import { Intersection, Vector2Simple } from '../../math/intersection';
import { ManualTile, ManualTileLayer } from '../../manual-tiles/manual-tiles.helper';
export interface PossibleClickCoords {
  z: number;
  tileXY: Vector2Simple;
}

export class ManualTileInputHandler {
  private scene: Phaser.Scene;
  private input: Phaser.Input.InputPlugin;
  private tilemapLayer: Phaser.Tilemaps.TilemapLayer;

  onTileSelected: Subject<ManualTile> = new Subject<ManualTile>();
  onEditorTileSelected: Subject<PossibleClickCoords[]> = new Subject<PossibleClickCoords[]>();
  private readonly manualLayers: ManualTileLayer[];

  constructor(
    scene: Phaser.Scene,
    input: Phaser.Input.InputPlugin,
    tilemapLayer: Phaser.Tilemaps.TilemapLayer,
    manualLayers: ManualTileLayer[]
  ) {
    this.scene = scene; // todo for test
    this.input = input;
    this.tilemapLayer = tilemapLayer;
    this.manualLayers = manualLayers;
    this.existingTileSelectedListener();
    this.allTileSelectedListener();
  }

  private existingTileSelectedListener() {
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      const { worldX, worldY } = pointer;

      const searchedWorldX = worldX - MapSizeInfo.info.tileWidthHalf;
      const searchedWorldY = worldY - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

      const foundTile = this.geExistingTileAtWorldXY(searchedWorldX, searchedWorldY);

      //if (previousTile) {
      //  previousTile.tint = 0xffffff;
      //}
      if (foundTile) {
        //foundTile.tint = 0xff0000;
        //console.log('foundTile tile', foundTile.x, foundTile.y);
        this.onTileSelected.next(foundTile);
      }
    });
  }

  private allTileSelectedListener() {
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      const { worldX, worldY } = pointer;

      const searchedWorldX = worldX - MapSizeInfo.info.tileWidthHalf;
      const searchedWorldY = worldY - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

      const pointerToTileXY = this.tilemapLayer.worldToTileXY(searchedWorldX, searchedWorldY, true);

      const possibleCoords: PossibleClickCoords[] = [];
      for (const manualLayer of this.manualLayers) {
        const tileX = pointerToTileXY.x - manualLayer.z;
        const tileY = pointerToTileXY.y - manualLayer.z;
        if (
          -(manualLayer.z * MapSizeInfo.info.tileWidth) <= tileX &&
          tileX <= MapSizeInfo.info.width &&
          -(manualLayer.z * MapSizeInfo.info.tileHeight) <= tileY &&
          tileY <= MapSizeInfo.info.height
        ) {
          possibleCoords.push({
            z: manualLayer.z,
            tileXY: { x: tileX, y: tileY }
          });
        }
      }
      this.onEditorTileSelected.next(possibleCoords);
    });
  }

  private geExistingTileAtWorldXY(worldX: number, worldY: number): ManualTile | null {
    const pointerToTileXY = this.tilemapLayer.worldToTileXY(worldX, worldY, true);
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
            tile.tileConfig.x - tile.clickableZ === pointerToTileXY.x &&
            tile.tileConfig.y - tile.clickableZ === pointerToTileXY.y
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
    this.input.off(Phaser.Input.Events.POINTER_UP);
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
