import GrasslandScene from '../scenes/grassland.scene';
import { environment } from '../../../../../environments/environment';
import PlaygroundScene from '../scenes/playground.scene';
import { Scale, Types } from 'phaser';

export const GameContainerElement = 'gameCanvas';
export const probableWaffleGameConfig: Types.Core.GameConfig = {
  scene: [GrasslandScene, PlaygroundScene],
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
    mode: Scale.RESIZE
  },
  fps: {
    target: 60,
    min: 30
    // forceSetTimeOut: true
  },
  parent: GameContainerElement
};
