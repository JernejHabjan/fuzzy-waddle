// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../../data/object-names";
import { EffectsAnims } from "../../../animations/effects";
/* END-USER-IMPORTS */

export default class SkaduweeMagicianFemale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.57118202562538);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);

    // skaduwee_magician_female_idle_down
    const skaduwee_magician_female_idle_down = scene.add.sprite(0, -25.571183923696843, "magician_female_idle", 4);
    skaduwee_magician_female_idle_down.play("skaduwee_magician_female_idle_down");
    this.add(skaduwee_magician_female_idle_down);

    /* START-USER-CTR-CODE */
    this.skaduwee_magician_female_idle_down = skaduwee_magician_female_idle_down;
    this.on("pointerdown", () => {
      this.playTestAttackAnim();
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.SkaduweeMagicianFemale;
  private skaduwee_magician_female_idle_down: Phaser.GameObjects.Sprite;

  private playTestAttackAnim() {
    const x = this.x;
    const y = this.y - this.skaduwee_magician_female_idle_down.height / 4;

    // get 0-23 random number
    const randomFrame = Math.floor(Math.random() * 24);
    const impactSprite = EffectsAnims.createAndPlayEffectAnimation(this.scene, "impact_" + randomFrame, x, y);
    impactSprite.depth = this.depth + 1;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
