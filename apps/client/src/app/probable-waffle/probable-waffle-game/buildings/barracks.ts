import { Building } from './building';
import { TextureMapDefinition } from '../characters/movable-actor';
import { Producer, ProductionComponent } from './production-component';
import { Warrior, WarriorDefinition } from '../characters/warrior';
import { Worker } from '../characters/worker';
import { CostData } from './production-cost-component';

export const BarracksTextureMapDefinition: TextureMapDefinition = {
  textureName: 'warrior',
  spriteSheet: {
    name: 'warrior',
    frameConfig: {
      frameWidth: 64,
      frameHeight: 64
    }
  }
};

export class Barracks extends Building implements Producer {
  productionComponent!: ProductionComponent;
  textureMapDefinition: TextureMapDefinition = BarracksTextureMapDefinition;

  override init() {
    super.init();
    this.productionComponent = this.components.addComponent(new ProductionComponent(this, [Warrior, Worker], 2, 3));

    setTimeout(() => {
      this.productionComponent.startProduction({ actorClass: Warrior, costData: WarriorDefinition.cost as CostData });
      console.log('started production of 1 warrior');
    }, 1000);
  }
}
