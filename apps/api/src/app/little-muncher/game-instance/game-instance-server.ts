import { User } from '@supabase/supabase-js';
import {
  LittleMuncherGameInstanceCreateDto,
  LittleMuncherGameMode,
  LittleMuncherGameState,
  LittleMuncherPlayerController,
  LittleMuncherPlayerState,
  LittleMuncherSessionState,
  LittleMuncherSpectator
} from '@fuzzy-waddle/api-interfaces';

export class GameInstanceServer {
  createdOn: Date;
  createdBy: string;
  gameInstanceId: string;
  sessionState: LittleMuncherSessionState;
  gameMode?: LittleMuncherGameMode;
  gameState?: LittleMuncherGameState;
  playerStates?: LittleMuncherPlayerState[];
  playerControllers?: LittleMuncherPlayerController[];
  spectators: LittleMuncherSpectator[] = [];

  constructor(body: LittleMuncherGameInstanceCreateDto, user: User) {
    this.createdOn = new Date();
    this.createdBy = user.id;
    this.gameInstanceId = body.gameInstanceId;
    this.sessionState = LittleMuncherSessionState.WaitingForPlayers;
  }
}
