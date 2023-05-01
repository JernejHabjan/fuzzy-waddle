import { BaseGameData } from '../../shared/game/phaser/game/base-game-data';
import { CommunicatorService } from './communicator.service';
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from '@fuzzy-waddle/api-interfaces';

export type LittleMuncherGameData = BaseGameData<CommunicatorService, LittleMuncherGameInstance, LittleMuncherUserInfo>;
