import { BaseGameData } from '../../shared/game/phaser/game/base-game-data';
import { CommunicatorService } from './communicator.service';
import {
  LittleMuncherGameInstance,
  LittleMuncherGameMode,
  LittleMuncherGameSessionInstance
} from '@fuzzy-waddle/api-interfaces';

// extends BaseGameData type
export type LittleMuncherGameData = BaseGameData<
  CommunicatorService,
  LittleMuncherGameMode,
  LittleMuncherGameInstance,
  LittleMuncherGameSessionInstance
>;
