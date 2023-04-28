import {GameInstance, GameModeBase, GameSessionInstance} from '@fuzzy-waddle/api-interfaces';
import {CommunicatorService} from "../../../../little-muncher/game/communicator.service";

export interface BaseGameData<
  TCommunicator extends CommunicatorService = CommunicatorService,
  TGameMode extends GameModeBase = GameModeBase,
  TGameInstance extends GameInstance = GameInstance,
  TGameSessionInstance extends GameSessionInstance<TGameMode,TGameInstance> =GameSessionInstance<TGameMode,TGameInstance>
> {
  gameSessionInstance: TGameSessionInstance;
  communicator: TCommunicator;
}
