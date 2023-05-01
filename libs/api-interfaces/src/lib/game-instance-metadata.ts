import { GameSessionState } from './game-mode';
import { Guid } from './uuid';

export interface GameInstanceDataDto {
  gameInstanceId: string;
}

export interface GameInstanceMetadataData {
  gameInstanceId?: string;
  createdOn?: Date;
  createdBy: string | null;
  updatedOn?: Date;
  sessionState?: GameSessionState;
}

export abstract class GameInstanceMetadata<TData extends GameInstanceMetadataData = GameInstanceMetadataData> {
  data: TData;

  constructor(data?: TData) {
    this.data = data ?? ({} as TData);
    this.data.gameInstanceId ??= new Guid().value;
    this.data.createdOn ??= new Date();
    this.data.sessionState ??= GameSessionState.WaitingForPlayers;
  }
}

export interface LittleMuncherGameInstanceMetadataData extends GameInstanceMetadataData {}

export class LittleMuncherGameInstanceMetadata extends GameInstanceMetadata<LittleMuncherGameInstanceMetadataData> {}
