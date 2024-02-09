import { IComponent } from "../../../core/component.service";
import { Subscription } from "rxjs";
import { SpriteHelper, SpritePlacementData } from "../sprite-helper";
import { TransformComponent } from "./transformable-component";
import { Actor } from "../actor";
import { GameObjects, Scene } from "phaser";

export class SpriteRepresentationComponent implements IComponent {
  scene: Scene;
  sprite: GameObjects.Sprite;
  private transformSubscription?: Subscription;

  constructor(
    private actor: Actor,
    scene: Scene,
    spritePlacementData: SpritePlacementData
  ) {
    this.scene = scene;
    const spriteWorldPlacementInfo = SpriteHelper.getSpriteWorldPlacementInfo(spritePlacementData.tilePlacementData);
    this.sprite = this.scene.add.sprite(
      spriteWorldPlacementInfo.x,
      spriteWorldPlacementInfo.y,
      spritePlacementData.textureName
    );
    this.sprite.depth = spriteWorldPlacementInfo.depth;
  }

  subscribeToTransformEvents(transformComponent: TransformComponent): void {
    // todo? this.transformSubscription = transformComponent.onTransformChanged.subscribe(
    // todo?   ([tilePlacementData, spriteWorldPlacementInfo]) => {
    // todo?     this.sprite.x = spriteWorldPlacementInfo.x;
    // todo?     this.sprite.y = spriteWorldPlacementInfo.y;
    // todo?     this.sprite.depth = spriteWorldPlacementInfo.depth;
    // todo?   }
    // todo? );
  }

  init(): void {
    const transformComponent = this.actor.components.findComponentOrNull(TransformComponent);
    if (transformComponent) {
      this.subscribeToTransformEvents(transformComponent);
    }
  }

  destroy(): void {
    this.transformSubscription?.unsubscribe();
    this.sprite.destroy();
  }
}
