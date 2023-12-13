// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BushDownwardsLarge extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Circle(0, -14, 24), Phaser.Geom.Circle.Contains);

    // outside_foliage_bushes_bush_downwards_large
    const outside_foliage_bushes_bush_downwards_large = scene.add.image(
      0,
      -16.716490870088737,
      "outside",
      "foliage/bushes/bush_downwards_large.png"
    );
    outside_foliage_bushes_bush_downwards_large.setOrigin(0.5, 0.4888048301548635);
    this.add(outside_foliage_bushes_bush_downwards_large);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      // shake the bush fast (distort the image)
      if (this.playingTween) return;
      this.playingTween = true;
      this.scene.tweens.add({
        targets: outside_foliage_bushes_bush_downwards_large,
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

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
