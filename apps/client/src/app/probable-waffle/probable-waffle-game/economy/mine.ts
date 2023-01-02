import { RepresentableActor } from '../characters/representable-actor';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { TextureMapDefinition } from '../characters/movable-actor';
import { CharacterContainer, ContainerComponent } from '../buildings/container-component';
import { ResourceSource, ResourceSourceComponent } from '../buildings/resource-source-component';
import { Resources } from '../buildings/resource-type';

export const MineDefinitions: TextureMapDefinition = {
  textureName: 'warrior',
  spriteSheet: {
    name: 'warrior',
    frameConfig: {
      frameWidth: 64,
      frameHeight: 64
    }
  }
};

export class Mine extends RepresentableActor implements CharacterContainer, ResourceSource {
  resourceSourceComponent!: ResourceSourceComponent;
  containerComponent!: ContainerComponent;
  textureMapDefinition: TextureMapDefinition = MineDefinitions;

  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }

  override init() {
    super.init();
    this.containerComponent = this.components.addComponent(new ContainerComponent(2));
    this.resourceSourceComponent = this.components.addComponent(
      new ResourceSourceComponent(this, Resources.minerals, 100, 1, true, 2)
    ); // todo gatherer capacity duplicated
  }
}
