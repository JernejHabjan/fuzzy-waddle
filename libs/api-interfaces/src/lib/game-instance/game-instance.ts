import { GameInstanceMetadata, GameInstanceMetadataData } from "./game-instance-metadata";
import { BaseData } from "./data";
import { BaseSpectator, BaseSpectatorData } from "./spectator";
import { BaseGameState } from "./game-state";
import { BaseGameMode } from "./game-mode";
import { BasePlayerState } from "./player/player-state";
import { BasePlayerController, BasePlayerControllerData } from "./player/player-controller";
import { BasePlayer } from "./player/player";

export interface GameInstanceDataDto {
  gameInstanceId: string;
}

export type GameInstanceData<
  TGameInstanceMetadataData extends GameInstanceMetadataData = GameInstanceMetadataData,
  TGameStateData extends BaseData = BaseData,
  TGameModeData extends BaseData = BaseData,
  TPlayerStateData extends BaseData = BaseData,
  TPlayerControllerData extends BaseData = BaseData,
  TSpectatorData extends BaseSpectatorData = BaseSpectatorData
> = {
  gameInstanceMetadataData?: TGameInstanceMetadataData;
  gameStateData?: TGameStateData;
  gameModeData?: TGameModeData;
  players?: {
    playerControllerData?: TPlayerControllerData;
    playerStateData?: TPlayerStateData;
  }[];
  spectators?: TSpectatorData[];
};

/**
 * Lives from lobby start to score screen
 */
export abstract class GameInstance<
  TGameInstanceMetadataData extends GameInstanceMetadataData = GameInstanceMetadataData,
  TGameInstanceMetadata extends
    GameInstanceMetadata<TGameInstanceMetadataData> = GameInstanceMetadata<TGameInstanceMetadataData>,
  TGameStateData extends BaseData = BaseData,
  TGameState extends BaseGameState<TGameStateData> = BaseGameState<TGameStateData>,
  TGameModeData extends BaseData = BaseData,
  TGameMode extends BaseGameMode<TGameModeData> = BaseGameMode<TGameModeData>,
  TPlayerStateData extends BaseData = BaseData,
  TPlayerControllerData extends BasePlayerControllerData = BasePlayerControllerData,
  TPlayerState extends BasePlayerState<TPlayerStateData> = BasePlayerState<TPlayerStateData>,
  TPlayerController extends BasePlayerController<TPlayerControllerData> = BasePlayerController<TPlayerControllerData>,
  TPlayer extends BasePlayer<TPlayerStateData, TPlayerControllerData, TPlayerState, TPlayerController> = BasePlayer<
    TPlayerStateData,
    TPlayerControllerData,
    TPlayerState,
    TPlayerController
  >,
  TSpectatorData extends BaseSpectatorData = BaseSpectatorData,
  TSpectator extends BaseSpectator<TSpectatorData> = BaseSpectator<TSpectatorData>
> {
  gameMode: TGameMode | null = null;
  gameInstanceMetadata: TGameInstanceMetadata;
  gameState: TGameState | null = null;
  players: TPlayer[] = [];
  spectators: TSpectator[] = [];

  protected constructor(
    private readonly constructors: {
      gameInstanceMetadata: new (...args: any /*TGameInstanceMetadataData*/) => TGameInstanceMetadata;
      gameMode: new (...args: any /*TGameModeData*/) => TGameMode;
      gameState: new (...args: any /*TGameStateData */) => TGameState;
      playerState: new (...args: any /*TPlayerStateData */) => TPlayerState;
      playerController: new (...args: any /*TPlayerControllerData */) => TPlayerController;
      player: new (playerState: any /*TPlayerState*/, playerController: any /*TPlayerController*/) => TPlayer;
      spectator: new (...args: any /*TSpectatorData*/) => TSpectator;
    },
    gameInstanceData?: GameInstanceData<
      TGameInstanceMetadataData,
      TGameStateData,
      TGameModeData,
      TPlayerStateData,
      TPlayerControllerData,
      TSpectatorData
    >
  ) {
    this.gameInstanceMetadata = new constructors.gameInstanceMetadata(gameInstanceData?.gameInstanceMetadataData);
    this.gameMode = gameInstanceData?.gameModeData ? new constructors.gameMode(gameInstanceData?.gameModeData) : null;
    this.gameState = gameInstanceData?.gameStateData
      ? new constructors.gameState(gameInstanceData?.gameStateData)
      : null;
    this.players =
      gameInstanceData?.players?.map(
        (playerData) =>
          new constructors.player(
            new constructors.playerState(playerData.playerStateData),
            new constructors.playerController(playerData.playerControllerData)
          )
      ) ?? [];
    this.spectators = gameInstanceData?.spectators?.map((spectator) => new constructors.spectator(spectator)) ?? [];
  }

  get data(): GameInstanceData<
    TGameInstanceMetadataData,
    TGameStateData,
    TGameModeData,
    TPlayerStateData,
    TPlayerControllerData,
    TSpectatorData
  > {
    return {
      gameInstanceMetadataData: this.gameInstanceMetadata?.data,
      gameStateData: this.gameState?.data,
      gameModeData: this.gameMode?.data,
      players: this.players.map((player) => ({
        playerStateData: player.playerState.data,
        playerControllerData: player.playerController.data
      })),
      spectators: this.spectators.map((spectator) => spectator.data)
    };
  }

  initPlayer(
    playerControllerData: TPlayerControllerData,
    playerStateData: TPlayerStateData | undefined = undefined
  ): TPlayer {
    const playerState = new this.constructors.playerState(playerStateData);
    const playerController = new this.constructors.playerController(playerControllerData);
    return new this.constructors.player(playerState, playerController);
  }

  initSpectator(spectatorData: TSpectatorData): TSpectator {
    return new this.constructors.spectator(spectatorData);
  }

  removeSpectator(userId: string) {
    this.spectators = this.spectators.filter((s) => s.data.userId !== userId);
  }

  removePlayerByUserId(userId: string) {
    this.players = this.players.filter((p) => p.playerController.data.userId !== userId);
  }

  removePlayerByPlayer(player: TPlayer) {
    this.players = this.players.filter((p) => p !== player);
  }

  addPlayer(player: TPlayer) {
    this.players.push(player);
  }

  addSpectator(spectator: TSpectator) {
    this.spectators.push(spectator);
  }

  stopLevel() {
    this.gameInstanceMetadata?.resetData();
    this.gameMode?.resetData();
    this.gameState?.resetData();
    this.players?.forEach((p) => {
      p.playerState?.resetData();
      p.playerController?.resetData();
    });
    this.spectators?.forEach((s) => s.resetData());
  }

  getPlayer(userId: string | null): TPlayer | null {
    return this.players.find((p) => p.playerController.data.userId === userId) ?? null;
  }

  getSpectator(userId: string | null): TSpectator | null {
    return this.spectators.find((s) => s.data.userId === userId) ?? null;
  }

  isHost(userId: string | null): boolean {
    return this.gameInstanceMetadata?.data.createdBy === userId;
  }

  isPlayer(userId: string | null): boolean {
    return this.players.some((p) => p.playerController.data.userId === userId);
  }

  isSpectator(userId: string | null): boolean {
    return this.spectators.some((s) => s.data.userId === userId);
  }
}
