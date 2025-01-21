import { Character_old } from "./character_old";
import { TilePlacementData_old } from "../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { DEPRECATEDownerComponent } from "./components/DEPRECATEDowner-component";
import { CostData, ProductionCostComponent } from "../building/production/production-cost-component";
import { Scene } from "phaser";
import { PlayerController_old } from "../../world/managers/controllers/player-controller_old";

export abstract class PlayerCharacter extends Character_old {
  cost!: CostData;

  // making constructor public
  constructor(scene: Scene, tilePlacementData: TilePlacementData_old) {
    super(scene, tilePlacementData);
  }

  override init() {
    super.init();

    this.cost = this.pawnDefinition.cost ?? CostData.NoCost;
  }

  override initComponents() {
    super.initComponents();

    this.components.addComponent(new DEPRECATEDownerComponent());
    this.components.addComponent(new ProductionCostComponent(this.cost));
  }

  possess(playerController?: PlayerController_old) {
    if (!playerController) return;
    this.components.findComponent(DEPRECATEDownerComponent).possess(playerController);
  }
}
