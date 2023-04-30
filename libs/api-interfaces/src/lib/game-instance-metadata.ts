import { BaseData, GameSessionState } from './game-mode';

export interface GameInstanceDataDto {
  gameInstanceId: string;
}

export class GameInstanceMetadataData extends BaseData<GameInstanceMetadataData> {
  readonly gameInstanceId: string;
  readonly createdOn: Date;
  readonly createdBy: string | null;
  updatedOn: Date | null = null;
  sessionState: GameSessionState;
}

export abstract class GameInstanceMetadata<TData extends GameInstanceMetadataData = GameInstanceMetadataData> {
  abstract data: TData;
}
