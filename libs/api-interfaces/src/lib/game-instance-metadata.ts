import { Guid } from './uuid';
import { GameSessionState } from './game-mode';

export interface GameInstanceDataDto {
  gameInstanceId: string;
}

export abstract class GameInstanceMetadata {
  readonly gameInstanceId: string;
  readonly createdOn: Date;
  readonly createdBy?: string;
  sessionState: GameSessionState;

  constructor(gameInstanceId: string | null = null, userId?: string) {
    this.gameInstanceId = gameInstanceId ?? new Guid().value;
    this.createdOn = new Date();
    this.createdBy = userId;
    this.sessionState = GameSessionState.WaitingForPlayers;
  }
}
