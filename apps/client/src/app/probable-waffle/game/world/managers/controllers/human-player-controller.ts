import { PlayerController } from "./player-controller";
import { Scale } from "phaser";
import { Building } from "../../../entity/assets/buildings/building";
import { BuildingCursor } from "./building-cursor";
import { Actor } from "../../../entity/actor/actor";
import { TilePlacementData } from "./input/tilemap/tilemap-input.handler";
import { ControlGroup } from "./control-group";

export class HumanPlayerController extends PlayerController {
  scaleManager!: Scale.ScaleManager;
  selectedActors?: Actor[];
  // saved selections of this player
  controlGroups?: ControlGroup[];

  hoveredActor?: Actor;
  hoveredTileXY?: TilePlacementData;
  buildingBeingPlacedClass?: typeof Building;

  buildingCursor?: BuildingCursor;

  cancelBuildingPlacement() {
    throw new Error("Not implemented");
  }

  confirmBuildingPlacement() {
    // notifyBuildingPlacementConfirmed
    // issueBeginConstructionOrder(buildingBeingPlacedClass, hoveredPosition)
  }

  beginBuildingPlacement() {
    // spawn preview building with BuildingCursor
    throw new Error("Not implemented");
  }
}
