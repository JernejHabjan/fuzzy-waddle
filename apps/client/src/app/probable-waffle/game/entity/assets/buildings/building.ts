import { RepresentableActor, RepresentableActorDefinition } from '../../actor/representable-actor';
import { TilePlacementData } from '../../../world/managers/controllers/input/tilemap/tilemap-input.handler';
import { Ownable, OwnerComponent } from '../../actor/components/owner-component';
import { PlayerController } from '../../../world/managers/controllers/player-controller';
import { CostData, Costs, ProductionCostComponent } from '../../building/production/production-cost-component';
import { PawnInfoDefinition } from '../../actor/character';
import { Constructable, ConstructionSiteComponent, ConstructionSiteDefinition } from '../../building/construction/construction-site-component';

export type BuildingInfoDefinition = PawnInfoDefinition & {
  constructionSiteDefinition: ConstructionSiteDefinition;
};

// used for actors that don't move
export abstract class Building extends RepresentableActor implements Ownable, Costs, Constructable {
  abstract buildingInfoDefinition: BuildingInfoDefinition;
  representableActorDefinition!: RepresentableActorDefinition;
  ownerComponent!: OwnerComponent;
  productionCostComponent!: ProductionCostComponent;
  constructionSiteComponent!: ConstructionSiteComponent;

  // make it public constructor
  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData, private playerController: PlayerController) {
    super(scene, tilePlacementData);
  }

  override init(): void {
    this.representableActorDefinition = this.buildingInfoDefinition;

    super.init();
    this.ownerComponent = this.components.addComponent(new OwnerComponent(this.playerController));
    this.constructionSiteComponent = this.components.addComponent(
      new ConstructionSiteComponent(this, this.buildingInfoDefinition.constructionSiteDefinition)
    );
    const cost = this.buildingInfoDefinition.cost ?? CostData.NoCost;
    this.components.addComponent(new ProductionCostComponent(cost));
  }
}