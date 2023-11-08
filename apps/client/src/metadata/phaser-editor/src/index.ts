import Phaser from 'phaser';
import preloadAssetPackUrl from '../static/assets/preload-asset-pack.json';
import Map1 from './ProbableWaffle/scenes/Map1';
import PreloadProbableWaffle from './ProbableWaffle/scenes/PreloadProbableWaffle';

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
    pixelArt: true,
    // scene: [Boot, Preload, Level]
    // scene: [Boot, PreloadFlySquasher, FlySquasherScene]
    scene: [Boot, PreloadProbableWaffle, Map1]
  });

  game.scene.start('Boot');
});
