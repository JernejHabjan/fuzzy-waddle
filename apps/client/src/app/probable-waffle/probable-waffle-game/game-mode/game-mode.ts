import { GameState } from '../game-state/game-state';
import { VisionManager } from '../vision/vision-manager';

export enum GameModeState {
  // https://docs.unrealengine.com/4.27/en-US/InteractiveExperiences/Framework/GameMode/
  EnteringMap = 0,
  WaitingToStart = 1,
  InProgress = 2,
  ReadyToEnd = 3,
  WaitingPostMatch = 4,
  LeavingMap = 5,
  Aborted = 6
}

export abstract class GameMode {
  gameState: GameState;
  canGameBePaused = true;
  gameModeState: GameModeState;

  constructor() {
    this.gameModeState = GameModeState.WaitingToStart;

    const defaultVisionManager = new VisionManager();
    // todo when to create this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    this.gameState = new GameState(this, [], [], defaultVisionManager);
  }

  abstract startNewGame(): void;
  abstract endGame(): void;
  abstract handleStartingNewPlayer(): void;
}
