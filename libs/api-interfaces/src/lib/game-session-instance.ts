import { GameInstance } from './game-instance';
import { GameModeBase } from './game-mode-base';

export class GameSessionInstance<TGameMode extends GameModeBase> {
  gameModeRef: TGameMode | null = null;
  gameInstance: GameInstance | null = null;
}
