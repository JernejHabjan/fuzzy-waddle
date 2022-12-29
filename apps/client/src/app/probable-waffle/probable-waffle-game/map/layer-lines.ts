import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';
import { ManualTilesHelper } from '../manual-tiles/manual-tiles.helper';

export class LayerLines {
  private currentLayerLinesGroup: Phaser.GameObjects.Group | null = null;

  constructor(private readonly scene: Scene) {}

  drawLayerLines(layer: number) {
    if (this.currentLayerLinesGroup !== null) {
      // remove all lines from group
      this.currentLayerLinesGroup.clear(true, true);
      this.currentLayerLinesGroup.destroy();
      this.currentLayerLinesGroup = null;
    }

    this.currentLayerLinesGroup = this.createLinesGroup(layer);
  }

  private createLinesGroup(layer: number): Phaser.GameObjects.Group {
    const byLayerOffset = layer * MapSizeInfo.info.tileHeight;
    const tileWidth = MapSizeInfo.info.tileWidth;
    const tileHeight = MapSizeInfo.info.tileHeight;

    const tileWidthHalf = tileWidth / 2;
    const tileHeightHalf = tileHeight / 2;

    const mapWidth = MapSizeInfo.info.width;
    const mapHeight = MapSizeInfo.info.height;

    // not offsetting, because we're placing block tiles there
    const tileCenterOffset = TilemapHelper.adjustTileWorldWithVerticalOffset(
      { x: MapSizeInfo.info.tileWidthHalf, y: MapSizeInfo.info.tileHeight },
      {
        offsetInPx: byLayerOffset
      }
    );

    const linesGroup = this.scene.add.group();

    this.drawLayerGridLines(
      linesGroup,
      -1,
      mapWidth,
      mapHeight,
      tileWidthHalf,
      tileHeightHalf,
      tileCenterOffset,
      layer
    );
    this.drawLayerGridLines(linesGroup, 1, mapHeight, mapWidth, tileWidthHalf, tileHeightHalf, tileCenterOffset, layer);
    return linesGroup;
  }

  /**
   * Working drawing so z index works on correct plane.
   * This means have to draw short lines and set their z index correctly (same way as in {@link placeTileOnLayer})
   */
  private drawLayerGridLines(
    group: Phaser.GameObjects.Group,
    axisModifier: 1 | -1,
    firstAxis: number,
    secondAxis: number,
    tileWidthHalf: number,
    tileHeightHalf: number,
    tileCenterOffset: Vector2Simple,
    layer: number
  ): void {
    const color = new Phaser.Display.Color();

    for (let y = 0; y < firstAxis + 1; y++) {
      // draw line secondAxis times
      for (let x = 1; x < secondAxis + 1; x++) {
        const txStart = -1 * axisModifier * (x - y - 1) * tileWidthHalf;
        const tyStart = (x + y - 1) * tileHeightHalf;

        const txEnd = -1 * axisModifier * (x - y) * tileWidthHalf;
        const tyEnd = (x + y) * tileHeightHalf;

        const worldStart: Vector2Simple = { x: tileCenterOffset.x + txStart, y: tileCenterOffset.y + tyStart };
        const worldEnd: Vector2Simple = { x: tileCenterOffset.x + txEnd, y: tileCenterOffset.y + tyEnd };

        const graphics = this.scene.add.graphics();
        color.random(50);
        graphics.lineStyle(1, color.color, 1);
        graphics.lineBetween(worldStart.x, worldStart.y, worldEnd.x, worldEnd.y);

        // minus 1 because we're starting for loops from top of the layer (+1 tile width and height)
        graphics.depth = ManualTilesHelper.getDepth({ x: x - 1, y: y - 1 }, tileCenterOffset, layer);

        group.add(graphics);
      }
    }
  }
}
