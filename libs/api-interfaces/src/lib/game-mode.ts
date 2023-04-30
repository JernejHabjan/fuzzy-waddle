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

export abstract class BaseData<T = Record<string, any>> {}

export class LittleMuncherGameModeData extends BaseData<LittleMuncherGameModeData> {
  hillToClimbOn: LittleMuncherHills;
}

export class LittleMuncherGameMode extends BaseGameMode<LittleMuncherGameModeData> {
  constructor(data: LittleMuncherGameModeData) {
    super();
    this.data = data;
  }
}

export abstract class BaseUserInfo {
  constructor(public userId: string | null) {}
}

export class LittleMuncherUserInfo extends BaseUserInfo {}

export abstract class BaseGameState<TData extends BaseData = BaseData> {
  data: TData;
}

export class LittleMuncherGameStateData extends BaseData<LittleMuncherGameModeData> {
  timeClimbing = 0; // in seconds
  pause = false;
}

export class LittleMuncherGameState extends BaseGameState<LittleMuncherGameStateData> {
  data: LittleMuncherGameStateData = new LittleMuncherGameStateData();
}

export abstract class BasePlayer<
  TPlayerStateData extends BaseData = BaseData,
  TPlayerControllerData extends BaseData = BaseData,
  TPlayerState extends BasePlayerState<TPlayerStateData> = BasePlayerState<TPlayerStateData>,
  TPlayerController extends BasePlayerController<TPlayerControllerData> = BasePlayerController<TPlayerControllerData>
> {
  constructor(
    public userId: string | null,
    public playerState: TPlayerState,
    public playerController: TPlayerController
  ) {}
}

export class LittleMuncherPlayer extends BasePlayer<LittleMuncherPlayerState, LittleMuncherPlayerController> {}

export class LittleMuncherPlayerStateData extends BaseData<LittleMuncherPlayerStateData> {
  score = 0;
  position = new LittleMuncherPosition();
  boost = new LittleMuncherBoost();
}

export abstract class BasePlayerState<TData extends BaseData = BaseData> {
  data: TData;
}

export class LittleMuncherPlayerState extends BasePlayerState<LittleMuncherPlayerStateData> {
  data: LittleMuncherPlayerStateData = new LittleMuncherPlayerStateData();
}

export class LittleMuncherPlayerControllerData extends BaseData<LittleMuncherPlayerControllerData> {
  data: LittleMuncherPlayerControllerData = new LittleMuncherPlayerControllerData();
}

export abstract class BasePlayerController<TData extends BaseData = BaseData> {
  data: TData;
}

export class LittleMuncherPlayerController extends BasePlayerController<LittleMuncherPlayerControllerData> {}

export class BaseSpectatorData extends BaseData<LittleMuncherSpectatorData> {
  userId: string;
}

export class LittleMuncherSpectatorData extends BaseSpectatorData {
  data = new LittleMuncherSpectatorData();
}

export abstract class BaseSpectator<TData extends BaseSpectatorData = BaseSpectatorData> {
  data: TData;

  constructor(userId: string) {
    this.data.userId = userId;
  }
}

export class LittleMuncherSpectator extends BaseSpectator {}

export enum GameSessionState {
  WaitingForPlayers,
  StartingLevel,
  PlayingLevel,
  EndingLevel
}

export class LittleMuncherPosition {
  x = 0;
}

export class LittleMuncherBoost {
  constructor(public boostMultiplier: number = 1, public durationInSec: number = 0) {}
}
