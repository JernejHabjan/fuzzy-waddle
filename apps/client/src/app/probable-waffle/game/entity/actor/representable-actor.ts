import { Actor } from './actor';
import { ISpriteRepresentable, SpriteRepresentationComponent } from './components/sprite-representable-component';
import { ITransformable, TransformComponent } from './components/transformable-component';
import { TilePlacementData } from '../../world/managers/controllers/input/tilemap/tilemap-input.handler';

export type RepresentableActorDefinition = {
  textureMapDefinition: TextureMapDefinition;
};

export type TextureMapDefinition = {
  textureName: string;
  spriteSheet: {
    name: string;
    frameConfig: {
      frameWidth: number;
      frameHeight: number;
    };
  };
};

/*
 * pawn includes just physical representation and move component, so it can move around, but no way how to move around
 */
export abstract class RepresentableActor extends Actor implements ISpriteRepresentable, ITransformable {
  spriteRepresentationComponent!: SpriteRepresentationComponent;
  transformComponent!: TransformComponent;
  abstract representableActorDefinition: RepresentableActorDefinition;

  protected constructor(private scene: Phaser.Scene, private tilePlacementData: TilePlacementData) {
    super();
    this.initActor();
  }

  initActor() {
    this.transformComponent = this.components.addComponent(new TransformComponent(this.tilePlacementData));
    this.subscribeToSceneDestroy();
  }

  override init() {
    super.init();

    this.spriteRepresentationComponent = this.components.addComponent(
      new SpriteRepresentationComponent(this, this.scene, {
        textureName: this.representableActorDefinition.textureMapDefinition.textureName,
        tilePlacementData: this.transformComponent.tilePlacementData
      })
    );
  }

  override destroy() {
    super.destroy();
    this.spriteRepresentationComponent.destroy();
  }

  private subscribeToSceneDestroy() {
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
  }
}
