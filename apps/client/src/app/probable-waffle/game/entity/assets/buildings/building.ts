import { RepresentableActor, RepresentableActorDefinition } from "../../actor/representable-actor";
import { TilePlacementData } from "../../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { PlayerController } from "../../../world/managers/controllers/player-controller";
import { CostData } from "../../building/production/production-cost-component";
import { PawnInfoDefinition } from "../../actor/character";
import { ConstructionSiteDefinition } from "../../building/construction/construction-site-component";
import { Scene } from "phaser";

export type BuildingInfoDefinition = PawnInfoDefinition & {
  constructionSiteDefinition: ConstructionSiteDefinition;
};

// used for actors that don't move
export abstract class Building extends RepresentableActor {
  abstract buildingInfoDefinition: BuildingInfoDefinition;
  representableActorDefinition!: RepresentableActorDefinition;

  // make it public constructor
  private cost!: CostData;

  constructor(scene: Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }

  override init() {
    super.init();

    this.representableActorDefinition = this.buildingInfoDefinition;
    this.cost = this.buildingInfoDefinition.cost ?? CostData.NoCost;
  }

  override initComponents(): void {
    super.initComponents();

    // this.components.addComponent(new OwnerComponent(this as any));
    // this.components.addComponent(
    //   new ConstructionSiteComponent(this, this.buildingInfoDefinition.constructionSiteDefinition)
    // );
    // this.components.addComponent(new ProductionCostComponent(this.cost));
  }

  possess(playerController?: PlayerController) {
    if (!playerController) return;
    // this.components.findComponent(DEPRECATEDownerComponent).possess(playerController);
  }
}
