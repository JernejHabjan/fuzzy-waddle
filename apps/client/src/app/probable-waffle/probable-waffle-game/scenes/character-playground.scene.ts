import * as Phaser from 'phaser';
import { Scenes } from './scenes';
import { CreateSceneFromObjectConfig } from '../interfaces/scene-config.interface';
import { AnimationHelper, AnimDirection, LPCAnimType } from '../animation/animation-helper';

export default class CharacterPlaygroundScene extends Phaser.Scene implements CreateSceneFromObjectConfig {
  private brawlerTextureName = 'brawler';
  private currentDir = 2; // south
  private currentAnimGroup = 0; // first one is idle
  private isIdle = false;
  private brawlerAnimationKeys!: [LPCAnimType, AnimDirection][];
  private animHelper!: AnimationHelper;
  private cody!: Phaser.GameObjects.Sprite;
  constructor() {
    super({ key: Scenes.CharacterPlaygroundScene });
  }

  preload() {
    this.load.spritesheet(this.brawlerTextureName, 'assets/probable-waffle/spritesheets/warrior1.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    this.animHelper = new AnimationHelper(this.anims);
    this.brawlerAnimationKeys = this.animHelper.createAnimationsForLPCSpriteSheet(this.brawlerTextureName);

    this.cody = this.add.sprite(600, 370, this.brawlerTextureName);
    this.cody.setScale(8);
    this.playAnim();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // if right click
      if (pointer.rightButtonDown()) {
        this.isIdle = !this.isIdle; // toggle
        return;
      }
      this.currentAnimGroup++;
      if (this.currentAnimGroup * 4 >= this.brawlerAnimationKeys.length) {
        this.currentAnimGroup = 0;
      }
      this.playAnim();
    });

    this.input.on(Phaser.Input.Events.POINTER_WHEEL, () => {
      this.currentDir += 1;
      if (this.currentDir >= 4) {
        this.currentDir = 0;
      }
      this.playAnim();
    });
  }

  private playAnim() {
    const currentAnimations = [
      this.brawlerAnimationKeys[this.currentAnimGroup * 4], // north
      this.brawlerAnimationKeys[this.currentAnimGroup * 4 + 1], // west
      this.brawlerAnimationKeys[this.currentAnimGroup * 4 + 2], // south
      this.brawlerAnimationKeys[this.currentAnimGroup * 4 + 3] // east
    ];

    const [animType, animDir] = currentAnimations[this.currentDir];
    this.animHelper.playAnimation(this.cody, animType, animDir, this.isIdle);
    console.log(`Playing: ${animType} - ${animDir} - ${this.isIdle ? 'idle' : 'not idle'}`);
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
  }
}
