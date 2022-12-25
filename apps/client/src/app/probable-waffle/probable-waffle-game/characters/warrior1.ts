import * as Phaser from 'phaser';
import { AnimDirection, LpcAnimationHelper, LPCAnimType } from '../animation/lpc-animation-helper';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { SpriteHelper } from '../sprite/sprite-helper';
import ComponentService from '../services/component.service';
import UiBarComponent from '../hud/ui-bar-component';

export class Warrior1 extends Phaser.GameObjects.Sprite {
  static readonly textureName = 'warrior1';
  static readonly spriteSheet = {
    name: Warrior1.textureName,
    frameConfig: {
      frameWidth: 64,
      frameHeight: 64
    }
  };

  currentDir = 2; // south
  currentAnimGroup = 0; // first one is idle
  isIdle = false;
  tilePlacementData!: TilePlacementData;

  components = new ComponentService();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, Warrior1.textureName);

    this.components.addComponent(this, new UiBarComponent());

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
      this.components.destroy();
    });
  }

  static playAnimation(sprite: Phaser.GameObjects.Sprite, animName: LPCAnimType, dir: AnimDirection, idle: boolean) {
    sprite.play(`${animName}-${dir}` + (idle ? '-idle' : ''));
  }

  createCallback(tilePlacementData: TilePlacementData) {
    this.tilePlacementData = tilePlacementData;

    const spriteWorldPlacementInfo = SpriteHelper.getSpriteWorldPlacementInfo(tilePlacementData);
    this.depth = spriteWorldPlacementInfo.depth;

    this.setInteractive();
    this.playAnim();
  }

  playAnim() {
    const animKeys = LpcAnimationHelper.animKeys;
    const currentAnimations = [
      animKeys[this.currentAnimGroup * 4], // north
      animKeys[this.currentAnimGroup * 4 + 1], // west
      animKeys[this.currentAnimGroup * 4 + 2], // south
      animKeys[this.currentAnimGroup * 4 + 3] // east
    ];

    const [animType, animDir] = currentAnimations[this.currentDir];
    Warrior1.playAnimation(this, animType, animDir, this.isIdle);
    // console.log(`Playing: ${animType} - ${animDir} - ${this.isIdle ? 'idle' : 'not idle'}`);
  }


  managePointerClick(pointer: Phaser.Input.Pointer) {
    // if right click
    if (pointer.rightButtonDown()) {
      this.isIdle = !this.isIdle; // toggle
      return;
    }
    this.currentAnimGroup++;
    const animKeys = LpcAnimationHelper.animKeys;
    if (this.currentAnimGroup * 4 >= animKeys.length) {
      this.currentAnimGroup = 0;
    }
    this.playAnim();
  }

  managePointerWheel() {
    this.currentDir += 1;
    if (this.currentDir >= 4) {
      this.currentDir = 0;
    }
    this.playAnim();
  }

  private lateUpdate(time: number, delta: number) {
    this.components.update(time, delta);
  }
}
