import { RepresentableActor } from '../characters/representable-actor';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { TextureMapDefinition } from '../characters/movable-actor';
import { CharacterContainer, ContainerComponent } from '../buildings/container-component';
import { Resources } from '../buildings/resource-type';
import { ResourceDrain, ResourceDrainComponent } from '../buildings/resource-drain-component';
import { PlacementRestrictionComponent, PlaceRestricted } from '../buildings/placement-restriction-component';
import { Minerals } from './minerals';

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

export class Mine extends RepresentableActor implements CharacterContainer, ResourceDrain, PlaceRestricted {
  resourceDrainComponent!: ResourceDrainComponent;
  containerComponent!: ContainerComponent;
  placementRestrictionComponent!: PlacementRestrictionComponent;
  textureMapDefinition: TextureMapDefinition = MineDefinitions;

  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }

  override init() {
    super.init();
    this.containerComponent = this.components.addComponent(new ContainerComponent(2));
    this.resourceDrainComponent = this.components.addComponent(new ResourceDrainComponent(this, [Resources.minerals]));
    this.placementRestrictionComponent = this.components.addComponent(
      new PlacementRestrictionComponent(this, [Minerals])
    );
  }
}
