import { AnimDirection, LPCAnimType } from './lpc-animation-helper';
import { GameObjects } from 'phaser';

export class SpriteAnimationHelper {
  static playAnimation(sprite: GameObjects.Sprite, animName: LPCAnimType, dir: AnimDirection, idle: boolean) {
    sprite.play(`${animName}-${dir}` + (idle ? '-idle' : ''));
  }
}
