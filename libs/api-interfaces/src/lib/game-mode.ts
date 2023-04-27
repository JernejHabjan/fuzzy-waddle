import { LittleMuncherHills } from './api-interfaces';

export class LittleMuncherGameMode {
  constructor(public hillToClimbOn: LittleMuncherHills) {}
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
