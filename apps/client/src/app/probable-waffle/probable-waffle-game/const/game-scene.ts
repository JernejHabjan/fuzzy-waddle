import { CharacterAnimationInitializer } from '../animation/character-animation-initializer';

export class GameScene {
  characterAnimationInitializer = new CharacterAnimationInitializer();

  start() {
    this.characterAnimationInitializer = new CharacterAnimationInitializer();
  }

  initAnims(anims: Phaser.Animations.AnimationManager) {
    this.characterAnimationInitializer.init(anims);
  }
}

export const gameScene = new GameScene();
