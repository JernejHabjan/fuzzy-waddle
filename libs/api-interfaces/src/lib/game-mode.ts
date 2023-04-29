import { GameModeBase } from './game-mode-base';
import { GameInstance } from './game-instance';
import { LittleMuncherGameInstanceMetadata, LittleMuncherHills } from './little-muncher/little-muncher';

export class LittleMuncherGameInstance extends GameInstance<
  LittleMuncherGameMode,
  LittleMuncherGameInstanceMetadata,
  LittleMuncherGameState,
  LittleMuncherPlayerState,
  LittleMuncherPlayerController,
  LittleMuncherSpectator
> {}

export class LittleMuncherGameMode extends GameModeBase {
  constructor(public hillToClimbOn: LittleMuncherHills) {
    super();
  }
}

export abstract class BaseGameState {}

export class LittleMuncherGameState extends BaseGameState {
  timeClimbing = 0; // in seconds
}

export abstract class BasePlayerState {
  constructor(public userId: string) {}
}

export class LittleMuncherPlayerState extends BasePlayerState {
  score = 0;
}

export abstract class BasePlayerController {
  constructor(public userId: string) {}
}

export class LittleMuncherPlayerController extends BasePlayerController {}

export abstract class BaseSpectator {
  constructor(public userId: string) {}
}

export class LittleMuncherSpectator extends BaseSpectator {}

export enum GameSessionState {
  WaitingForPlayers,
  StartingLevel,
  PlayingLevel,
  EndingLevel
}
