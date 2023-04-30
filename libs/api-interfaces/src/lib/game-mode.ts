import { BaseGameMode } from './base-game-mode';
import { GameInstance } from './game-instance';
import { LittleMuncherGameInstanceMetadata, LittleMuncherHills } from './little-muncher/little-muncher';

export class LittleMuncherGameInstance extends GameInstance<
  LittleMuncherGameMode,
  LittleMuncherGameInstanceMetadata,
  LittleMuncherGameState,
  LittleMuncherPlayer,
  LittleMuncherSpectator
> {
  init(gameInstanceId: string | null, userId: string | null) {
    this.initMetadata(new LittleMuncherGameInstanceMetadata(gameInstanceId, userId));
    // add player to game instance
    this.initPlayer(
      new LittleMuncherPlayer(userId, new LittleMuncherPlayerState(), new LittleMuncherPlayerController())
    );
  }
}

export class LittleMuncherGameMode extends BaseGameMode {
  constructor(public hillToClimbOn: LittleMuncherHills) {
    super();
  }
}

export abstract class BaseUserInfo {
  constructor(public userId: string | null) {}
}

export class LittleMuncherUserInfo extends BaseUserInfo {}

export abstract class BaseGameState {}

export class LittleMuncherGameState extends BaseGameState {
  timeClimbing = 0; // in seconds
  pause = false;
}

export abstract class BasePlayer<
  TPlayerState extends BasePlayerState = BasePlayerState,
  TPlayerController extends BasePlayerController = BasePlayerController
> {
  constructor(
    public userId: string | null,
    public playerState: TPlayerState,
    public playerController: TPlayerController
  ) {}
}

export class LittleMuncherPlayer extends BasePlayer<LittleMuncherPlayerState, LittleMuncherPlayerController> {}

export abstract class BasePlayerState {}

export class LittleMuncherPlayerState extends BasePlayerState {
  score = 0;
}

export abstract class BasePlayerController {}

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
