import { Actor } from '../actor';
import { SpritePlacementData } from '../sprite/sprite-helper';
import { ISpriteRepresentable, SpriteRepresentationComponent } from './sprite-representable-component';
import { ITransformable, TransformComponent } from './transformable-component';

/*
 * pawn includes just physical representation and move component, so it can move around, but no way how to move around
 */
export abstract class Pawn extends Actor implements ISpriteRepresentable, ITransformable {
  spriteRepresentationComponent: SpriteRepresentationComponent;
  transformComponent: TransformComponent;
  protected sprite: Phaser.GameObjects.Sprite;
  protected scene: Phaser.Scene;
  protected constructor(scene: Phaser.Scene, spritePlacementData: SpritePlacementData) {
    super();
    this.transformComponent = new TransformComponent(spritePlacementData.tilePlacementData);
    this.spriteRepresentationComponent = new SpriteRepresentationComponent(scene, spritePlacementData);
    this.spriteRepresentationComponent.subscribeToTransformEvents(this.transformComponent);
    this.sprite = this.spriteRepresentationComponent.sprite;
    this.scene = scene;
    this.subscribeToSceneDestroy();
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
