import { BaseGameData } from '../../shared/game/phaser/game/base-game-data';
import { CommunicatorService } from './communicator.service';
import { GameModeBase } from '@fuzzy-waddle/api-interfaces';

// extends BaseGameData type
export type LittleMuncherGameData<TGameMode extends GameModeBase> = BaseGameData<TGameMode> & {
  communicator: CommunicatorService;
};
