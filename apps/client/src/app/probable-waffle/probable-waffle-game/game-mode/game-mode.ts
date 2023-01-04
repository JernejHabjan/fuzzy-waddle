import { GameState } from '../game-state/game-state';
import { VisionManager } from '../vision/vision-manager';
import { ActorsAbleToBeBuilt, ActorsAbleToBeBuiltClass } from '../characters/builder-component';
import { PlayerController } from '../controllers/player-controller';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';

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
  scene!: Phaser.Scene;

  constructor() {
    this.gameModeState = GameModeState.WaitingToStart;

    const defaultVisionManager = new VisionManager();
    // todo when to create this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    this.gameState = new GameState(this, [], [], defaultVisionManager);

    // todo assign scene
  }

  abstract startNewGame(): void;

  abstract endGame(): void;

  abstract handleStartingNewPlayer(): void;

  spawnActorForPlayer(
    buildingClass: ActorsAbleToBeBuiltClass,
    playerController: PlayerController,
    targetLocation: TilePlacementData
  ): ActorsAbleToBeBuilt {
    const building = new buildingClass(this.scene, targetLocation, playerController); // todo
    // this.gameState.addActor(building); // todo
    // todo initialize actor and register it to loop
    return building;
  }
}
