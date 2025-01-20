// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorDataFromName } from "../../../data/actor-data";
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class SkaduweeRangedFemale extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 57.72552038424459, texture || "ranged_female_idle", frame ?? 4);

		this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
		this.setOrigin(0.5, 0.9019612560038217);
		this.play("skaduwee_ranged_female_idle_down");

		/* START-USER-CTR-CODE */
    setActorDataFromName(this);

    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      this.play("skaduwee_ranged_female_shoot_down", true);
      // after anim complete, remove tint
      this.once("animationcomplete", () => {
        this.clearTint();
        this.play("skaduwee_ranged_female_idle_down", true);
      });
    });
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  name = ObjectNames.SkaduweeRangedFemale;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
