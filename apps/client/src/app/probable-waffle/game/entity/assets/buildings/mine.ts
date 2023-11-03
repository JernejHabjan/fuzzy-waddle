import { ContainerComponent } from '../../building/container-component';
import { Resources, ResourceType } from '../../economy/resource/resource-type';
import { ResourceDrainComponent } from '../../economy/resource/resource-drain-component';
import { PlacementRestrictionComponent } from '../../building/placement-restriction-component';
import { Minerals } from '../resources/minerals';
import { Building, BuildingInfoDefinition } from './building';
import { CostData } from '../../building/production/production-cost-component';
import { PaymentType } from '../../building/payment-type';

export const MineDefinitions: BuildingInfoDefinition = {
  textureMapDefinition: {
    textureName: 'warrior',
    spriteSheet: {
      name: 'mine',
      path: 'general/mine/',
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

export class Mine extends Building {
  buildingInfoDefinition: BuildingInfoDefinition = MineDefinitions;

  override initComponents() {
    super.initComponents();

    this.components.addComponent(new ContainerComponent(2));
    this.components.addComponent(new ResourceDrainComponent(this, [Resources.minerals]));
    this.components.addComponent(new PlacementRestrictionComponent(this, [Minerals]));
  }
}
