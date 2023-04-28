import { Game } from 'phaser';
import { BaseGameData } from './base-game-data';
import { GameModeBase } from '@fuzzy-waddle/api-interfaces';

export class BaseGame<TGameMode extends GameModeBase, TGameData extends BaseGameData<TGameMode>> extends Game {
  constructor(gameConfig?: Phaser.Types.Core.GameConfig, data?: TGameData) {
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

  get data(): TGameData {
    return this.registry.get('data');
  }
}
