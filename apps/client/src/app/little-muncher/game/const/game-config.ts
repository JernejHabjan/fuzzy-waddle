import { Types } from 'phaser';
import { environment } from '../../../../environments/environment';
import MainScene from '../main.scene';
import { baseGameConfig } from '../../../shared/game/base-game.config';

export const littleMuncherGameConfig: Types.Core.GameConfig = {
  ...baseGameConfig,
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: { y: 0 },
      debug: !environment.production
    }
  },
  pixelArt: true,
  backgroundColor: '#8bc34a'
};
