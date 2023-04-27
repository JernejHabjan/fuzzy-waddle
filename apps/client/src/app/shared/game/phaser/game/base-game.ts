import { Game } from 'phaser';
import { BaseGameData } from './base-game-data';

export class BaseGame extends Game {
  constructor(gameConfig?: Phaser.Types.Core.GameConfig, data?: BaseGameData) {
    super({
      ...gameConfig,
      callbacks: {
        ...gameConfig?.callbacks,
        preBoot: (game) => {
          game.registry.set('data', data);
        }
      }
    });
  }

  get data(): unknown {
    return this.registry.get('data');
  }
}
