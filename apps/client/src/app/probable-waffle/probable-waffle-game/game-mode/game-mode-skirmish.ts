import { GameMode } from './game-mode';
import { Limitations } from './limitations';
import { VictoryCondition, VictoryConditions } from './victory-conditions';
import { PlayerController } from '../controllers/player-controller';
import { EventEmitter } from '@angular/core';

export class GameModeSkirmish extends GameMode {
  constructor(
    private gameSpeed = 1,
    // allow only certain units, buildings, upgrades, etc.
    private limitations: Limitations = new Limitations(),
    private victoryConditions?: VictoryConditions
  ) {
    super();

    if (!victoryConditions) {
      // todo
      this.victoryConditions = new VictoryConditions(VictoryCondition.NONE, 0);
    }
  }

  // events:
  playerJoined: EventEmitter<PlayerController> = new EventEmitter();
  playerLeft: EventEmitter<PlayerController> = new EventEmitter();

  handleStartingNewPlayer(): void {
    // todo
  }

  startNewGame(): void {
    this.createTeamVisionForAllTeams();
    this.createAiControllers();
    this.createPlayerControllers();
    this.createGameStateForPlayers();
    this.assignTeamVisionToControllers();
  }

  endGame(): void {
    // todo
  }

  private createTeamVisionForAllTeams(): void {
    // todo
  }
  private createAiControllers() {
    // 1. create controller
    // 2. call RestartPlayerAtPlayerStart
  }

  private createPlayerControllers() {
    // 1. create controller
    // 2. call RestartPlayerAtPlayerStart
  }

  private RestartPlayerAtPlayerStart(player: PlayerController): void {
    // find player start and place him there
    // assign team index
    // spawn any additional start buildings and units
    // transfer ownership of pre-placed units
  }

  private createGameStateForPlayers() {
    // todo
  }

  private assignTeamVisionToControllers() {
    // todo
  }
  isGameOver(): boolean {
    return false;
  }

  loadGameState(): void {
    // todo
  }
}
