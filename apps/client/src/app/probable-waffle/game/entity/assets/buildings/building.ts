import { RepresentableActor_old, RepresentableActorDefinition } from "../../actor/representable-actor_old";
import { TilePlacementData_old } from "../../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { PlayerController_old } from "../../../world/managers/controllers/player-controller_old";
import { PawnInfoDefinition } from "../../actor/character_old";
import { ConstructionSiteDefinition } from "../../building/construction/construction-site-component";
import { Scene } from "phaser";

export type BuildingInfoDefinition = PawnInfoDefinition & {
  constructionSiteDefinition: ConstructionSiteDefinition;
};

// used for actors that don't move
export abstract class Building extends RepresentableActor_old {
  abstract buildingInfoDefinition: BuildingInfoDefinition;
  representableActorDefinition!: RepresentableActorDefinition;

  // make it public constructor

  constructor(scene: Scene, tilePlacementData: TilePlacementData_old) {
    super(scene, tilePlacementData);
  }

  override init() {
    super.init();

    this.representableActorDefinition = this.buildingInfoDefinition;
    // this.cost = this.buildingInfoDefinition.cost ?? CostData.NoCost;
  }

  override initComponents(): void {
    super.initComponents();

    // this.components.addComponent(new OwnerComponent(this as any));
    // this.components.addComponent(
    //   new ConstructionSiteComponent(this, this.buildingInfoDefinition.constructionSiteDefinition)
    // );
    // this.components.addComponent(new ProductionCostComponent(this.cost));
  }

  possess(playerController?: PlayerController_old) {
    if (!playerController) return;
    // this.components.findComponent(DEPRECATEDownerComponent).possess(playerController);
  }
}
