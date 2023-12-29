import { Guid } from "../uuid";
import { GameSessionState } from "./session";

export interface GameInstanceMetadataData {
  gameInstanceId?: string;
  createdOn?: Date;
  createdBy: string | null;
  updatedOn?: Date;
  sessionState?: GameSessionState;
  joinable?: boolean;
}

export abstract class GameInstanceMetadata<TData extends GameInstanceMetadataData = GameInstanceMetadataData> {
  data: TData;

  constructor(data?: TData) {
    this.data = data ?? ({} as TData);
    this.data.gameInstanceId ??= new Guid().value;
    this.data.createdOn ??= new Date();
    this.data.sessionState ??= GameSessionState.NotStarted;
    this.data.updatedOn ??= new Date();
    this.data.joinable ??= false;
  }

  resetData() {
    this.data.sessionState = GameSessionState.NotStarted;
  }
}
