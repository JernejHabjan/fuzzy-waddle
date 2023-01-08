import { CharacterContainer, ContainerComponent } from '../buildings/container-component';
import { Resources, ResourceType } from '../buildings/resource-type';
import { ResourceDrain, ResourceDrainComponent } from '../buildings/resource-drain-component';
import { PlacementRestrictionComponent, PlaceRestricted } from '../buildings/placement-restriction-component';
import { Minerals } from './minerals';
import { Building, BuildingInfoDefinition } from '../buildings/building';
import { CostData } from '../buildings/production-cost-component';
import { PaymentType } from '../buildings/payment-type';

export const MineDefinitions: BuildingInfoDefinition = {
  textureMapDefinition: {
    textureName: 'warrior',
    spriteSheet: {
      name: 'warrior',
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64
      }
    }
  },
  cost: new CostData(
    PaymentType.PayOverTime,
    100,
    new Map<ResourceType, number>([
      [Resources.wood, 100],
      [Resources.stone, 100]
    ]),
    0.5
  ),
  healthDefinition: {
    maxHealth: 400
  },
  soundDefinition: {},
  constructionSiteDefinition: {
    constructionCosts: new Map<ResourceType, number>([
      [Resources.wood, 100],
      [Resources.stone, 100]
    ]),
    checkCollision: true,
    constructionCostType: PaymentType.PayOverTime,
    constructionTime: 100,
    consumesBuilders: false,
    maxAssignedBuilders: 3,
    progressMadeAutomatically: 0,
    progressMadePerBuilder: 1,
    initialHealthPercentage: 10,
    refundFactor: 0.5,
    startImmediately: false,
    gridWidthAndHeight: { width: 2, height: 2 },
    finishedSound: 'construction-finished' // todo
  }
};

export class Mine extends Building implements CharacterContainer, ResourceDrain, PlaceRestricted {
  resourceDrainComponent!: ResourceDrainComponent;
  containerComponent!: ContainerComponent;
  placementRestrictionComponent!: PlacementRestrictionComponent;
  buildingInfoDefinition: BuildingInfoDefinition = MineDefinitions;

  override init() {
    super.init();
    this.containerComponent = this.components.addComponent(new ContainerComponent(2));
    this.resourceDrainComponent = this.components.addComponent(new ResourceDrainComponent(this, [Resources.minerals]));
    this.placementRestrictionComponent = this.components.addComponent(
      new PlacementRestrictionComponent(this, [Minerals])
    );
  }
}
