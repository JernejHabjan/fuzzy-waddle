import * as Phaser from 'phaser';
import { MapSizeInfo } from '../../const/map-size.info';
import { Subject } from 'rxjs';
import { Intersection } from '../../math/intersection';
import { ManualTile } from '../../manual-tiles/manual-tiles.helper';

export class ManualTileInputHandler {
  private scene: Phaser.Scene;
  private input: Phaser.Input.InputPlugin;
  private tilemapLayer: Phaser.Tilemaps.TilemapLayer;
  private mapSizeInfo: MapSizeInfo;

  onTileSelected: Subject<ManualTile> = new Subject<ManualTile>();
  private manualLayers: ManualTile[][];

  constructor(
    scene: Phaser.Scene,
    input: Phaser.Input.InputPlugin,
    tilemapLayer: Phaser.Tilemaps.TilemapLayer,
    manualLayers: ManualTile[][],
    mapSizeInfo: MapSizeInfo
  ) {
    this.scene = scene; // todo for test
    this.input = input;
    this.tilemapLayer = tilemapLayer;
    this.manualLayers = manualLayers;
    this.mapSizeInfo = mapSizeInfo;
    this.setupCursor();
  }

  private setupCursor() {
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      const { worldX, worldY } = pointer;

      const searchedWorldX = worldX - this.mapSizeInfo.tileWidth / 2;
      const searchedWorldY = worldY - this.mapSizeInfo.tileWidth / 2; // note tileWidth and not height

      const foundTile = this.getTileAtWorldXY(searchedWorldX, searchedWorldY);

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

  private getTileAtWorldXY(worldX: number, worldY: number): ManualTile | null {
    const pointerToTileXY = this.tilemapLayer.worldToTileXY(worldX, worldY, true);

    // search in all layers, starting from the last
    for (let i = this.manualLayers.length - 1; i >= 0; i--) {
      const layer = this.manualLayers[i];
      // search in the layer if tile x,y match the worldX, worldY
      for (let j = 0; j < layer.length; j++) {
        const tile = layer[j];

        if (tile.manualRectangleInputInterceptor) {
          const clickPointToTileWorldXY = {
            x: worldX + this.mapSizeInfo.tileWidth / 2,
            y: worldY + this.mapSizeInfo.tileWidth / 2
          };

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
          if (tile.x - tile.clickableZ === pointerToTileXY.x && tile.y - tile.clickableZ === pointerToTileXY.y) {
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
