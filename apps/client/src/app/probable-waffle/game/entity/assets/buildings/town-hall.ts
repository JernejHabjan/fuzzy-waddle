import { Building, BuildingInfoDefinition } from './building';
import { ProductionComponent } from '../../building/production/production-component';
import { Warrior } from '../characters/warrior';
import { Worker } from '../characters/worker';
import { CostData } from '../../building/production/production-cost-component';
import { PaymentType } from '../../building/payment-type';
import { Resources, ResourceType } from '../../economy/resource/resource-type';
import { ContainerComponent } from '../../building/container-component';
import { ResourceDrainComponent } from '../../economy/resource/resource-drain-component';

export const TownHallDefinition: BuildingInfoDefinition = {
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

export class TownHall extends Building {
  buildingInfoDefinition: BuildingInfoDefinition = TownHallDefinition;

  override init() {
    super.init();
    this.components.addComponent(new ProductionComponent(this, [Warrior, Worker], 2, 3));
    this.components.addComponent(new ContainerComponent(10));
    this.components.addComponent(new ResourceDrainComponent(this, [Resources.minerals]));
  }
}
