// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class BushDownwardsSmall extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "foliage/bushes/bush_downwards_small.png");

    this.setInteractive(new Phaser.Geom.Ellipse(34, 40, 54, 36), Phaser.Geom.Ellipse.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x468c41
        } satisfies ObjectDescriptorDefinition)
      ],
      []
    );
    this.on("pointerdown", () => {
      // shake the bush fast (distort the image)
      if (this.playingTween) return;
      this.playingTween = true;
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          this.playingTween = false;
        }
      });
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private playingTween = false;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
