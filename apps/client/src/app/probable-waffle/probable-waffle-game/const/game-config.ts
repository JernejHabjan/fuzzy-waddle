import * as Phaser from 'phaser';
import GrasslandScene from '../scenes/grassland.scene';
import { environment } from '../../../../environments/environment';

export const probableWaffleGameConfig: Phaser.Types.Core.GameConfig = {
  scene: [GrasslandScene],
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: { y: 0 },
      debug: !environment.production
    }
  },
  width: window.innerWidth,
  height: window.innerHeight,
  pixelArt: true,
  disableContextMenu: true,
  backgroundColor: '#222',
  scale: {
    mode: Phaser.Scale.FIT
  },
  fps: {
    target: 60,
    min: 30
    // forceSetTimeOut: true
  }
};
