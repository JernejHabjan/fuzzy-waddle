import { GameInstanceMetadata } from './game-instance-metadata';
import { BaseGameMode } from './base-game-mode';
import { BaseGameState, BasePlayer, BaseSpectator, GameSessionState } from './game-mode';

/**
 * Lives from lobby start to score screen
 */
export abstract class GameInstance<
  TGameMode extends BaseGameMode = BaseGameMode,
  TGameInstanceMetadata extends GameInstanceMetadata = GameInstanceMetadata,
  TGameState extends BaseGameState = BaseGameState,
  TPlayer extends BasePlayer = BasePlayer,
  TSpectator extends BaseSpectator = BaseSpectator
> {
  constructor(gameInstance?: GameInstance<TGameMode, TGameInstanceMetadata, TGameState, TPlayer, TSpectator>) {
    if (gameInstance) {
      // create a new game instance from existing one
      this.gameMode = gameInstance.gameMode;
      this.gameInstanceMetadata = gameInstance.gameInstanceMetadata;
      this.gameState = gameInstance.gameState;
      this.players = gameInstance.players;
      this.spectators = gameInstance.spectators;
    }
  }

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
    this.spectators = this.spectators.filter((s) => s.userId !== userId);
  }

  stopLevel() {
    this.gameMode = null;
    this.gameState = null;
    this.players = [];
    this.spectators = [];
    if (this.gameInstanceMetadata) {
      this.gameInstanceMetadata.sessionState = GameSessionState.EndingLevel;
    }
  }

  getPlayer(userId: string | null): TPlayer | null {
    return this.players.find((p) => p.userId === userId) ?? null;
  }

  getSpectator(userId: string | null): TSpectator | null {
    return this.spectators.find((s) => s.userId === userId) ?? null;
  }

  isHost(userId: string | null): boolean {
    return this.gameInstanceMetadata?.createdBy === userId;
  }

  isPlayer(userId: string | null): boolean {
    return this.players.some((p) => p.userId === userId);
  }

  isSpectator(userId: string | null): boolean {
    return this.spectators.some((s) => s.userId === userId);
  }
}
