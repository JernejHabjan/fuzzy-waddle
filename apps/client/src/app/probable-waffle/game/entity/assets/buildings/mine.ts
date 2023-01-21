import { CharacterContainer, ContainerComponent } from '../../building/container-component';
import { Resources, ResourceType } from '../../economy/resource/resource-type';
import { ResourceDrain, ResourceDrainComponent } from '../../economy/resource/resource-drain-component';
import { PlacementRestrictionComponent, PlaceRestricted } from '../../building/placement-restriction-component';
import { Minerals } from '../resources/minerals';
import { Building, BuildingInfoDefinition } from './building';
import { CostData } from '../../building/production/production-cost-component';
import { PaymentType } from '../../building/payment-type';

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
    finishedSound: 'building-finished' // todo
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