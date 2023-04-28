import { GameModeBase } from './game-mode-base';
import { GameSessionInstance } from './game-session-instance';
import { LittleMuncherGameInstance, LittleMuncherHills } from './little-muncher/little-muncher';

export class LittleMuncherGameSessionInstance extends GameSessionInstance<
  LittleMuncherGameMode,
  LittleMuncherGameInstance
> {}

export class LittleMuncherGameMode extends GameModeBase {
  constructor(public hillToClimbOn: LittleMuncherHills) {
    super();
  }
}

export class LittleMuncherGameState {
  timeClimbing = 0; // in seconds
}

export class LittleMuncherPlayerState {
  score = 0;

  constructor(public userId: string) {}
}

export class LittleMuncherPlayerController {
  constructor(public userId: string) {}
}

export class LittleMuncherSpectator {
  constructor(public userId: string) {}
}

export enum LittleMuncherSessionState {
  WaitingForPlayers,
  StartingLevel,
  PlayingLevel,
  EndingLevel
}
