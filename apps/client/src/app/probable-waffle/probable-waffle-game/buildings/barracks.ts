import { Building } from './building';
import { TextureMapDefinition } from '../characters/movable-actor';
import { Producer, ProductionComponent } from './production-component';
import { Warrior } from '../characters/warrior';
import { Worker } from '../characters/worker';

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
  }
}
