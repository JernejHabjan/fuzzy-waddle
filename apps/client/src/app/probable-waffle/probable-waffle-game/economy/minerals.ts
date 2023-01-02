import { RepresentableActor } from '../characters/representable-actor';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { TextureMapDefinition } from '../characters/movable-actor';
import { ResourceSource, ResourceSourceComponent } from '../buildings/resource-source-component';
import { CharacterContainer, ContainerComponent } from '../buildings/container-component';
import { Resources, ResourceType } from '../buildings/resource-type';

export const MineralsDefinitions: TextureMapDefinition = {
  textureName: 'warrior',
  spriteSheet: {
    name: 'warrior',
    frameConfig: {
      frameWidth: 64,
      frameHeight: 64
    }
  }
};

export class Minerals extends RepresentableActor implements ResourceSource, CharacterContainer {
  containerComponent!: ContainerComponent;
  resourceSourceComponent!: ResourceSourceComponent;
  textureMapDefinition: TextureMapDefinition = MineralsDefinitions;
  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }

  override init() {
    super.init();
    this.containerComponent = this.components.addComponent(new ContainerComponent(2));
    this.resourceSourceComponent = this.components.addComponent(
      new ResourceSourceComponent(this, Resources.minerals, 40, 2)
    );
  }
}
