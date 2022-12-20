import { AnimationHelper, AnimDirection, LPCAnimType } from './animation-helper';

export class CharacterAnimationInitializer {
  animationKeys: Record<string, [LPCAnimType, AnimDirection][]> = {};

  private animHelper!: AnimationHelper;

  init(anims: Phaser.Animations.AnimationManager) {
    this.animHelper = new AnimationHelper(anims);
  }

  ensureAnimationKeys(textureName: string) {
    if (!this.animationKeys[textureName]) {
      this.animationKeys[textureName] = this.animHelper.createAnimationsForLPCSpriteSheet(textureName);
    }
  }
}
