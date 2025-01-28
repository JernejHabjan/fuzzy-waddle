import { IComponent } from "../../../core/component.service";
import { Subscription } from "rxjs";
import { SpriteHelper_old, SpritePlacementData } from "../sprite-helper_old";
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
    const spriteWorldPlacementInfo = SpriteHelper_old.getSpriteWorldPlacementInfo(
      spritePlacementData.tilePlacementData
    );
    this.sprite = this.scene.add.sprite(
      spriteWorldPlacementInfo.x,
      spriteWorldPlacementInfo.y,
      spritePlacementData.textureName
    );
    this.sprite.depth = spriteWorldPlacementInfo.depth;
  }

  init(): void {}

  destroy(): void {
    this.transformSubscription?.unsubscribe();
    this.sprite.destroy();
  }
}
