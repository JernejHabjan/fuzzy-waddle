import { GameInstance } from './game-instance';
import { GameModeBase } from './game-mode-base';

/**
 * Lives from lobby start to score screen
 */
export class GameSessionInstance<TGameMode extends GameModeBase> {
  gameModeRef: TGameMode | null = null;
  gameInstance: GameInstance | null = null;
}
