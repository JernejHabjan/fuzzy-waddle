import * as Phaser from 'phaser';
import { AnimDirection, LPCAnimType } from './lpc-animation-helper';

export class SpriteAnimationHelper {
  static playAnimation(sprite: Phaser.GameObjects.Sprite, animName: LPCAnimType, dir: AnimDirection, idle: boolean) {
    sprite.play(`${animName}-${dir}` + (idle ? '-idle' : ''));
  }
}
