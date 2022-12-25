import * as Phaser from 'phaser';
import { AnimationHelper, AnimDirection, LPCAnimType } from '../animation/animation-helper';
import { gameScene } from '../const/game-scene';
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
  private animKeys!: [LPCAnimType, AnimDirection][];
  tilePlacementData!: TilePlacementData;

  components = new ComponentService();
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, Warrior1.textureName);

    this.components.addComponent(this, new UiBarComponent());

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this)
    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
      this.components.destroy();
    });
  }

  createCallback(tilePlacementData: TilePlacementData) {
    this.tilePlacementData = tilePlacementData;

    gameScene.characterAnimationInitializer.ensureAnimationKeys(Warrior1.spriteSheet.name);
    this.animKeys = gameScene.characterAnimationInitializer.animationKeys[Warrior1.spriteSheet.name];

    const spriteWorldPlacementInfo = SpriteHelper.getSpriteWorldPlacementInfo(tilePlacementData);
    this.depth = spriteWorldPlacementInfo.depth;

    this.setInteractive();
    this.playAnim();
  }

  playAnim() {
    const currentAnimations = [
      this.animKeys[this.currentAnimGroup * 4], // north
      this.animKeys[this.currentAnimGroup * 4 + 1], // west
      this.animKeys[this.currentAnimGroup * 4 + 2], // south
      this.animKeys[this.currentAnimGroup * 4 + 3] // east
    ];

    const [animType, animDir] = currentAnimations[this.currentDir];
    AnimationHelper.playAnimation(this, animType, animDir, this.isIdle);
    // console.log(`Playing: ${animType} - ${animDir} - ${this.isIdle ? 'idle' : 'not idle'}`);
  }

  managePointerClick(pointer: Phaser.Input.Pointer) {
    // if right click
    if (pointer.rightButtonDown()) {
      this.isIdle = !this.isIdle; // toggle
      return;
    }
    this.currentAnimGroup++;
    const animKeys = gameScene.characterAnimationInitializer.animationKeys[Warrior1.spriteSheet.name];
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

  private lateUpdate(time:number, delta:number){
    this.components.update(time, delta);
  }
}
