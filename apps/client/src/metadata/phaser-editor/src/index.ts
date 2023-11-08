import Phaser from 'phaser';
import preloadAssetPackUrl from '../static/assets/preload-asset-pack.json';
import Preload from './Template/scenes/Preload';
import Level from './Template/scenes/Level';

class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.pack('pack', preloadAssetPackUrl);
  }

  create() {
    this.scene.start('Preload');
  }
}

window.addEventListener('load', function () {
  const game = new Phaser.Game({
    width: 1280,
    height: 720,
    backgroundColor: '#2f2f2f',
    scale: {
      mode: Phaser.Scale.ScaleModes.FIT,
      autoCenter: Phaser.Scale.Center.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {}
    },
    input: {
      activePointers: 2
    },
    scene: [Boot, Preload, Level]
    // scene: [Boot, PreloadFlySquasher, FlySquasherScene]
  });

  game.scene.start('Boot');
});
