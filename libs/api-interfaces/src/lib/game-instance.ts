import { GameInstanceMetadata } from './game-instance-metadata';
import { GameModeBase } from './game-mode-base';
import { BaseGameState, BasePlayerController, BasePlayerState, BaseSpectator, GameSessionState } from './game-mode';

/**
 * Lives from lobby start to score screen
 */
export abstract class GameInstance<
  TGameMode extends GameModeBase = GameModeBase,
  TGameInstanceMetadata extends GameInstanceMetadata = GameInstanceMetadata,
  TGameState extends BaseGameState = BaseGameState,
  TPayerState extends BasePlayerState = BasePlayerState,
  TPlayerController extends BasePlayerController = BasePlayerController,
  TSpectator extends BaseSpectator = BaseSpectator
> {
  gameMode: TGameMode | null = null;
  gameInstanceMetadata: TGameInstanceMetadata | null = null;
  gameState: TGameState | null = null;
  playerStates: TPayerState[] = [];
  playerControllers: TPlayerController[] = [];
  spectators: TSpectator[] = [];

  protected initMetadata(gameInstanceMetadata: TGameInstanceMetadata) {
    this.gameInstanceMetadata = gameInstanceMetadata;
  }

  initGame(gameMode: TGameMode, gameState: TGameState) {
    this.gameMode = gameMode;
    this.gameState = gameState;
  }

  initPlayer(playerState: TPayerState, playerController: TPlayerController) {
    this.playerStates.push(playerState);
    this.playerControllers.push(playerController);
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
    this.playerStates = [];
    this.playerControllers = [];
    this.spectators = [];
    if (this.gameInstanceMetadata) {
      this.gameInstanceMetadata.sessionState = GameSessionState.EndingLevel;
    }
  }
}
