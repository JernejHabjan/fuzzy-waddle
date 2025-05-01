// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../../data/object-names";
import { EffectsAnims } from "../../../animations/effects";
/* END-USER-IMPORTS */

export default class TivaraWorkerMale extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 56.45402439680805, texture || "tivara_worker_male_idle", frame ?? 4);

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.8820941312001258);
    this.play("tivara_worker_male_idle_down");

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      this.play("tivara_worker_male_slash_down", true);
      // after anim complete, remove tint
      this.once("animationcomplete", () => {
        this.clearTint();
        this.play("tivara_worker_male_idle_down", true);
      });

      this.testSpawnBlood();
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.TivaraWorkerMale;

  private testSpawnBlood() {
    const x = this.x;
    const y = this.y - this.height / 4;
    const randomBloodSplatter = Math.floor(Math.random() * 5) + 1;
    const impactSprite = EffectsAnims.createAndPlayEffectAnimation(
      this.scene,
      "blood_splatter_small_" + randomBloodSplatter,
      x,
      y
    );
    impactSprite.depth = this.depth + 1;
    impactSprite.scaleX = 0.5;
    impactSprite.scaleY = 0.5;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
