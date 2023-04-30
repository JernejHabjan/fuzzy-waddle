import { GameInstanceMetadata, GameInstanceMetadataData } from '../game-instance-metadata';
import { Guid } from '../uuid';
import { GameSessionState } from '../game-mode';

export enum LittleMuncherHills {
  Stefka = 0,
  Jakob = 1
}

export interface LittleMuncherLevel {
  hillName: LittleMuncherHills;
}

export interface LittleMuncherGameCreate {
  level: LittleMuncherLevel;
  player_ids: string[];
}

export interface LittleMuncherGameCreateDto extends LittleMuncherGameCreate {
  gameInstanceId: string;
}

export class LittleMuncherGameInstanceMetadata extends GameInstanceMetadata {
  data: GameInstanceMetadataData;

  constructor(gameInstanceId: string | null = null, userId: string | null) {
    super();
    this.data = {
      gameInstanceId: gameInstanceId ?? new Guid().value,
      createdOn: new Date(),
      createdBy: userId,
      updatedOn: null,
      sessionState: GameSessionState.WaitingForPlayers
    };
  }
}
