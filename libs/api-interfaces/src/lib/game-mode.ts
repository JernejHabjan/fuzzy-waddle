import { GameInstance, GameInstanceData } from './game-instance';
import { LittleMuncherHill } from './little-muncher/little-muncher';
import { LittleMuncherGameInstanceMetadata, LittleMuncherGameInstanceMetadataData } from './game-instance-metadata';

export type LittleMuncherGameInstanceData = GameInstanceData<
  LittleMuncherGameInstanceMetadataData,
  LittleMuncherGameStateData,
  LittleMuncherGameModeData,
  LittleMuncherPlayerStateData,
  LittleMuncherPlayerControllerData,
  LittleMuncherSpectatorData
>;

export class LittleMuncherGameInstance extends GameInstance<
  LittleMuncherGameInstanceMetadataData,
  LittleMuncherGameInstanceMetadata,
  LittleMuncherGameStateData,
  LittleMuncherGameState,
  LittleMuncherGameModeData,
  LittleMuncherGameMode,
  LittleMuncherPlayerStateData,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayerState,
  LittleMuncherPlayerController,
  LittleMuncherPlayer,
  LittleMuncherSpectatorData,
  LittleMuncherSpectator
> {
  constructor(gameInstanceData?: LittleMuncherGameInstanceData) {
    super(
      {
        gameInstanceMetadata: LittleMuncherGameInstanceMetadata,
        gameMode: LittleMuncherGameMode,
        gameState: LittleMuncherGameState,
        spectator: LittleMuncherSpectator,
        playerController: LittleMuncherPlayerController,
        player: LittleMuncherPlayer,
        playerState: LittleMuncherPlayerState
      },
      gameInstanceData
    );
  }
}

export interface BaseData {}

export abstract class BaseGameMode<TData extends BaseData = BaseData> {
  protected constructor(public data: TData) {}

  resetData() {
    this.data = {} as TData;
  }
}

export interface LittleMuncherGameModeData extends BaseData {
  hill?: LittleMuncherHill;
}

export class LittleMuncherGameMode extends BaseGameMode<LittleMuncherGameModeData> {
  constructor(data?: LittleMuncherGameModeData) {
    super(data ?? {});
    if (!data) this.resetData();
  }
}

export abstract class BaseUserInfo {
  constructor(public userId: string | null) {}
}

export class LittleMuncherUserInfo extends BaseUserInfo {}

export abstract class BaseGameState<TData> {
  protected constructor(public data: TData) {}

  resetData() {
    this.data = {} as TData;
  }
}

export interface LittleMuncherGameStateData extends BaseData {
  timeClimbing?: number;
  pause?: boolean;
}

export class LittleMuncherGameState extends BaseGameState<LittleMuncherGameStateData> {
  constructor(data?: LittleMuncherGameStateData) {
    super(data ?? {});
    if (!data) this.resetData();
  }

  override resetData() {
    super.resetData();
    this.data = {
      timeClimbing: 0,
      pause: false
    };
  }
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

export class LittleMuncherPlayer extends BasePlayer<
  LittleMuncherPlayerStateData,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayerState,
  LittleMuncherPlayerController
> {}

export interface LittleMuncherPlayerStateData extends BaseData {
  score?: number;
  position?: LittleMuncherPosition;
  boost?: LittleMuncherBoost;
}

export abstract class BasePlayerState<TData extends BaseData = BaseData> {
  protected constructor(public data: TData) {}

  resetData() {
    this.data = {} as TData;
  }
}

export class LittleMuncherPlayerState extends BasePlayerState<LittleMuncherPlayerStateData> {
  constructor(data?: LittleMuncherPlayerStateData) {
    super(data ?? {});
    if (!data) this.resetData();
  }

  override resetData() {
    super.resetData();
    this.data = {
      score: 0,
      position: new LittleMuncherPosition(),
      boost: new LittleMuncherBoost()
    };
  }
}

export interface LittleMuncherPlayerControllerData {}

export abstract class BasePlayerController<TData extends BaseData = BaseData> {
  protected constructor(public data: TData) {}

  resetData() {
    this.data = {} as TData;
  }
}

export class LittleMuncherPlayerController extends BasePlayerController<LittleMuncherPlayerControllerData> {
  constructor(data?: LittleMuncherPlayerControllerData) {
    super(data ?? {});
    if (!data) this.resetData();
  }
}

export interface BaseSpectatorData {
  userId: string;
}

export interface LittleMuncherSpectatorData extends BaseSpectatorData {}

export abstract class BaseSpectator<TData extends BaseSpectatorData = BaseSpectatorData> {
  protected constructor(public data: TData) {}

  resetData() {
    this.data = {} as TData;
  }
}

export class LittleMuncherSpectator extends BaseSpectator<LittleMuncherSpectatorData> {
  constructor(data?: LittleMuncherSpectatorData) {
    super(data ?? ({} as LittleMuncherSpectatorData));
  }
}

export enum GameSessionState {
  NotPlaying,
  Playing
}

export class LittleMuncherPosition {
  x = 0;
}

export class LittleMuncherBoost {
  constructor(public boostMultiplier: number = 1, public durationInSec: number = 0) {}
}
