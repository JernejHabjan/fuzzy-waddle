import { GameInstance } from './game-instance';
import { GameModeBase } from './game-mode-base';

/**
 * Lives from lobby start to score screen
 */
export class GameSessionInstance<TGameMode extends GameModeBase, TGameInstance extends GameInstance> {
  gameModeRef: TGameMode | null = null;
  gameInstance: TGameInstance | null = null;

  // todo players: tweq ewe qw eqweqw;
  // todo spectators:w eq wqe qwe qwe qwe qw
}
