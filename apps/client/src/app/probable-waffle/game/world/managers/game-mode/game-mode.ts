import { GameState } from '../game-state/game-state';
import { VisionManager } from '../../map/vision/vision-manager';
import { ActorAbleToBeBuilt, ActorAbleToBeBuiltClass } from '../../../entity/actor/components/builder-component';
import { PlayerController } from '../controllers/player-controller';
import { TilePlacementData } from '../controllers/input/tilemap/tilemap-input.handler';
import { Scene } from 'phaser';

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

    // todo assign scene
  }

  abstract startNewGame(): void;

  abstract endGame(): void;

  abstract handleStartingNewPlayer(): void;

  spawnActorForPlayer(
    scene: Scene,
    buildingClass: ActorAbleToBeBuiltClass,
    targetLocation: TilePlacementData,
    playerController?: PlayerController
  ): ActorAbleToBeBuilt {
    const building = new buildingClass(scene, targetLocation); // todo
    building.registerGameObject();
    building.possess(playerController);
    // this.gameState.addActor(building); // todo
    // todo initialize actor and register it to loop
    return building;
  }
}
