import { BaseGameData } from '../../shared/game/phaser/game/base-game-data';
import { CommunicatorService } from './communicator.service';

// extends BaseGameData type
export type LittleMuncherGameData = BaseGameData & {
  communicator: CommunicatorService;
};
