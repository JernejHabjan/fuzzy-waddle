// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent } from "../../../entity/actor/components/owner-component";
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
    setActorData(this, [new OwnerComponent(this)], []);

    this.skaduwee_magician_female_idle_down = skaduwee_magician_female_idle_down;
    this.on("pointerdown", () => {
      skaduwee_magician_female_idle_down.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        skaduwee_magician_female_idle_down.clearTint();
      }, 1000);

      // and play anim skaduwee_worker_male_slash_down
      skaduwee_magician_female_idle_down.play("skaduwee_magician_female_cast_down", true);
      this.playTestAttackAnim();

      // after anim complete, remove tint
      skaduwee_magician_female_idle_down.once("animationcomplete", () => {
        skaduwee_magician_female_idle_down.clearTint();
        skaduwee_magician_female_idle_down.play("skaduwee_magician_female_idle_down", true);
      });
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private skaduwee_magician_female_idle_down: Phaser.GameObjects.Sprite;

  private playTestAttackAnim() {
    // create a sprite
    const animAttack = this.scene.add.sprite(
      this.x,
      this.y - this.skaduwee_magician_female_idle_down.height / 4,
      "effects_1",
      "impact/1/1/0.png"
    );
    animAttack.depth = this.depth + 1;
    // get 0-23 random number
    const randomFrame = Math.floor(Math.random() * 24);
    animAttack.play("impact_" + randomFrame);

    // remove sprite after anim complete
    animAttack.once("animationcomplete", () => {
      animAttack.destroy();
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
