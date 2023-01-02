import { Building } from './building';
import { Producer, ProductionComponent } from './production-component';
import { Warrior, WarriorDefinition } from '../characters/warrior';
import { Worker } from '../characters/worker';
import { CostData } from './production-cost-component';
import { CharacterDefinition } from '../characters/character';
import { PaymentType } from './payment-type';
import { Resources, ResourceType } from './resource-type';
import { CharacterContainer, ContainerComponent } from './container-component';

export const BarracksDefinition: CharacterDefinition = {
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
    20,
    new Map<ResourceType, number>([
      [Resources.wood, 50],
      [Resources.stone, 50]
    ]),
    0.5
  ),
  healthDefinition: {
    maxHealth: 200
  },
  soundDefinition: {}
};

export class Barracks extends Building implements Producer, CharacterContainer {
  productionComponent!: ProductionComponent;
  characterDefinition: CharacterDefinition = BarracksDefinition;
  containerComponent!: ContainerComponent;

  override init() {
    super.init();
    this.productionComponent = this.components.addComponent(new ProductionComponent(this, [Warrior, Worker], 2, 3));

    this.containerComponent = this.components.addComponent(new ContainerComponent(10));

    setTimeout(() => {
      this.productionComponent.startProduction({ actorClass: Warrior, costData: WarriorDefinition.cost as CostData });
      console.log('started production of 1 warrior');
    }, 1000);
  }
}
