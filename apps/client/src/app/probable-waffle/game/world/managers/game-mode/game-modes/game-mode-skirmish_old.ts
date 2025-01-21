import { GameMode } from "../game-mode";
import { Limitations } from "../limitations";
import { VictoryCondition, VictoryConditions } from "../victory-conditions";
import { PlayerController_old } from "../../controllers/player-controller_old";
import { EventEmitter } from "@angular/core";
import { PlayerAiControllerOld } from "../../controllers/player-ai-controller-old";

export class GameModeSkirmish_old extends GameMode {
  // events:
  playerJoined: EventEmitter<PlayerController_old> = new EventEmitter();
  playerLeft: EventEmitter<PlayerController_old> = new EventEmitter();

  constructor(
    private gameSpeed = 1,
    // allow only certain units, building, upgrades, etc.
    private limitations: Limitations = new Limitations(),
    private victoryConditions?: VictoryConditions
  ) {
    super();

    if (!victoryConditions) {
      // todo
      this.victoryConditions = new VictoryConditions(VictoryCondition.NONE, 0);
    }
  }

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

  isGameOver(): boolean {
    return false;
  }

  loadGameState(): void {
    // todo
  }

  private createTeamVisionForAllTeams(): void {
    // todo
  }

  private createAiControllers() {
    // 1. create controller
    // 2. call RestartPlayerAtPlayerStart
    const aiControllerTest = new PlayerAiControllerOld(); // todo just for test
  }

  private createPlayerControllers() {
    // 1. create controller
    // 2. call RestartPlayerAtPlayerStart
  }

  private RestartPlayerAtPlayerStart(player: PlayerController_old): void {
    // find player start and place him there
    // assign team index
    // spawn any additional start building and units
    // transfer ownership of pre-placed units
  }

  private createGameStateForPlayers() {
    // todo
  }

  private assignTeamVisionToControllers() {
    // todo
  }
}
