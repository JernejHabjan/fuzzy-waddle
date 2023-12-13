// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BushDownwardsSmall extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Ellipse(2, -9, 54, 36), Phaser.Geom.Ellipse.Contains);

    // outside_foliage_bushes_bush_downwards_small
    const outside_foliage_bushes_bush_downwards_small = scene.add.image(
      0,
      -16,
      "outside",
      "foliage/bushes/bush_downwards_small.png"
    );
    this.add(outside_foliage_bushes_bush_downwards_small);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      // shake the bush fast (distort the image)
      if (this.playingTween) return;
      this.playingTween = true;
      this.scene.tweens.add({
        targets: outside_foliage_bushes_bush_downwards_small,
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
