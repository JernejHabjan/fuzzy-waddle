import { GameModeBase, GameSessionInstance } from '@fuzzy-waddle/api-interfaces';

export interface BaseGameData<TGameMode extends GameModeBase> {
  gameSessionInstance: GameSessionInstance<TGameMode>;
}
