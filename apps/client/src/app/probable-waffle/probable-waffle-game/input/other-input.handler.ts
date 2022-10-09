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

  bindOtherPossiblyUsefulInputHandlers(selected: Phaser.GameObjects.Sprite[]) {
    this.input.on(
      Phaser.Input.Events.GAMEOBJECT_DOWN,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        console.log(Phaser.Input.Events.GAMEOBJECT_DOWN, pointer, gameObject);

        if (gameObject instanceof Phaser.GameObjects.Sprite || gameObject instanceof Phaser.GameObjects.Image) {
          gameObject.setTint(0xff0000);
        }
      }
    );

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        console.log('right pointer down');

        const { worldX, worldY } = pointer;

        const searchedWorldX = worldX - MapSizeInfo.info.tileWidthHalf;
        const searchedWorldY = worldY - MapSizeInfo.info.tileWidthHalf; // note tileWidth and not height

        const pointerToTileXY = IsoHelper.isometricWorldToTileXY(searchedWorldX, searchedWorldY, true);

        const spriteOffset = MapSizeInfo.info.tileHeight / 2; // todo should be joined with getTileCenter fn
        selected.forEach((gameObject) => {
          const objectTileXY = IsoHelper.isometricWorldToTileXY(gameObject.x - MapSizeInfo.info.tileWidthHalf,gameObject.y - spriteOffset - MapSizeInfo.info.tileWidthHalf, true);
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
                // move sprite to tile centers with delay
                // create phaser tweens

                // todo this needs to be improved - this is hacky
                const addTween = (tileCenters: { x: number; y: number }[], i: number) => {
                  if (i >= tileCenters.length) {
                    return;
                  }
                  this.scene.tweens.add({
                    targets: gameObject,
                    x: tileCenters[i].x,
                    y: tileCenters[i].y,
                    duration: 1000,
                    ease: 'Power1',
                    yoyo: false,
                    repeat: 0,
                    onComplete: () => {
                      addTween(tileCenters, i + 1);
                    }
                  });
                };

                addTween(tileCenters, 0);
              }
            );
          }
        });

        // this.cameras.main.stopFollow();
      }
    });

    this.input.on(
      Phaser.Input.Events.GAME_OUT,
      () => {
        // todo if (this.portalPlaceholder) {
        // todo   this.hidePortalPlaceholder();
        // todo }
      },
      this
    );
  }

  destroy() {
    this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN);
    this.input.off(Phaser.Input.Events.POINTER_DOWN);
    this.input.off(Phaser.Input.Events.GAME_OUT);
  }
}
