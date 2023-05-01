import { GameInstanceMetadata, GameInstanceMetadataData } from './game-instance-metadata';
import {
  BaseData,
  BaseGameMode,
  BaseGameState,
  BasePlayer,
  BasePlayerController,
  BasePlayerState,
  BaseSpectator,
  BaseSpectatorData,
  GameSessionState
} from './game-mode';

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
    userId: string | null;
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
  TGameInstanceMetadata extends GameInstanceMetadata<TGameInstanceMetadataData> = GameInstanceMetadata<TGameInstanceMetadataData>,
  TGameStateData extends BaseData = BaseData,
  TGameState extends BaseGameState<TGameStateData> = BaseGameState<TGameStateData>,
  TGameModeData extends BaseData = BaseData,
  TGameMode extends BaseGameMode<TGameModeData> = BaseGameMode<TGameModeData>,
  TPlayerStateData extends BaseData = BaseData,
  TPlayerControllerData extends BaseData = BaseData,
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
  gameInstanceMetadata: TGameInstanceMetadata | null = null;
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
      player: new (
        userId: string | null,
        playerState: any /*TPlayerState*/,
        playerController: any /*TPlayerController*/
      ) => TPlayer;
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
    this.gameMode = new constructors.gameMode(gameInstanceData?.gameModeData);
    this.gameState = new constructors.gameState(gameInstanceData?.gameStateData);
    this.players =
      gameInstanceData?.players?.map(
        (playerData) =>
          new constructors.player(
            playerData.userId,
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
        userId: player.userId,
        playerStateData: player.playerState.data,
        playerControllerData: player.playerController.data
      })),
      spectators: this.spectators.map((spectator) => spectator.data)
    };
  }

  initGame(gameModeData: TGameModeData) {
    if (!this.gameMode || !this.gameInstanceMetadata)
      throw new Error('Game mode or game instance metadata is not initialized');
    this.gameMode.data = gameModeData;
    this.gameInstanceMetadata.data.sessionState = GameSessionState.Playing;
  }

  initPlayer(userId: string | null, playerStateData: TPlayerStateData, playerControllerData: TPlayerControllerData) {
    const playerState = new this.constructors.playerState(playerStateData);
    const playerController = new this.constructors.playerController(playerControllerData);
    this.players.push(new this.constructors.player(userId, playerState, playerController));
  }

  initSpectator(spectatorData: TSpectatorData) {
    this.spectators.push(new this.constructors.spectator(spectatorData));
  }

  removeSpectator(userId: string) {
    this.spectators = this.spectators.filter((s) => s.data.userId !== userId);
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
    return this.players.find((p) => p.userId === userId) ?? null;
  }

  getSpectator(userId: string | null): TSpectator | null {
    return this.spectators.find((s) => s.data.userId === userId) ?? null;
  }

  isHost(userId: string | null): boolean {
    return this.gameInstanceMetadata?.data.createdBy === userId;
  }

  isPlayer(userId: string | null): boolean {
    return this.players.some((p) => p.userId === userId);
  }

  isSpectator(userId: string | null): boolean {
    return this.spectators.some((s) => s.data.userId === userId);
  }
}
