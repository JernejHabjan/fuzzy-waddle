import { GameStateEditor } from '../../game-state/game-states/game-state-editor';
import { GameMode } from '../game-mode';

export interface EditableGameMode {
  isEditor: boolean;
}
export class GameModeEditor extends GameMode implements EditableGameMode {
  isEditor = true;

  startNewGame(): void {
    this.gameState = new GameStateEditor(); // todo
  }
  endGame(): void {
    // todo
  }

  handleStartingNewPlayer(): void {
    // todo
  }
}
