import { Actor } from '../actor';
import { ISpriteRepresentable, SpriteRepresentationComponent } from './sprite-representable-component';
import { ITransformable, TransformComponent } from './transformable-component';
import { TextureMapDefinition } from './movable-actor';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';

/*
 * pawn includes just physical representation and move component, so it can move around, but no way how to move around
 */
export abstract class RepresentableActor extends Actor implements ISpriteRepresentable, ITransformable {
  spriteRepresentationComponent!: SpriteRepresentationComponent;
  transformComponent!: TransformComponent;
  protected sprite!: Phaser.GameObjects.Sprite;
  protected scene!: Phaser.Scene;
  abstract textureMapDefinition: TextureMapDefinition;

  protected constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData) {
    super();
    this.initActor(scene, tilePlacementData);
  }

  initActor(scene: Phaser.Scene, tilePlacementData: TilePlacementData) {
    this.transformComponent = new TransformComponent(tilePlacementData);
    this.scene = scene;
    this.subscribeToSceneDestroy();
  }

  override init() {
    super.init();

    this.spriteRepresentationComponent = new SpriteRepresentationComponent(this.scene, {
      textureName: this.textureMapDefinition.textureName,
      tilePlacementData: this.transformComponent.tilePlacementData
    });
    this.spriteRepresentationComponent.subscribeToTransformEvents(this.transformComponent);
    this.sprite = this.spriteRepresentationComponent.sprite;
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
