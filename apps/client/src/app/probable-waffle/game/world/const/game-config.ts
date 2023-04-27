import GrasslandScene from '../scenes/grassland.scene';
import { environment } from '../../../../../environments/environment';
import PlaygroundScene from '../scenes/playground.scene';
import { Scale, Types } from 'phaser';
import { baseGameConfig } from '../../../../shared/game/base-game.config';

export const probableWaffleGameConfig: Types.Core.GameConfig = {
  ...baseGameConfig,
  scene: [GrasslandScene, PlaygroundScene],
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: { y: 0 },
      debug: !environment.production
    }
  },
  pixelArt: true,
  backgroundColor: '#222'
};
