import * as Phaser from 'phaser';
import { Pathfinder } from '../navigation/pathfinder';
import { MapSizeInfo } from '../const/map-size.info';
import { IsoHelper } from '../iso/iso-helper';

export class OtherInputHandler {
  private scene: Phaser.Scene;
  private input: Phaser.Input.InputPlugin;
  private pathfinder: Pathfinder;
  private navigationGrid: number[][];

  constructor(
    scene: Phaser.Scene,
    input: Phaser.Input.InputPlugin,
    pathfinder: Pathfinder,
    navigationGrid: number[][]
  ) {
    this.scene = scene; // todo temp because of tweens
    this.input = input;
    this.pathfinder = pathfinder;
    this.navigationGrid = navigationGrid;
  }

  rightPointerDown(pointer: Phaser.Input.Pointer, selected: Phaser.GameObjects.Sprite[]) {
    const { worldX, worldY } = pointer;

    const searchedWorldX = worldX - MapSizeInfo.info.tileWidthHalf;
    const searchedWorldY = worldY - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

    const pointerToTileXY = IsoHelper.isometricWorldToTileXY(searchedWorldX, searchedWorldY, true);

    const spriteOffset = MapSizeInfo.info.tileHeight / 2; // todo should be joined with getTileCenter fn
    selected.forEach((gameObject) => {
      const objectTileXY = IsoHelper.isometricWorldToTileXY(
        gameObject.x - MapSizeInfo.info.tileWidthHalf,
        gameObject.y - spriteOffset - MapSizeInfo.info.tileWidthHalf,
        true
      );
      if (
        0 <= pointerToTileXY.x &&
        pointerToTileXY.x <= MapSizeInfo.info.width &&
        0 <= pointerToTileXY.y &&
        pointerToTileXY.y <= MapSizeInfo.info.height
      ) {
        this.pathfinder.find(
          { x: objectTileXY.x, y: objectTileXY.y },
          { x: pointerToTileXY.x, y: pointerToTileXY.y },
          this.navigationGrid,
          (tileCenters) => {
            this.moveSpriteToTileCenters(gameObject, tileCenters);
          }
        );
      }
    });
  }

  /**
   * todo this needs to be improved - this is hacky
   */
  private moveSpriteToTileCenters(gameObject: Phaser.GameObjects.Sprite, tileCenters: { x: number; y: number }[]) {
    const addTween = (tileCenters: { x: number; y: number }[], i: number) => {
      if (i >= tileCenters.length) {
        return;
      }
      this.scene.tweens.add({
        targets: gameObject,
        x: tileCenters[i].x,
        y: tileCenters[i].y,
        duration: 1000,
        ease: Phaser.Math.Easing.Sine.InOut,
        yoyo: false,
        repeat: 0,
        onComplete: () => {
          addTween(tileCenters, i + 1);
        }
      });
    };

    addTween(tileCenters, 0);
  }

  destroy() {}
}
