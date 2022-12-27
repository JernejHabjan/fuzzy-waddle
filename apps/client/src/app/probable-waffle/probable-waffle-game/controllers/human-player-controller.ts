import { PlayerController } from './player-controller';
import ScaleManager = Phaser.Scale.ScaleManager;

export class HumanPlayerController extends PlayerController {
  keyboardInput: KeyboardInput;
  mouseInput: MouseInput;
  scaleManager: ScaleManager;
  selectedActors: Actor[];
  // saved selections of this player
  controllGroups: ControllGroup[];

  hoveredActor: Actor;
  hoveredTileXY: TileXY;
  buildingBeingPlacedClass: typeof Building;

  buildingCursor: BuildingCursor;
  cancelBuildingPlacement() {
    throw new Error('Not implemented');
  }
  confirmBuildingPlacement() {
    // notifyBuildingPlacementConfirmed
    // issueBeginConstructionOrder(buildingBeingPlacedClass, hoveredPosition)
  }
  beginBuildingPlacement() {
    // spawn preview building with BuildingCursor
    throw new Error('Not implemented');
  }
}
