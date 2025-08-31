import { Game } from "phaser";
import type { BaseGameData } from "./base-game-data";

export class BaseGame<TGameData extends BaseGameData = BaseGameData> extends Game {
  constructor(gameConfig?: Phaser.Types.Core.GameConfig, data?: TGameData) {
    super({
      ...gameConfig,
      callbacks: {
        ...gameConfig?.callbacks,
        preBoot: (game) => {
          game.registry.set("data", data);
        }
      }
    });
  }

  get data(): TGameData {
    return this.registry.get("data");
  }
}
