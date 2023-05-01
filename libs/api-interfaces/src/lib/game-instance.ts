import { GameInstanceMetadata, GameInstanceMetadataData } from './game-instance-metadata';
import { BaseGameMode } from './base-game-mode';
import { BaseData, BaseGameState, BasePlayer, BaseSpectator, BaseSpectatorData, GameSessionState } from './game-mode';

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
  TPlayer extends BasePlayer<TPlayerStateData, TPlayerControllerData> = BasePlayer<
    TPlayerStateData,
    TPlayerControllerData
  >,
  TSpectatorData extends BaseSpectatorData = BaseSpectatorData,
  TSpectator extends BaseSpectator<TSpectatorData> = BaseSpectator<TSpectatorData>
> {
  constructor(gameInstanceData?: {
    gameInstanceMetadataData: TGameInstanceMetadataData;
    gameStateData: TGameStateData;
    gameModeData: TGameModeData;
    players: {
      playerControllerData: TPlayerControllerData;
      playerStateData: TPlayerStateData;
    }[];
    spectators: TSpectatorData[];
  }) {
    if (gameInstanceData) {
      // create a new game instance from existing one
      // WE SHOULD NOT GET WHOLE GAME INSTANCE FROM SEVER BUT ONLY GAMEMODEDATA, GameInstanceMetadataData, GAMESTATEDATA, PLAYER[playerControllerData, playerStateData], SPECTATORDATA
      // this.gameMode = gameInstance.gameMode; FIX
      // this.gameInstanceMetadata = gameInstance.gameInstanceMetadata; FIX
      // this.gameState = gameInstance.gameState; FIX
      // this.players = gameInstance.players; FIX
      // this.spectators = gameInstance.spectators; FIX

      this.gameMode = new BaseGameMode(gameInstanceData.gameModeData);
    }
  }

  abstract init(gameInstanceId: string | null, userId: string | null);

  gameMode: TGameMode | null = null;
  gameInstanceMetadata: TGameInstanceMetadata | null = null;
  gameState: TGameState | null = null;
  players: TPlayer[] = [];
  spectators: TSpectator[] = [];

  protected initMetadata(gameInstanceMetadata: TGameInstanceMetadata) {
    this.gameInstanceMetadata = gameInstanceMetadata;
  }

  initGame(gameMode: TGameMode, gameState: TGameState) {
    this.gameMode = gameMode;
    this.gameState = gameState;
  }

  initPlayer(player: TPlayer) {
    this.players.push(player);
  }

  initSpectator(spectator: TSpectator) {
    this.spectators.push(spectator);
  }

  removeSpectator(userId: string) {
    this.spectators = this.spectators.filter((s) => s.data.userId !== userId);
  }

  stopLevel() {
    this.gameMode = null;
    this.gameState = null;
    this.players = [];
    this.spectators = [];
    if (this.gameInstanceMetadata) {
      this.gameInstanceMetadata.data.sessionState = GameSessionState.EndingLevel;
    }
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
