import { GameInstance } from '@fuzzy-waddle/api-interfaces';
import { CommunicatorService } from '../../../../little-muncher/game/communicator.service';

export interface BaseGameData<
  TCommunicator extends CommunicatorService = CommunicatorService,
  TGameInstance extends GameInstance = GameInstance
> {
  gameInstance: TGameInstance;
  communicator: TCommunicator;
}
