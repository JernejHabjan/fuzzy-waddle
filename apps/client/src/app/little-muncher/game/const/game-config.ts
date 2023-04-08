import { Scale, Types } from 'phaser';
import { environment } from '../../../../environments/environment';
import MainScene from '../main.scene';

export const GameContainerElement = 'gameCanvas';
export const littleMuncherGameConfig: Types.Core.GameConfig = {
  scene: [MainScene],
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
  backgroundColor: '#8bc34a',
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
