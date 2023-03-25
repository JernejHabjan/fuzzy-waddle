import { RepresentableActor, RepresentableActorDefinition } from '../../actor/representable-actor';
import { TilePlacementData } from '../../../world/managers/controllers/input/tilemap/tilemap-input.handler';
import { ResourceSource, ResourceSourceComponent } from '../../economy/resource/resource-source-component';
import { CharacterContainer, ContainerComponent } from '../../building/container-component';
import { Resources } from '../../economy/resource/resource-type';
import { Scene } from 'phaser';

export const MineralsDefinitions: RepresentableActorDefinition = {
  textureMapDefinition: {
    textureName: 'warrior',
    spriteSheet: {
      name: 'warrior',
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64
      }
    }
  }
};

export class Minerals extends RepresentableActor implements ResourceSource, CharacterContainer {
  containerComponent!: ContainerComponent;
  resourceSourceComponent!: ResourceSourceComponent;
  representableActorDefinition: RepresentableActorDefinition = MineralsDefinitions;

  constructor(scene: Scene, tilePlacementData: TilePlacementData) {
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
